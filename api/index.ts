import app from '../server';

console.log("[Vercel Function] Loaded api/index.ts");

export default (req: any, res: any) => {
  console.log(`[Vercel Function] Handling ${req.method} ${req.url}`);
  return app(req, res);
};
