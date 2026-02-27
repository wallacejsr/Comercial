export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Do NOT expose actual secret values; only indicate presence
  const env = {
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    JWT_SECRET_set: !!process.env.JWT_SECRET,
    DEBUG_API: process.env.DEBUG_API || null,
  };

  return res.status(200).json(env);
}
