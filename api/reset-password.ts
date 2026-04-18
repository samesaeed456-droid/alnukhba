import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin safely
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_PROJECT_ID && (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY_ID)) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
        })
      });
      console.log("[Firebase Admin Vercel] Initialized Successfully!");
    }
  } catch (error) {
    console.error("[Firebase Admin Vercel] Initialization failed:", error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { phone, countryCode, newPassword } = req.body;
  
  if (!phone || !countryCode || !newPassword) {
    return res.status(400).json({ success: false, error: "بيانات غير مكتملة" });
  }

  if (!admin.apps.length) {
    return res.status(500).json({ success: false, error: "إعدادات Firebase Admin غير متوفرة في السيرفر" });
  }

  try {
    const dummyEmail = `${countryCode.replace('+', '')}${phone}@elite-store.local`;
    
    // Attempt to fetch the user by email
    const userRecord = await admin.auth().getUserByEmail(dummyEmail);
    
    // Update the user's password
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword
    });

    console.log(`[Firebase Admin Vercel] Password updated successfully for user: ${dummyEmail}`);
    return res.status(200).json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
    
  } catch (error: any) {
    console.error("[Firebase Admin Vercel] Password reset error:", error);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ success: false, error: "هذا الحساب غير موجود" });
    }
    return res.status(500).json({ success: false, error: "فشل تغيير كلمة المرور", details: error.message });
  }
}
