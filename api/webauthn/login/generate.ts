import { VercelRequest, VercelResponse } from '@vercel/node';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import crypto from 'crypto';

function signChallenge(challenge: string, type: 'reg' | 'auth', id: string) {
  const secret = process.env.OTP_SECRET || 'fallback-secret-for-demo';
  const expires = Date.now() + 5 * 60 * 1000;
  const data = `${type}:${id}:${challenge}:${expires}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return `${sig}.${expires}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const rpID = req.headers.host === 'localhost:3000' ? 'localhost' : (req.headers.host || 'localhost').split(':')[0];
    const sessionId = req.headers['x-session-id'] as string || "anonymous";
    
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
    });
    
    const sessionToken = signChallenge(options.challenge, 'auth', sessionId);
    
    res.status(200).json({ ...options, sessionToken });
  } catch (error: any) {
    console.error('[WebAuthn] Generate Auth Error:', error);
    res.status(500).json({ error: error.message });
  }
}
