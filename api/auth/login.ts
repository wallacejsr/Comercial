import { UserRepository } from '../../server/repositories';
import { comparePassword, generateToken } from '../../server/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await UserRepository.findByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await comparePassword(password, user.password || '');
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    // remove password from response
    // @ts-ignore
    const { password: _pw, ...userWithoutPassword } = user;
    return res.status(200).json({ token, user: userWithoutPassword });
  } catch (err: any) {
    console.error('API /api/auth/login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
