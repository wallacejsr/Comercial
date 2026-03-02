import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const DATABASE_URL = process.env.DATABASE_URL || '';
const JWT_SECRET = process.env.JWT_SECRET || 'crm-secret-key-2026';

const globalAny: any = global as any;
let pool: Pool | null = null;

try {
  if (!globalAny.__pg_pool && DATABASE_URL) {
    globalAny.__pg_pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  }
  pool = globalAny.__pg_pool || null;
} catch (e: any) {
  console.error('Pool init error (users):', e?.message);
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

  if (!pool) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    if (req.method === 'GET') {
      const user = verifyToken(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      if (!(user as any).role || !['admin'].includes((user as any).role)) return res.status(403).json({ error: 'Forbidden' });

      const result = await pool.query('SELECT id, name, email, role, active, last_login, created_at FROM users ORDER BY name ASC');
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const user = verifyToken(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      if (!(user as any).role || !['admin'].includes((user as any).role)) return res.status(403).json({ error: 'Forbidden' });

      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }

      const name = (body?.name || '').trim();
      const email = (body?.email || '').trim();
      const role = body?.role || 'seller';
      const password = body?.password || Math.random().toString(36).slice(-8);

      if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

      const hashed = await bcrypt.hash(password, 10);
      const insert = await pool.query(
        'INSERT INTO users (name, email, password, role, active) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [name, email, hashed, role, true]
      );

      return res.status(201).json({ success: true, id: insert.rows[0].id });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('api/users error:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
