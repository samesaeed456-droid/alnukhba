import { VercelRequest, VercelResponse } from '@vercel/node';
import { v2 as cloudinary } from 'cloudinary';

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

  try {
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
    const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({ error: "Cloudinary credentials missing" });
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });

    const action = req.query.action;

    if (action === 'usage' && req.method === 'GET') {
      const usage = await cloudinary.api.usage();
      return res.status(200).json(usage);
    } 
    
    if (action === 'images' && req.method === 'GET') {
      const result = await cloudinary.api.resources({ type: 'upload', max_results: 50 });
      return res.status(200).json({ images: result.resources });
    }
    
    if (action === 'bulk-delete' && req.method === 'POST') {
      const { public_ids } = req.body;
      if (!public_ids || !Array.isArray(public_ids)) {
        return res.status(400).json({ error: "public_ids array is required" });
      }
      await cloudinary.api.delete_resources(public_ids);
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Action not found or invalid method' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Cloudinary operation failed" });
  }
}
