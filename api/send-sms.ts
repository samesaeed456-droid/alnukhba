import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ success: false, error: "Phone and message are required" });
  }

  try {
    const username = (process.env.SMSGATE_USERNAME || "").trim();
    const password = (process.env.SMSGATE_PASSWORD || "").trim();
    const deviceId = (process.env.SMSGATE_DEVICE_ID || "").trim();

    if (!username || !password || !deviceId) {
      return res.status(500).json({ success: false, error: "إعدادات الرسائل غير مكتملة" });
    }

    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
    if (cleanPhone.length === 9 && cleanPhone.startsWith('7')) cleanPhone = '967' + cleanPhone;
    else if (cleanPhone.length === 10 && cleanPhone.startsWith('07')) cleanPhone = '967' + cleanPhone.substring(1);

    const formattedPhone = `+${cleanPhone}`;
    const targetUrl = (process.env.SMSGATE_URL || "https://api.sms-gate.app/3rdparty/v1/messages").trim();
    
    const response = await axios.post(
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
        timeout: 20000
      }
    );

    res.status(200).json({ success: true, data: response.data });
  } catch (error: any) {
    const errorDetail = error.response?.data || error.message;
    res.status(500).json({ success: false, error: "فشل إرسال الرسالة", details: errorDetail });
  }
}
