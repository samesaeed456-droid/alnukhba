import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { v2 as cloudinary } from 'cloudinary';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';

dotenv.config();

// Initialize Firebase Admin safely
try {
  if (getApps().length === 0 && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
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
    console.log("[Firebase Admin] Initialized Successfully!");
  } else if (getApps().length === 0) {
    console.log("[Firebase Admin] Credentials not found in .env, skipping init.");
  }
} catch (error) {
  console.error("[Firebase Admin] Initialization failed:", error);
}

// Initial config check
console.log('[Startup] Cloudinary Check:', {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
  apiKey: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
  apiSecret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING'
});

const app = express();
app.set("trust proxy", true);

// Increase payload limit for base64 images
app.use(express.json({ limit: "50mb" }));

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Notifications API
app.post("/api/admin/notifications/send", async (req, res) => {
  console.log("[API] Received POST request to /api/admin/notifications/send");
  const { title, message, image, url, target } = req.body;
  
  if (!title || !message) {
    return res.status(400).json({ error: "Title and message are required" });
  }

  if (getApps().length === 0) {
    console.error("[Notifications] Error: Firebase Admin SDK is not initialized.");
    return res.status(500).json({ 
      error: "خطأ: لم يتم إعداد خوادم Firebase للإرسال. الرجاء إضافة FIREBASE_PROJECT_ID و FIREBASE_CLIENT_EMAIL و FIREBASE_PRIVATE_KEY في إعدادات البيئة (Secrets)." 
    });
  }

  try {
    const db = getFirestore();
    let tokens: string[] = [];

    if (target === 'all') {
      const tokensSnap = await db.collection('notification_tokens').get();
      tokens = tokensSnap.docs.map(doc => doc.id);
    } else {
      // Implement targeted logic here (e.g. VIP, etc.)
      const tokensSnap = await db.collection('notification_tokens').get();
      tokens = tokensSnap.docs.map(doc => doc.id);
    }

    if (tokens.length === 0) {
      return res.status(404).json({ error: "No subscribers found" });
    }

    const messaging = getMessaging();
    
    // FCM v1 allows sending in batches or to single tokens
    // For many tokens, we should send multicast or loop (multicast is deprecated in v1 SDK, we use sendEach)
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

    const response = await messaging.sendEach(messages);
    
    console.log(`[Notifications] Sent ${response.successCount} messages, ${response.failureCount} failed.`);
    
    res.json({ 
      success: true, 
      sentCount: response.successCount, 
      failureCount: response.failureCount 
    });
  } catch (error: any) {
    console.error("[Notifications] Error sending messages:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/cloudinary/usage", async (req, res) => {
  console.log("[API] Hit /api/cloudinary/usage");
  try {
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
    const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();

    console.log(`[Cloudinary] Using cloud: ${cloudName}, key: ${apiKey ? apiKey.substring(0, 4) + '...' : 'NONE'}`);

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn("[Cloudinary] Missing credentials keys");
      return res.status(500).json({ 
        error: "Cloudinary credentials missing",
        debug: { hasCloud: !!cloudName, hasKey: !!apiKey, hasSecret: !!apiSecret }
      });
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });

    const usage = await cloudinary.api.usage();
    res.json(usage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch usage" });
  }
});

app.post("/api/cloudinary/bulk-delete", async (req, res) => {
  try {
    const { public_ids } = req.body;
    if (!public_ids || !Array.isArray(public_ids)) {
      return res.status(400).json({ error: "public_ids array is required" });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({ error: "Cloudinary credentials missing" });
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });

    await cloudinary.api.delete_resources(public_ids);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete images" });
  }
});

app.get("/api/cloudinary/images", async (req, res) => {
  console.log("[API] Hit /api/cloudinary/images");
  try {
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
    const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn("[Cloudinary] Missing credentials keys in images route");
      return res.status(500).json({ error: "Cloudinary credentials missing" });
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });

    const result = await cloudinary.api.resources({ type: 'upload', max_results: 50 });
    res.json({ images: result.resources });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

app.get("/api/debug-key", (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  res.json({ 
    hasKey: !!key, 
    prefix: key ? key.substring(0, 5) : null,
    length: key ? key.length : 0,
    isDummy: key === "MY_GEMINI_API_KEY"
  });
});

// SMS Gateway Endpoint
app.post("/api/send-sms", async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ success: false, error: "Phone and message are required" });
  }

  try {
    const axios = (await import('axios')).default;
    
    // Clean up credentials
    const username = (process.env.SMSGATE_USERNAME || "").trim();
    const password = (process.env.SMSGATE_PASSWORD || "").trim();
    const deviceId = (process.env.SMSGATE_DEVICE_ID || "").trim();

    if (!username || !password || !deviceId) {
      return res.status(500).json({ success: false, error: "إعدادات الرسائل غير مكتملة" });
    }

    // Smart phone number formatting
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
    if (cleanPhone.length === 9 && cleanPhone.startsWith('7')) cleanPhone = '967' + cleanPhone;
    else if (cleanPhone.length === 10 && cleanPhone.startsWith('07')) cleanPhone = '967' + cleanPhone.substring(1);

    const formattedPhone = `+${cleanPhone}`;
    const targetUrl = (process.env.SMSGATE_URL || "https://api.sms-gate.app/3rdparty/v1/messages").trim();
    
    console.log(`[SMS] Sending to: ${formattedPhone} | Device: ${deviceId}`);
    
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

    res.json({ success: true, data: response.data });
  } catch (error: any) {
    const errorDetail = error.response?.data || error.message;
    console.error("[SMS Error]", errorDetail);
    res.status(500).json({ success: false, error: "فشل إرسال الرسالة", details: errorDetail });
  }
});

