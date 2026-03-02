const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase env vars');
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase not configured');
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    try {
      // Call Supabase Auth API directly via REST
      const authUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
      
      console.log('Calling Supabase Auth API:', authUrl);
      
      const authRes = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email,
          password,
        }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const authData = await authRes.json();

      if (!authRes.ok) {
        console.warn('Auth failed:', authRes.status, authData?.error_description || authData?.error);
        return res.status(401).json({ error: authData?.error_description || 'Invalid credentials' });
      }

      if (!authData?.user) {
        console.error('No user in response:', authData);
        return res.status(500).json({ error: 'Auth returned no user' });
      }

      console.log('Login success:', { email, userId: authData.user.id });

      return res.status(200).json({
        user: authData.user,
        session: {
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
        },
      });
    } catch (authError: any) {
      console.error('Auth exception:', authError?.message);
      return res.status(500).json({ error: authError?.message || 'Authentication error' });
    }
  } catch (err: any) {
    console.error('Handler exception:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
