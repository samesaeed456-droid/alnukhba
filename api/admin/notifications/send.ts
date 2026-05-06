import { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin safely
const initializeFirebase = () => {
  if (getApps().length === 0) {
    try {
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.substring(1, privateKey.length - 1);
        }
        privateKey = privateKey.replace(/\\n/g, '\n');

        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey
          })
        });
        console.log("[Firebase Admin Notifications] Initialized Successfully!");
      }
    } catch (error) {
      console.error("[Firebase Admin Notifications] Initialization failed:", error);
    }
  }
};

const getDb = () => {
  const adminApp = getApps()[0];
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.firestoreDatabaseId) {
      return getFirestore(adminApp, config.firestoreDatabaseId);
    }
  }
  return getFirestore(adminApp);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
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

  const { title, message, image, url, target } = req.body;
  
  if (!title || !message) {
    return res.status(400).json({ error: "Title and message are required" });
  }

  initializeFirebase();

  if (getApps().length === 0) {
    return res.status(500).json({ error: "Firebase Admin is not fully configured" });
  }

  try {
    const db = getDb();
    let tokens: string[] = [];

    const tokensSnap = await db.collection('notification_tokens').get();
    tokens = tokensSnap.docs.map(doc => doc.id);

    if (tokens.length === 0) {
      return res.status(404).json({ error: "No subscribers found to send to" });
    }

    const messaging = getMessaging();
    
    // Batch notifications
    const messages = tokens.map(token => ({
      token,
      notification: {
        title,
        body: message,
        image: image || undefined,
      },
      data: {
        url: url || '/',
        image: image || '',
      }
    }));

    // Send in chunks of 500 (FCM v1 sendEach limit is 500 per call effectively, though sendEach handles lists)
    const response = await messaging.sendEach(messages);
    
    console.log(`[Notifications API] Sent ${response.successCount} messages, ${response.failureCount} failed.`);
    
    return res.json({ 
      success: true, 
      sentCount: response.successCount, 
      failureCount: response.failureCount 
    });

  } catch (error: any) {
    console.error("[Notifications API] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