// Bulk SMS Endpoint
app.post("/api/send-bulk-sms", async (req, res) => {
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

  res.json({ success: true, message: "بدأت عملية الإرسال الجماعي" });

  // Background process
  (async () => {
    const axios = (await import('axios')).default;
    for (const phone of phones) {
      try {
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
        if (cleanPhone.length === 9 && cleanPhone.startsWith('7')) cleanPhone = '967' + cleanPhone;
        else if (cleanPhone.length === 10 && cleanPhone.startsWith('07')) cleanPhone = '967' + cleanPhone.substring(1);
        
        const formattedPhone = `+${cleanPhone}`;
        
        await axios.post(
          targetUrl,
          { message, phoneNumbers: [formattedPhone], deviceId },
          {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 15000
          }
        );
        await new Promise(r => setTimeout(r, 1500));
      } catch (err) {
        console.error(`[Bulk SMS] Error for ${phone}`);
      }
    }
  })();
});

// Admin API: Reset Password from server
app.post("/api/reset-password", async (req, res) => {
  const { phone, countryCode, newPassword } = req.body;
  if (!phone || !countryCode || !newPassword) {
    return res.status(400).json({ success: false, error: "بيانات غير مكتملة" });
  }

  if (getApps().length === 0) {
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

    console.log(`[Firebase Admin] Password updated successfully for user: ${dummyEmail}`);
    res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
    
  } catch (error: any) {
    console.error("[Firebase Admin] Password reset error:", error);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ success: false, error: "هذا الحساب غير موجود" });
    }
    res.status(500).json({ success: false, error: "فشل تغيير كلمة المرور", details: error.message });
  }
});

// Simple in-memory store for OTPs (For production, use Redis or Firestore)
const otpStore = new Map<string, { code: string, expires: number }>();

app.post("/api/send-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, error: "رقم الجوال مطلوب" });
  
  const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore.set(phone, { code: generatedOtp, expires: Date.now() + 5 * 60000 }); // 5 minutes

  try {
    const axios = (await import('axios')).default;
    const username = (process.env.SMSGATE_USERNAME || "").trim();
    const password = (process.env.SMSGATE_PASSWORD || "").trim();
    const deviceId = (process.env.SMSGATE_DEVICE_ID || "").trim();
    const targetUrl = (process.env.SMSGATE_URL || "https://api.sms-gate.app/3rdparty/v1/messages").trim();

    if (!username || !password || !deviceId) {
      // Demo mode fallback if SMS gateway not configured
      console.log(`[OTP Demo Mode] Code for ${phone}: ${generatedOtp}`);
      return res.json({ success: true, token: "demo-token" });
    }

    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
    if (cleanPhone.length === 9 && cleanPhone.startsWith('7')) cleanPhone = '967' + cleanPhone;
    else if (cleanPhone.length === 10 && cleanPhone.startsWith('07')) cleanPhone = '967' + cleanPhone.substring(1);
    
    const formattedPhone = `+${cleanPhone}`;
    const message = `تطبيق النخبة: كود التحقق الخاص بك هو ${generatedOtp}.`;
    
    await axios.post(
      targetUrl,
      { message, phoneNumbers: [formattedPhone], deviceId, isUrgent: true },
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    res.json({ success: true, token: "sent" });
  } catch (error) {
    console.error("[SMS Gateway] Error sending OTP:", error);
    // Even if it fails, maybe log it and return success for demo purposes, 
    // or return error so the frontend knows it failed
    res.status(500).json({ success: false, error: "تعذر إرسال رسالة SMS" });
  }
});

