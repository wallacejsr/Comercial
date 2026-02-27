import pool from '../../server/db';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await pool.query('SELECT 1 as ok');
    return res.status(200).json({ ok: true, rows: result.rows });
  } catch (err: any) {
    console.error('API /api/debug/db error:', err);
    if (process.env.DEBUG_API === 'true') {
      return res.status(500).json({ error: err.message, stack: err.stack });
    }
    return res.status(500).json({ error: 'DB connection failed' });
  }
}
