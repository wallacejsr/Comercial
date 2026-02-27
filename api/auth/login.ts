import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (process.env.DEBUG_API === 'true') {
      console.log('/api/auth/login body:', req.body);
    }
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // create pool locally to avoid importing server modules
    const { Pool } = await import('pg');
    const globalAny: any = global as any;
    if (!globalAny.__vercel_pool) {
      globalAny.__vercel_pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
    }
    const pool = globalAny.__vercel_pool;

    if (process.env.DEBUG_API === 'true') console.log('Querying user by email:', email);
    const result = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
    const user = result.rows[0];
    if (process.env.DEBUG_API === 'true') console.log('User found:', !!user);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password || '');
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'crm-secret-key-2026', { expiresIn: '24h' });
    const { password: _pw, ...userWithoutPassword } = user;
    return res.status(200).json({ token, user: userWithoutPassword });
  } catch (err: any) {
    console.error('API /api/auth/login error:', err);
    if (process.env.DEBUG_API === 'true') {
      return res.status(500).json({ error: 'Internal server error', detail: err.message, stack: err.stack });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
