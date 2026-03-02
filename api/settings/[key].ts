import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const DATABASE_URL = process.env.DATABASE_URL || '';
const JWT_SECRET = process.env.JWT_SECRET || 'crm-secret-key-2026';

const globalAny: any = global as any;
let pool: Pool | null = null;
try {
  if (!globalAny.__pg_pool && DATABASE_URL) {
    const { Pool } = await import('pg');
    globalAny.__pg_pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  }
  pool = globalAny.__pg_pool || null;
} catch (e: any) {
  console.error('Pool init error (settings key):', e?.message);
}

function verifyToken(req: any) {
  try {
    const auth = req.headers?.authorization || req.headers?.Authorization;
    if (!auth) return null;
    const token = auth.split(' ')[1];
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  const { key } = req.query;
  if (!key) return res.status(400).json({ error: 'Missing key' });

  if (!pool) return res.status(500).json({ error: 'Database not configured' });

  try {
    if (req.method === 'GET') {
      const user = verifyToken(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const result = await pool.query('SELECT valor FROM configuracoes_sistema WHERE chave = $1 LIMIT 1', [key]);
      if (!result.rows[0]) return res.status(200).json({ valor: null });
      return res.status(200).json(result.rows[0]);
    }

    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('api/settings/[key] error:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
