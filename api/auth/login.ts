import { createClient } from '@supabase/supabase-js';

// Serverless login handler using Supabase Auth
// Expects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or anon key) in env.

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const debug = process.env.DEBUG_API === 'true';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  if (debug) console.warn('Supabase env vars missing: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Body may already be parsed by Vercel; guard if string
    import { Pool } from 'pg';
    import bcrypt from 'bcryptjs';
    import jwt from 'jsonwebtoken';

    const debug = process.env.DEBUG_API === 'true';

    // Reuse pool across invocations
    const globalAny: any = global as any;
    if (!globalAny.__pg_pool && process.env.DATABASE_URL) {
      globalAny.__pg_pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    }

    const pool: Pool | undefined = globalAny.__pg_pool;

    export default async function handler(req: any, res: any) {
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
      }

      try {
        let body = req.body;
        if (typeof body === 'string') {
          try { body = JSON.parse(body); } catch { /* ignore */ }
        }

        const email = body?.email;
        const password = body?.password;

        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        if (!pool) {
          console.error('DATABASE_URL not configured or pool not initialized');
          return res.status(500).json({ error: 'Database not configured' });
        }

        if (debug) console.log('Looking up user by email:', email);
        const result = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const hash = user.password || '';
        const ok = await bcrypt.compare(password, hash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'crm-secret-key-2026', { expiresIn: '24h' });

        const { password: _pw, ...userWithoutPassword } = user;
        return res.status(200).json({ user: userWithoutPassword, token });
      } catch (err: any) {
        console.error('API /api/auth/login error:', err);
        if (debug) return res.status(500).json({ error: 'Internal server error', detail: err.message, stack: err.stack });
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
