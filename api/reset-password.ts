import { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin safely
const initializeFirebase = () => {
  if (getApps().length === 0) {
    try {
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
        
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        // Clean up accidental double quotes from copy-pasting into Vercel
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.substring(1, privateKey.length - 1);
        }
        // Fix newlines
        privateKey = privateKey.replace(/\\n/g, '\n');

        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey
          })
        });
        console.log("[Firebase Admin Vercel] Initialized Successfully!");
      }
    } catch (error) {
      console.error("[Firebase Admin Vercel] Initialization failed:", error);
    }
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers to prevent network errors if accessed cross-origin
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

  const { phone, countryCode, newPassword } = req.body;
  
  if (!phone || !countryCode || !newPassword) {
    return res.status(400).json({ success: false, error: "بيانات غير مكتملة" });
  }

  // Ensure initialized
  initializeFirebase();

  if (getApps().length === 0) {
    console.error("[Firebase Admin Vercel] Firebase not initialized! Missing env credentials.");
    return res.status(500).json({ success: false, error: "إعدادات Firebase Admin غير متوفرة في السيرفر" });
  }

  try {
    const dummyEmail = `${countryCode.replace('+', '')}${phone}@elite-store.local`;
    
    // Attempt to fetch the user by email
    const userRecord = await getAuth().getUserByEmail(dummyEmail);
    
    // Update the user's password
    await getAuth().updateUser(userRecord.uid, {
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
