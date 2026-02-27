import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl || '', supabaseKey || '', { auth: { persistSession: false } });

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (process.env.DEBUG_API === 'true') console.log('/api/auth/login body:', req.body);
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    if (process.env.DEBUG_API === 'true') console.log('Querying Supabase users by email:', email);
    const { data, error } = await supabase.from('users').select('*').eq('email', email).limit(1).maybeSingle();
    if (error) throw error;
    const user = data as any;
    if (process.env.DEBUG_API === 'true') console.log('User found:', !!user);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password || '');
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'crm-secret-key-2026', { expiresIn: '24h' });
    const { password: _pw, ...userWithoutPassword } = user;
    return res.status(200).json({ token, user: userWithoutPassword });
  } catch (err: any) {
    console.error('API /api/auth/login error:', err);
    if (process.env.DEBUG_API === 'true') return res.status(500).json({ error: 'Internal server error', detail: err.message, stack: err.stack });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
