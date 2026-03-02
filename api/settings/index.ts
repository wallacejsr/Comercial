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
  console.error('Pool init error (settings):', e?.message);
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
  if (!pool) return res.status(500).json({ error: 'Database not configured' });

  try {
    if (req.method === 'POST') {
      const user = verifyToken(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }

      const key = (body?.key || '').trim();
      const value = body?.value ?? null;
      if (!key) return res.status(400).json({ error: 'Key required' });

      const existing = await pool.query('SELECT id FROM configuracoes_sistema WHERE chave = $1', [key]);
      if (existing.rows[0]) {
        await pool.query('UPDATE configuracoes_sistema SET valor = $1, updated_at = CURRENT_TIMESTAMP WHERE chave = $2', [value, key]);
      } else {
        await pool.query('INSERT INTO configuracoes_sistema (chave, valor) VALUES ($1, $2)', [key, value]);
      }
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('api/settings error:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
