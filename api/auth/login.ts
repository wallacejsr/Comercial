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
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { /* ignore */ }
    }

    const email = body?.email;
    const password = body?.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase environment variables are not configured' });
    }

    if (debug) console.log('Attempting sign-in for', email);

    // Use Supabase Auth to verify credentials server-side
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Map Supabase error to HTTP status
      if (debug) console.warn('Supabase auth error:', error.message);
      // Invalid credentials usually come as 400 with message; return 401
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const session = (data as any)?.session || null;
    const user = (data as any)?.user || null;

    if (!session || !user) {
      if (debug) console.warn('No session/user returned from Supabase:', data);
      return res.status(500).json({ error: 'Authentication failed' });
    }

    const token = session.access_token || null;

    return res.status(200).json({ user, token });
  } catch (err: any) {
    console.error('API /api/auth/login error:', err);
    if (debug) return res.status(500).json({ error: 'Internal server error', detail: err?.message, stack: err?.stack });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
