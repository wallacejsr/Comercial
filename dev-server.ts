import { getApp } from './server/app';

async function start() {
  const app = getApp();
  const port = Number(process.env.PORT || 3001);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Dev app listening on http://0.0.0.0:${port}`);
  });
}

start().catch(err => { console.error('Dev server start error:', err); process.exit(1); });
