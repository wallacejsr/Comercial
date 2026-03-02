import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase env vars');
}

let supabase: any = null;

try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    console.log('Creating Supabase client at module load time');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('Supabase client created successfully');
  } else {
    console.error('Supabase URL or key missing at module load');
  }
} catch (e: any) {
  console.error('Supabase init error at module load:', e?.message);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!supabase) {
      console.error('Supabase not initialized - missing URL or key');
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Parse body
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseErr) {
        console.error('Parse error:', parseErr);
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    }

    const email = (body?.email || '').trim();
    const password = body?.password || '';

    console.log('Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.warn('Auth failed:', error.message);
        return res.status(401).json({ error: error.message || 'Invalid credentials' });
      }

      if (!data?.user) {
        console.error('No user in response');
        return res.status(500).json({ error: 'Auth returned no user' });
      }

      console.log('Login success:', { email, userId: data.user.id });

      return res.status(200).json({
        user: data.user,
        session: data.session,
      });
    } catch (authError: any) {
      console.error('Auth exception:', authError?.message);
      return res.status(500).json({ error: 'Authentication error' });
    }
  } catch (err: any) {
    console.error('Handler exception:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
