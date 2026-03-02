export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || '';

    if (!SUPABASE_URL) {
      return res.status(500).json({ error: 'SUPABASE_URL not set' });
    }

    // Test 1: Simple HEAD request
    console.log('Test 1: HEAD request to Supabase');
    try {
      const headRes = await fetch(SUPABASE_URL, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      console.log('HEAD status:', headRes.status);
    } catch (e: any) {
      console.error('HEAD failed:', e?.message);
    }

    // Test 2: GET to health endpoint
    console.log('Test 2: GET to /status/ok');
    try {
      const statusRes = await fetch(`${SUPABASE_URL}/status/ok`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      console.log('Status endpoint:', statusRes.status);
      const text = await statusRes.text();
      console.log('Status response:', text.substring(0, 100));
    } catch (e: any) {
      console.error('Status endpoint failed:', e?.message);
    }

    // Test 3: POST to auth endpoint with invalid credentials
    console.log('Test 3: POST to /auth/v1/token');
    try {
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'test',
        }),
        signal: AbortSignal.timeout(5000),
      });
      console.log('Auth endpoint status:', authRes.status);
      const data = await authRes.json();
      console.log('Auth response keys:', Object.keys(data));
    } catch (e: any) {
      console.error('Auth endpoint failed:', e?.message, e?.cause);
    }

    return res.status(200).json({
      status: 'Tests completed',
      SUPABASE_URL,
      checkLogs: 'Check Vercel function logs for detailed output',
    });
  } catch (err: any) {
    console.error('Test error:', err);
    return res.status(500).json({
      error: err?.message || String(err),
    });
  }
}
