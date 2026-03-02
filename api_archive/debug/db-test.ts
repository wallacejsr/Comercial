import { Pool } from 'pg';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const DATABASE_URL = process.env.DATABASE_URL || '';

    if (!DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL not set' });
    }

    console.log('Creating pool...');
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    console.log('Pool created, attempting connection...');
    const client = await pool.connect();

    console.log('Connected! Running test query...');
    const result = await client.query('SELECT NOW()');

    client.release();
    await pool.end();

    return res.status(200).json({
      status: 'ok',
      message: 'Database connection successful',
      time: result.rows[0],
    });
  } catch (err: any) {
    console.error('DB test error:', {
      message: err?.message,
      code: err?.code,
      errno: err?.errno,
    });
    return res.status(500).json({
      error: err?.message,
      code: err?.code,
    });
  }
}