app.post("/api/verify-otp", (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ success: false, error: "بيانات غير مكتملة" });
  
  const record = otpStore.get(phone);
  if (!record) {
    return res.status(400).json({ success: false, error: "كود التحقق غير صالح أو منتهي الصلاحية" });
  }
  
  if (Date.now() > record.expires) {
    otpStore.delete(phone);
    return res.status(400).json({ success: false, error: "كود التحقق منتهي الصلاحية" });
  }
  
  if (record.code !== otp) {
    return res.status(400).json({ success: false, error: "كود التحقق خاطئ" });
  }
  
  otpStore.delete(phone);
  res.json({ success: true });
});

import fs from 'fs';

function getDb() {
  const adminApp = getApps()[0];
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.firestoreDatabaseId) {
      return getFirestore(adminApp, config.firestoreDatabaseId);
    }
  }
  return getFirestore(adminApp);
}

// --- WEBAUTHN PASSKEYS ENDPOINTS ---
import crypto from 'crypto';

// Strong type-safe buffer converter to prevent "Received undefined" errors
function safeBuffer(data: any): Buffer {
  if (data instanceof Buffer) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);
  if (typeof data === 'string') {
      // Check if it looks like base64
      if (/^[A-Za-z0-9+/]*={0,2}$/.test(data) && data.length % 4 === 0) {
          try { return Buffer.from(data, 'base64'); } catch (e) { return Buffer.from(data); }
      }
      return Buffer.from(data);
  }
  if (Array.isArray(data)) return Buffer.from(data);
  console.warn('[WebAuthn] Invalid buffer data type:', typeof data);
  return Buffer.alloc(0);
}

