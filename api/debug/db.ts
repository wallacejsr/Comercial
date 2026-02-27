export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create a pool directly here to avoid importing server modules that
    // are not available in the Vercel serverless runtime path.
    const { Pool } = await import('pg');
    // reuse pool between invocations when possible
    const globalAny: any = global as any;
    if (!globalAny.__vercel_pool) {
      globalAny.__vercel_pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
    }
    const pool = globalAny.__vercel_pool;

    const result = await pool.query('SELECT 1 as ok');
    return res.status(200).json({ ok: true, rows: result.rows });
  } catch (err: any) {
    console.error('API /api/debug/db error:', err);
    if (process.env.DEBUG_API === 'true') {
      return res.status(500).json({ error: 'DB error', detail: err.message, stack: err.stack });
    }
    return res.status(500).json({ error: 'DB connection failed' });
  }
}
