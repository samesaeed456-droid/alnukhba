import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function getDb() {
  const adminApp = getApps()[0];
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.firestoreDatabaseId) {
      return getFirestore(adminApp, config.firestoreDatabaseId);
    }
  }
  return getFirestore(adminApp);
}

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0 && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.substring(1, privateKey.length - 1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    })
  });
}

function verifyChallengeSignature(challenge: string, type: 'reg' | 'auth', id: string, token: string) {
  const secret = process.env.OTP_SECRET || 'fallback-secret-for-demo';
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [sig, expiresStr] = parts;
  const expires = parseInt(expiresStr, 10);
  if (Date.now() > expires) return false;
  const data = `${type}:${id}:${challenge}:${expires}`;
  const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return sig === expectedSig;
}

function safeBuffer(data: any): Buffer {
  if (data instanceof Buffer) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);
  if (typeof data === 'string') {
    if (/^[A-Za-z0-9+/]*={0,2}$/.test(data) && data.length % 4 === 0) {
      try { return Buffer.from(data, 'base64'); } catch (e) { return Buffer.from(data); }
    }
    return Buffer.from(data);
  }
  if (Array.isArray(data)) return Buffer.from(data);
  return Buffer.alloc(0);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { response, challenge, sessionToken } = req.body;
  const sessionId = req.headers['x-session-id'] as string || "anonymous";

  if (!response || !challenge || !sessionToken) {
    return res.status(400).json({ error: 'بيانات غير مكتملة' });
  }

  if (!verifyChallengeSignature(challenge, 'auth', sessionId, sessionToken)) {
      return res.status(400).json({ error: 'جلسة تسجيل الدخول غير صالحة أو منتهية' });
  }

  try {
    const host = req.headers.host || 'localhost';
    const rpID = host.split(':')[0];
    const origin = req.headers.origin || (req.headers.host ? `https://${host}` : 'http://localhost');
    const passkeyId = response.id;

    if (getApps().length === 0) {
       return res.status(500).json({ error: 'Firebase Admin غير مفعل. لا يمكن استخراج البيانات.' });
    }

    const db = getDb();
    const passkeyDoc = await db.collection('passkeys').doc(passkeyId).get();

    if (!passkeyDoc.exists) {
      return res.status(400).json({ error: 'البصمة غير مسجلة في نظامنا' });
    }

    const passkeyData = passkeyDoc.data();
    if (!passkeyData || !passkeyData.credentialPublicKey || !passkeyData.credentialID) {
        return res.status(400).json({ error: 'بيانات البصمة مفقودة أو غير مكتملة' });
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkeyData.credentialID || response.id,
        publicKey: new Uint8Array(safeBuffer(passkeyData.credentialPublicKey)),
        counter: passkeyData.counter,
      },
    });

    if (verification.verified && verification.authenticationInfo) {
      const { newCounter } = verification.authenticationInfo;
      // Update counter
      await db.collection('passkeys').doc(passkeyId).update({ counter: newCounter });

      // Generate custom token for Firebase Client Auth
      const customToken = await getAuth().createCustomToken(passkeyData.uid || 'unknown');

      return res.status(200).json({ success: true, customToken });
    } else {
      return res.status(400).json({ error: 'فشل التوثيق من البصمة' });
    }
  } catch (error: any) {
    console.error('[WebAuthn] Verify Auth Error:', error);
    if (error.code === 'app/no-app') {
       return res.status(500).json({ error: 'Firebase Admin ليس معداً. لا يمكن إنشاء توكن الدخول' });
    }
    return res.status(500).json({ error: error.message });
  }
}