function signChallenge(challenge: string, type: 'reg' | 'auth', id: string) {
  const secret = process.env.OTP_SECRET || 'fallback-secret-for-demo';
  const expires = Date.now() + 5 * 60 * 1000;
  const data = `${type}:${id}:${challenge}:${expires}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return `${sig}.${expires}`;
}

function verifyChallengeSignature(challenge: string, type: 'reg' | 'auth', id: string, token: string) {
  const secret = process.env.OTP_SECRET || 'fallback-secret-for-demo';
  if (!token || !token.includes('.')) return false;
  const parts = token.split('.');
  const [sig, expiresStr] = parts;
  const expires = parseInt(expiresStr, 10);
  if (Date.now() > expires) return false;
  const data = `${type}:${id}:${challenge}:${expires}`;
  const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return sig === expectedSig;
}

app.post('/api/webauthn/register/generate', async (req, res) => {
  const { uid, email } = req.body;
  if (!uid || !email) return res.status(400).json({ error: 'Missing uid or email' });
  
  try {
    const host = req.get('host') || 'localhost';
    const rpID = host.split(':')[0];
    const rpName = 'Elite Store';
    
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: Uint8Array.from(safeBuffer(uid)),
      userName: email,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      }
    });
    
    const sessionToken = signChallenge(options.challenge, 'reg', uid);
    res.json({ ...options, sessionToken });
  } catch (error: any) {
    console.error('[WebAuthn] Generate Reg Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/webauthn/register/verify', async (req, res) => {
  const { uid, response, challenge, sessionToken } = req.body;
  if (!uid || !response || !challenge || !sessionToken) {
    return res.status(400).json({ error: 'بيانات غير مكتملة' });
  }

  if (!verifyChallengeSignature(challenge, 'reg', uid, sessionToken)) {
      return res.status(400).json({ error: 'جلسة التسجيل غير صالحة أو منتهية' });
  }

  try {
    const host = req.get('host') || 'localhost';
    const rpID = host.split(':')[0];
    const origin = req.headers.origin || (req.secure ? 'https://' : 'http://') + host;
    
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      console.log('[WebAuthn] Full Registration Info:', JSON.stringify(verification.registrationInfo, (key, value) => 
        value instanceof Uint8Array ? Array.from(value) : value
      ));
      
      const { credential } = verification.registrationInfo;
      
      if (!credential || !credential.publicKey || !credential.id) {
          return res.status(400).json({ error: 'لم يتم العثور على المفتاح العام في الرد المرسل من جهازك.' });
      }

      if (getApps().length === 0) {
        return res.status(500).json({ error: 'Firebase Admin غير مفعل كلياً' });
      }

      const passkeyId = response.id;
      const db = getDb();
      
      await db.collection('passkeys').doc(passkeyId).set({
        credentialPublicKey: safeBuffer(credential.publicKey).toString('base64'),
        credentialID: credential.id, // Store as is (Base64URLString)
        counter: credential.counter,
        uid,
        createdAt: new Date().toISOString()
      });

      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'فشل التوثيق الحيوي: المتصفح لم يرسل البيانات المطلوبة بشكل صحيح.' });
    }
  } catch (error: any) {
    console.error('[WebAuthn] Verify Reg Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/webauthn/login/generate', async (req, res) => {
  try {
    const host = req.get('host') || 'localhost';
    const rpID = host.split(':')[0];
    const sessionId = req.headers['x-session-id'] as string || "anonymous";
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
    });
    const sessionToken = signChallenge(options.challenge, 'auth', sessionId);
    res.json({ ...options, sessionToken });
  } catch (error: any) {
    console.error('[WebAuthn] Generate Auth Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/webauthn/login/verify', async (req, res) => {
  const { response, challenge, sessionToken } = req.body;
  const sessionId = req.headers['x-session-id'] as string || "anonymous";
  
  if (!response || !challenge || !sessionToken) {
    return res.status(400).json({ error: 'بيانات غير مكتملة' });
  }

  if (!verifyChallengeSignature(challenge, 'auth', sessionId, sessionToken)) {
      return res.status(400).json({ error: 'جلسة التوثيق غير صالحة أو منتهية' });
  }

  try {
    if (getApps().length === 0) {
      return res.status(500).json({ error: 'Firebase Admin غير مفعل. لا يمكن المطابقة.' });
    }

    const passkeyId = response.id;
    const db = getDb();
    const passkeyDoc = await db.collection('passkeys').doc(passkeyId).get();
    
    if (!passkeyDoc.exists) {
      return res.status(400).json({ error: 'لبصمة غير مسجلة' });
    }
    
    const passkeyData = passkeyDoc.data()!;
    const host = req.get('host') || 'localhost';
    const rpID = host.split(':')[0];
    const origin = req.headers.origin || (req.secure ? 'https://' : 'http://') + host;

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkeyData.credentialID || response.id,
        publicKey: new Uint8Array(safeBuffer(passkeyData.credentialPublicKey)),
        counter: passkeyData.counter,
      }
    });

    if (verification.verified) {
      await db.collection('passkeys').doc(passkeyId).update({ 
        counter: verification.authenticationInfo.newCounter,
        lastUsedAt: new Date().toISOString()
      });
      
      const customToken = await getAuth().createCustomToken(passkeyData.uid || 'unknown');
      res.json({ success: true, customToken });
    } else {
      res.status(400).json({ error: 'فشل التحقق من البصمة' });
    }
  } catch (error: any) {
    console.error('[WebAuthn] Verify Auth Error:', error);
    res.status(500).json({ error: error.message });
  }
});
// --- END WEBAUTHN ---

async function startLocalServer() {
  console.log("Setting up Vite middleware for local dev...");
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (error) {
      console.error("Error creating Vite server:", error);
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      maxAge: '1d',
      etag: true
    }));
    
    // API 404 handler
    app.all("/api/*", (req, res) => {
      res.status(404).json({ error: "API route not found" });
    });

    // SPA Fallback - ensure we don't return index.html for missing static files
    app.get("*", (req, res) => {
      if (path.extname(req.path)) {
        return res.status(404).send("File not found");
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

// Start local dev server if not in Vercel
if (!process.env.VERCEL) {
  startLocalServer();
}

export default app;
