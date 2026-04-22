import { VercelRequest, VercelResponse } from '@vercel/node';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import crypto from 'crypto';

function signChallenge(challenge: string, type: 'reg' | 'auth', id: string) {
  const secret = process.env.OTP_SECRET || 'fallback-secret-for-demo';
  const expires = Date.now() + 5 * 60 * 1000;
  const data = `${type}:${id}:${challenge}:${expires}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return `${sig}.${expires}`;
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

  const { uid, email } = req.body;
  if (!uid || !email) return res.status(400).json({ error: 'Missing uid or email' });
  
  try {
    const host = req.headers.host || 'localhost';
    const rpID = host.split(':')[0];
    const rpName = 'Elite Store';

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: safeBuffer(uid),
      userName: email,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      }
    });
    
    const sessionToken = signChallenge(options.challenge, 'reg', uid);
    
    res.status(200).json({ ...options, sessionToken });
  } catch (error: any) {
    console.error('[WebAuthn] Generate Reg Error:', error);
    res.status(500).json({ error: error.message });
  }
}
