import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import crypto from 'crypto';

// Basic in-memory rate limiting against simple spam (per Vercel instance)
const ipRateLimit = new Map<string, { count: number, resetAt: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  // Rate limit check
  const rlConfig = ipRateLimit.get(clientIp);
  if (rlConfig) {
    if (now < rlConfig.resetAt) {
      if (rlConfig.count >= 3) {
        return res.status(429).json({ success: false, error: 'تم تجاوز الحد المسموح. يرجى المحاولة بعد قليل.' });
      }
      rlConfig.count++;
    } else {
      ipRateLimit.set(clientIp, { count: 1, resetAt: now + 60000 }); // 1 min window
    }
  } else {
    ipRateLimit.set(clientIp, { count: 1, resetAt: now + 60000 });
  }

  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, error: "رقم الجوال مطلوب" });
  }

  try {
    const username = (process.env.SMSGATE_USERNAME || "").trim();
    const password = (process.env.SMSGATE_PASSWORD || "").trim();
    const deviceId = (process.env.SMSGATE_DEVICE_ID || "").trim();
    const jwtSecret = process.env.OTP_SECRET || "elite-store-secure-hash-secret-2026";

    if (!username || !password || !deviceId) {
      return res.status(500).json({ success: false, error: "إعدادات الرسائل غير مكتملة" });
    }

    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
    if (cleanPhone.length === 9 && cleanPhone.startsWith('7')) cleanPhone = '967' + cleanPhone;
    else if (cleanPhone.length === 10 && cleanPhone.startsWith('07')) cleanPhone = '967' + cleanPhone.substring(1);

    const formattedPhone = `+${cleanPhone}`;
    const targetUrl = (process.env.SMSGATE_URL || "https://api.sms-gate.app/3rdparty/v1/messages").trim();
    
    // Generate secure OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Create Hash to verify later without exposing to client
    const expires = now + 5 * 60 * 1000; // 5 minutes
    const dataToHash = `${formattedPhone}.${otp}.${expires}`;
    const hash = crypto.createHmac('sha256', jwtSecret).update(dataToHash).digest('hex');
    const verificationToken = `${hash}.${expires}`;

    const appName = "متجر النخبة";
    const message = `كود التحقق الخاص بك في ${appName} هو: ${otp}`;

    await axios.post(
      targetUrl,
      {
        message: message,
        phoneNumbers: [formattedPhone],
        deviceId: deviceId,
        isUrgent: true
      },
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    res.status(200).json({ success: true, token: verificationToken });
  } catch (error: any) {
    const errorDetail = error.response?.data || error.message;
    console.error("[send-otp error]", errorDetail);
    res.status(500).json({ success: false, error: "فشل إرسال رسالة التحقق", details: errorDetail });
  }
}
