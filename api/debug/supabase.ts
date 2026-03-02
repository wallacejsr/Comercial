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

    // Test 1: Simple HTTP fetch to Supabase URL
    console.log('Test 1: Simple HTTP fetch to Supabase');
    try {
      const healthRes = await fetch(`${SUPABASE_URL}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      console.log('Health check status:', healthRes.status);
    } catch (e: any) {
      console.error('Health check failed:', e?.message);
    }

    // Test 2: SDK client creation
    console.log('Test 2: Creating Supabase client...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Test 3: Sign in (will fail but we'll see the error)
    console.log('Test 3: Testing sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpass',
    });

    if (error) {
      return res.status(200).json({
        status: 'partial',
        message: 'Supabase has connectivity issues',
        error: error.message,
        errorCode: error.status,
      });
    }

    return res.status(200).json({
      status: 'ok',
      message: 'Supabase working',
    });
  } catch (err: any) {
    console.error('Supabase test error:', err);
    return res.status(500).json({
      error: 'Supabase test failed',
      detail: err?.message || String(err),
    });
  }
}
