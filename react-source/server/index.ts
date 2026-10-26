import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTracks, stepTracks, type Snapshot } from '../shared/simulation.ts';
const root = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const port = Number(process.env.PORT || 3001);
let tracks = createTracks(); let seq = 0; let lastTick = Date.now();
const clients = new Map<import('node:http').ServerResponse, { interval: number; sent: number }>();
const snapshot = (): Snapshot => ({ tracks, time: Date.now(), seq, simulated: true });
// Trails stay in the browser to reduce traffic.
const wire = () => JSON.stringify({ ...snapshot(), tracks: tracks.map(t => ({ ...t, history: [[t.x, t.y]] })) });
const timer = setInterval(() => {
  const now = Date.now(); tracks = stepTracks(tracks, (now - lastTick) / 1000); lastTick = now; seq++;
  let payload: string | undefined;
  for (const [res, client] of clients) {
    if (now - client.sent < client.interval || res.writableLength > 65536) continue;
    payload ??= wire(); res.write(`id: ${seq}\ndata: ${payload}\n\n`); client.sent = now;
  }
}, 250);
const mime: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET' }).end(); return; }
  if (url.pathname === '/api/health') { res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: true, simulated: true, clients: clients.size })); return; }
  if (url.pathname === '/api/snapshot') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(wire()); return; }
  if (url.pathname === '/api/stream') {
    if (clients.size >= 100) { res.writeHead(503).end('Demo connection limit'); return; }
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write(`retry: 3000\ndata: ${wire()}\n\n`);
    clients.set(res, { interval: url.searchParams.get('low') === '1' ? 2000 : 250, sent: Date.now() });
    req.on('close', () => clients.delete(res)); return;
  }
  if (url.pathname.startsWith('/api/')) { res.writeHead(404).end(); return; }
  try {
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(path);
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Cache-Control': path.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache' }); res.end(data);
  } catch { res.writeHead(404).end('File not found. Run npm run build first.'); }
});
server.listen(port, '127.0.0.1', () => console.log(`SKY SHIELD: http://127.0.0.1:${port} (simulated data only)`));
function shutdown() { clearInterval(timer); for (const res of clients.keys()) res.end(); server.close(); }
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
