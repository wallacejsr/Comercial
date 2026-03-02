import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || '';

const globalAny: any = global as any;
let pool: Pool | null = null;
try {
  if (!globalAny.__pg_pool && DATABASE_URL) {
    // lazy import for compatibility in serverless
    const { Pool: PgPool } = require('pg');
    globalAny.__pg_pool = new PgPool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  }
  pool = globalAny.__pg_pool || null;
} catch (e: any) {
  console.error('Pool init error (debug/settings):', e?.message);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  if (process.env.DEBUG_API !== 'true') return res.status(403).json({ error: 'Debug API disabled' });
  if (!pool) return res.status(500).json({ error: 'Database not configured' });
  try {
    const result = await pool.query('SELECT chave, valor, created_at, updated_at FROM configuracoes_sistema ORDER BY chave');
    return res.status(200).json(result.rows);
  } catch (err: any) {
    console.error('debug/settings error:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
