import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { phone, phones, message, isBulk } = req.body;

  if (!message || (!phone && !phones)) {
    return res.status(400).json({ success: false, error: "Phone(s) and message are required" });
  }

  const username = (process.env.SMSGATE_USERNAME || "").trim();
  const password = (process.env.SMSGATE_PASSWORD || "").trim();
  const deviceId = (process.env.SMSGATE_DEVICE_ID || "").trim();
  const targetUrl = (process.env.SMSGATE_URL || "https://api.sms-gate.app/3rdparty/v1/messages").trim();

  if (!username || !password || !deviceId) {
    return res.status(500).json({ success: false, error: "إعدادات الرسائل غير مكتملة" });
  }

  const formatPhone = (p: string) => {
    let cleanPhone = p.replace(/\D/g, '');
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
    if (cleanPhone.length === 9 && cleanPhone.startsWith('7')) cleanPhone = '967' + cleanPhone;
    else if (cleanPhone.length === 10 && cleanPhone.startsWith('07')) cleanPhone = '967' + cleanPhone.substring(1);
    return `+${cleanPhone}`;
  };

  const headers = {
    'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    if (phones && Array.isArray(phones)) {
      const promises = phones.map(async (p) => {
        try {
          return await axios.post(
            targetUrl,
            { message, phoneNumbers: [formatPhone(p)], deviceId },
            { headers, timeout: 8000 }
          );
        } catch (err) {
          console.error(`[Bulk SMS] Error formatting for ${p}`, err);
          return null;
        }
      });
      await Promise.allSettled(promises);
      return res.status(200).json({ success: true, message: "تمت معالجة الإرسال الجماعي" });
    } else if (phone) {
      const response = await axios.post(
        targetUrl,
        {
          message: message,
          phoneNumbers: [formatPhone(phone)],
          deviceId: deviceId,
          isUrgent: true
        },
        { headers, timeout: 20000 }
      );
      return res.status(200).json({ success: true, data: response.data });
    }
  } catch (error: any) {
    const errorDetail = error.response?.data || error.message;
    return res.status(500).json({ success: false, error: "فشل الإرسال", details: errorDetail });
  }
}
