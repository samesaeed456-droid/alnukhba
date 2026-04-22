import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import crypto from 'crypto';

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

  const { uid, response, challenge, sessionToken } = req.body;
  if (!uid || !response || !challenge || !sessionToken) {
    return res.status(400).json({ error: 'بيانات غير مكتملة' });
  }

  if (!verifyChallengeSignature(challenge, 'reg', uid, sessionToken)) {
      return res.status(400).json({ error: 'جلسة التسجيل غير صالحة أو منتهية' });
  }

  try {
    const host = req.headers.host || 'localhost';
    const rpID = host.split(':')[0];
    const origin = req.headers.origin || (req.headers.host ? `https://${host}` : 'http://localhost');
    
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      console.log('[WebAuthn] Full Registration Info:', JSON.stringify(verification.registrationInfo, (key, value) => 
        value instanceof Uint8Array ? Array.from(value) : value
      ));
      
      const { credential } = verification.registrationInfo;
      
      // We check for these specifically because we need them to authenticate later
      if (!credential || !credential.publicKey) {
          console.error('[WebAuthn] Missing credentialPublicKey in registrationInfo');
          return res.status(400).json({ error: 'لم يتم العثور على المفتاح العام (credentialPublicKey) في الرد.' });
      }
      if (!credential.id) {
          console.error('[WebAuthn] Missing credentialID in registrationInfo');
          return res.status(400).json({ error: 'لم يتم العثور على معرف المفتاح (credentialID) في الرد.' });
      }

      if (getApps().length === 0) {
        return res.status(500).json({ error: 'Firebase Admin غير مفعل كلياً' });
      }

      const passkeyId = response.id;
      const db = getFirestore();
      
      const savedData = {
        credentialPublicKey: safeBuffer(credential.publicKey).toString('base64'),
        credentialID: credential.id, // Store as is (Base64URLString)
        counter: credential.counter,
        uid,
        createdAt: new Date().toISOString()
      };

      await db.collection('passkeys').doc(passkeyId).set(savedData);

      res.status(200).json({ success: true });
    } else {
      console.error('[WebAuthn] Registration Verification Failed or Info Missing:', verification);
      res.status(400).json({ error: 'فشل التوثيق الحيوي: المتصفح لم يرسل البيانات المطلوبة بشكل صحيح.' });
    }
  } catch (error: any) {
    console.error('[WebAuthn] Verify Reg Error:', error);
    res.status(500).json({ error: error.message });
  }
}
