import net from 'net';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return res.status(400).json({ error: 'DATABASE_URL not set' });

    let host = '';
    let port = 5432;
    try {
      const url = new URL(dbUrl);
      host = url.hostname;
      port = Number(url.port) || 5432;
    } catch (e) {
      return res.status(400).json({ error: 'Invalid DATABASE_URL format' });
    }

    const socket = new net.Socket();
    const timeout = 5000;

    const onError = (err: any) => {
      socket.destroy();
      return res.status(502).json({ ok: false, error: 'tcp_error', detail: err.message });
    };

    socket.setTimeout(timeout);
    socket.once('error', onError);
    socket.once('timeout', () => onError(new Error('timeout')));
    socket.connect(port, host, () => {
      socket.end();
      return res.status(200).json({ ok: true, host, port });
    });
  } catch (err: any) {
    console.error('API /api/debug/tcp error:', err);
    return res.status(500).json({ error: 'internal', detail: err.message });
  }
}
