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

  const { email, newPassword } = req.body;
  const trimmedEmail = (email || '').toString().trim().toLowerCase();
  const trimmedPass = (newPassword || '').toString().trim();

  if (!trimmedEmail || !trimmedPass) {
    return res.status(400).json({ success: false, error: "البريد الإلكتروني وكلمة المرور الجديدة مطلوبان" });
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
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(trimmedEmail);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        userRecord = await adminAuth.createUser({
          email: trimmedEmail,
          password: trimmedPass,
          emailVerified: true
        });
        return res.status(200).json({ success: true, message: "تم إنشاء حساب توثيق جديد", uid: userRecord.uid });
      }
      throw e;
    }

    await adminAuth.updateUser(userRecord.uid, {
      password: trimmedPass
    });

    return res.status(200).json({ success: true, message: "تم تحديث كلمة المرور بنجاح", uid: userRecord.uid });
  } catch (error: any) {
    console.error("[Admin Password Reset Error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
