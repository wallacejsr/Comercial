import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || '';
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({
        error: 'Supabase env vars not set',
        SUPABASE_URL_set: !!SUPABASE_URL,
        SUPABASE_ANON_KEY_set: !!SUPABASE_ANON_KEY,
      });
    }

    console.log('Creating Supabase client...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    console.log('Testing sign in with test@example.com / testpass');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpass',
    });

    if (error) {
      console.log('Expected auth failure (test user):', error.message);
      return res.status(200).json({
        status: 'ok',
        message: 'Supabase client works (expected auth failure)',
        error: error.message,
      });
    }

    return res.status(200).json({
      status: 'ok',
      message: 'Supabase client works',
      data: { user: data?.user?.email || null },
    });
  } catch (err: any) {
    console.error('Supabase test error:', err);
    return res.status(500).json({
      error: 'Supabase test failed',
      detail: err?.message || String(err),
      stack: err?.stack,
    });
  }
}
