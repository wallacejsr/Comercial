import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL || '';

const globalAny: any = global as any;
let pool: Pool | null = null;

try {
  if (!globalAny.__pg_pool && DATABASE_URL) {
    globalAny.__pg_pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  pool = globalAny.__pg_pool || null;
} catch (e: any) {
  console.error('Pool init error:', e?.message);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const email = (body?.email || '').trim();
    const password = body?.password || '';
    const name = body?.name || email.split('@')[0];
    const role = body?.role || 'user';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    console.log('Creating user:', { email, role });

    // Check if user already exists
    const existResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existResult.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const insertResult = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [name, email, hashedPassword, role]
    );

    const newUser = insertResult.rows[0];

    console.log('User created:', { email, userId: newUser.id });

    return res.status(201).json({
      message: 'User created successfully',
      user: newUser,
    });
  } catch (err: any) {
    console.error('Create user error:', err?.message);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}
