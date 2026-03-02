import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const debug = process.env.DEBUG_API === 'true';

if (debug) {
  console.log('Supabase init:', { SUPABASE_URL: !!SUPABASE_URL, SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY });
}

let supabase: any = null;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e: any) {
  console.error('Supabase client error:', e?.message);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client not initialized' });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const email = body?.email;
    const password = body?.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (debug) console.log('Attempting login for:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (debug) console.error('Supabase error:', error.message, error.status);
      return res.status(401).json({ error: error.message || 'Invalid credentials' });
    }

    if (!data?.user || !data?.session) {
      if (debug) console.error('No user or session returned:', data);
      return res.status(500).json({ error: 'Login failed: no session' });
    }

    if (debug) console.log('Login successful for:', email);
    return res.status(200).json({
      user: data.user,
      session: data.session,
    });
  } catch (err: any) {
    console.error('Handler error:', err);
    if (debug) {
      return res.status(500).json({
        error: 'Server error',
        detail: err?.message || String(err),
      });
    }
    return res.status(500).json({ error: 'Server error' });
  }
}
