import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { phone, otp, token } = req.body;
  if (!phone || !otp || !token) {
    return res.status(400).json({ success: false, error: "بيانات التحقق غير مكتملة" });
  }

  try {
    const jwtSecret = process.env.OTP_SECRET || "elite-store-secure-hash-secret-2026";
    
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
    if (cleanPhone.length === 9 && cleanPhone.startsWith('7')) cleanPhone = '967' + cleanPhone;
    else if (cleanPhone.length === 10 && cleanPhone.startsWith('07')) cleanPhone = '967' + cleanPhone.substring(1);
    const formattedPhone = `+${cleanPhone}`;

    const parts = token.split('.');
    if (parts.length !== 2) {
      return res.status(400).json({ success: false, error: "كود التحقق غير صالح" });
    }

    const [hashValue, expiresStr] = parts;
    const expires = parseInt(expiresStr, 10);

    if (Date.now() > expires) {
      return res.status(400).json({ success: false, error: "انتهت صلاحية الكود. يرجى طلب كود جديد." });
    }

    const dataToHash = `${formattedPhone}.${otp}.${expires}`;
    const expectedHash = crypto.createHmac('sha256', jwtSecret).update(dataToHash).digest('hex');

    if (hashValue === expectedHash) {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ success: false, error: "كود التحقق غير صحيح" });
    }
  } catch (error) {
    console.error("[verify-otp error]", error);
    res.status(500).json({ success: false, error: "حدث خطأ داخلي في الخادم أثناء التحقق" });
  }
}
