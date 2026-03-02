import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const DATABASE_URL = process.env.DATABASE_URL || '';
const JWT_SECRET = process.env.JWT_SECRET || 'crm-secret-key-2026';

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

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    console.log('Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!pool) {
      console.error('Database pool not initialized');
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Query user from database
    const result = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
    const user = result.rows[0];

    if (!user) {
      console.warn('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get password from user record
    const passwordField = user.password || '';

    // Try bcrypt first (if hash), then plain text comparison
    let isValid = false;
    try {
      isValid = await bcrypt.compare(password, passwordField);
    } catch {
      // If bcrypt fails, try plain text comparison
      isValid = password === passwordField;
    }

    if (!isValid) {
      console.warn('Password mismatch for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const { password: _pw, ...userWithoutPassword } = user;

    console.log('Login successful:', { email, userId: user.id });

    return res.status(200).json({
      user: userWithoutPassword,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err?.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
