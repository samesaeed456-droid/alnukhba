import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { v2 as cloudinary } from 'cloudinary';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

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

// Increase payload limit for base64 images
app.use(express.json({ limit: "50mb" }));

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
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
