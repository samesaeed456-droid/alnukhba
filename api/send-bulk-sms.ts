import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { phones, message } = req.body;
  if (!phones || !Array.isArray(phones) || !message) {
    return res.status(400).json({ success: false, error: "Invalid bulk request" });
  }

  const username = (process.env.SMSGATE_USERNAME || "").trim();
  const password = (process.env.SMSGATE_PASSWORD || "").trim();
  const deviceId = (process.env.SMSGATE_DEVICE_ID || "").trim();
  const targetUrl = (process.env.SMSGATE_URL || "https://api.sms-gate.app/3rdparty/v1/messages").trim();

  if (!username || !password || !deviceId) {
    return res.status(500).json({ success: false, error: "إعدادات الرسائل غير مكتملة" });
  }

  // Vercel serverless functions have execution time limits (usually 10s on hobby plan)
  // For large bulk SMS, this might timeout if we do them sequentially.
  // We'll initiate the requests simultaneously (up to limits) but map them correctly.
  
  try {
    const promises = phones.map(async (phone) => {
      try {
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
        if (cleanPhone.length === 9 && cleanPhone.startsWith('7')) cleanPhone = '967' + cleanPhone;
        else if (cleanPhone.length === 10 && cleanPhone.startsWith('07')) cleanPhone = '967' + cleanPhone.substring(1);
        
        const formattedPhone = `+${cleanPhone}`;
        
        return axios.post(
          targetUrl,
          { message, phoneNumbers: [formattedPhone], deviceId },
          {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 8000
          }
        );
      } catch (err) {
        console.error(`[Bulk SMS] Error formatting for ${phone}`, err);
        return null;
      }
    });

    await Promise.allSettled(promises);
    return res.status(200).json({ success: true, message: "تمت معالجة الإرسال الجماعي" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "حدث خطأ أثناء الإرسال الجماعي" });
  }
}
