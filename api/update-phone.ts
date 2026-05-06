import { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { oldPhone, oldCountryCode, newPhone, newCountryCode } = req.body;
  
  if (!oldPhone || !newPhone) {
    return res.status(400).json({ success: false, error: "بيانات الهاتف مطلوبة" });
  }

  try {
    let app: App;
    if (getApps().length === 0) {
      let serviceAccount = null;
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.substring(1, privateKey.length - 1);
        }
        privateKey = privateKey.replace(/\\n/g, '\n');
        
        serviceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        };
      }

      if (!serviceAccount) {
        return res.status(500).json({ success: false, error: "إعدادات Firebase Admin غير متوفرة في السيرفر" });
      }

      app = initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      app = getApps()[0];
    }

    const adminAuth = getAuth(app);
    
    const cleanOldPhone = (oldPhone || '').toString().trim().replace(/\D/g, '').replace(/^0+/, '');
    const cleanNewPhone = (newPhone || '').toString().trim().replace(/\D/g, '').replace(/^0+/, '');
    const cleanOldCC = (oldCountryCode || '+967').toString().trim().replace(/\D/g, '');
    const cleanNewCC = (newCountryCode || '+967').toString().trim().replace(/\D/g, '');

    const oldEmail = `${cleanOldCC}${cleanOldPhone}@elite-store.local`.toLowerCase();
    const newEmail = `${cleanNewCC}${cleanNewPhone}@elite-store.local`.toLowerCase();
    
    try {
      const existingUser = await adminAuth.getUserByEmail(newEmail);
      if (existingUser) {
        return res.status(400).json({ success: false, error: "الرقم الجديد مسجل مسبقاً بحساب آخر" });
      }
    } catch (e) {}

    const userRecord = await adminAuth.getUserByEmail(oldEmail);
    await adminAuth.updateUser(userRecord.uid, {
      email: newEmail
    });

    return res.status(200).json({ success: true, message: "تم تحديث بيانات التوثيق بنجاح" });
  } catch (error: any) {
    console.error("[Update Phone Error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
