import { createClient } from '@supabase/supabase-js';

// Serverless login handler using Supabase Auth
// Expects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or anon key) in env.

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const debug = process.env.DEBUG_API === 'true';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  if (debug) console.warn('Supabase env vars missing: SUPABASE_URL or SUPABASE key');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const email = body?.email;
    const password = body?.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('Supabase environment variables not set');
      return res.status(500).json({ error: 'Server error, check logs' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (debug) console.warn('Supabase auth error:', error.message);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = (data as any)?.user || null;
    const session = (data as any)?.session || null;

    if (!user || !session) {
      if (debug) console.warn('Auth returned no user/session:', data);
      return res.status(500).json({ error: 'Server error, check logs' });
    }

    return res.status(200).json({ user, session });
  } catch (err: any) {
    console.error('API /api/auth/login server error:', err);
    return res.status(500).json({ error: 'Server error, check logs' });
  }
}
        const result = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
