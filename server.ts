import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  console.log("Starting Alnokhba Server...");
  const app = express();
  const PORT = 3000;

  // Start listening immediately to avoid "site not opening" issues
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });

  // Increase payload limit for base64 images
  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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

  console.log("Setting up Vite middleware...");
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Creating Vite server...");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      console.log("Vite server created, applying middleware...");
      app.use(vite.middlewares);
    } catch (error) {
      console.error("Error creating Vite server:", error);
    }
  } else {
    console.log("Production mode: serving static files from dist/");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

startServer();
