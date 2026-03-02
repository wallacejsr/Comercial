import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const DATABASE_URL = process.env.DATABASE_URL || '';
const JWT_SECRET = process.env.JWT_SECRET || 'crm-secret-key-2026';

const globalAny: any = global as any;
let pool: Pool | null = null;
try {
  if (!globalAny.__pg_pool && DATABASE_URL) {
    const { Pool: PgPool } = require('pg');
    globalAny.__pg_pool = new PgPool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  }
  pool = globalAny.__pg_pool || null;
} catch (e: any) {
  console.error('Pool init error (smtp_settings):', e?.message);
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
    if (req.method === 'GET') {
      const user = verifyToken(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      // allow managers/admins; adjust as needed
      if (!(user as any).role || !['admin','manager'].includes((user as any).role)) return res.status(403).json({ error: 'Forbidden' });

      const result = await pool.query('SELECT * FROM smtp_settings ORDER BY id DESC LIMIT 1');
      return res.status(200).json(result.rows[0] || null);
    }

    if (req.method === 'POST') {
      const user = verifyToken(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      if (!(user as any).role || !['admin'].includes((user as any).role)) return res.status(403).json({ error: 'Forbidden' });

      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }

      const host = (body?.host || '').trim();
      const port = Number(body?.port || 587);
      const username = body?.username || null;
      const password = body?.password || null;
      const from_name = body?.from_name || null;
      const from_email = body?.from_email || null;
      const secure = !!body?.secure;

      if (!host) return res.status(400).json({ error: 'host required' });

      const existing = await pool.query('SELECT id FROM smtp_settings LIMIT 1');
      if (existing.rows[0]) {
        await pool.query(
          'UPDATE smtp_settings SET host=$1, port=$2, username=$3, password=$4, from_name=$5, from_email=$6, secure=$7, updated_at=CURRENT_TIMESTAMP WHERE id = $8',
          [host, port, username, password, from_name, from_email, secure, existing.rows[0].id]
        );
      } else {
        await pool.query(
          'INSERT INTO smtp_settings (host, port, username, password, from_name, from_email, secure) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [host, port, username, password, from_name, from_email, secure]
        );
      }
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('api/smtp_settings error:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
