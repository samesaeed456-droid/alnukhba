import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const key = process.env.GEMINI_API_KEY;
  res.json({ 
    hasKey: !!key, 
    prefix: key ? key.substring(0, 5) : null,
    length: key ? key.length : 0,
    isDummy: key === "MY_GEMINI_API_KEY"
  });
}
