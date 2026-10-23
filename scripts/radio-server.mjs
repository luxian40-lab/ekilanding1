import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync, writeFileSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const statePath = path.join(root, 'radio', 'programacion.json');
const audioDir = path.join(root, 'radio', 'audio');
const clavePath = path.join(root, 'scripts', '.radio-clave');
const port = Number(process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/rss+xml; charset=utf-8',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.webm': 'audio/webm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.gif': 'image/gif',
  '.txt': 'text/plain; charset=utf-8'
};

const EXT_BY_TYPE = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'video/webm': 'webm'
};

const blocked = new Set(['node_modules', 'scripts', 'worker', '.git', 'dist', '.wrangler']);
const sessions = new Set();
let hostSocket = null;
const listeners = new Set();

const same = (left, right) => {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

const clave = () => {
  if (existsSync(clavePath)) return readFileSync(clavePath, 'utf8').trim();
  const created = `eki-${randomBytes(4).toString('hex')}`;
  writeFileSync(clavePath, `${created}\n`);
  return created;
};

const loadState = () => {
  const data = JSON.parse(readFileSync(statePath, 'utf8'));
  data.pista = Array.isArray(data.pista) ? data.pista : [];
  data.conductora = data.conductora || 'Yineth Ortiz';
  data.enVivo = Boolean(data.enVivo);
  return data;
};

const saveState = data => {
  data.actualizado = new Date().toISOString();
  writeFileSync(statePath, `${JSON.stringify(data, null, 2)}\n`);
};

const readBody = (req, limit) => new Promise((resolve, reject) => {
  const chunks = [];
  let size = 0;
  req.on('data', chunk => {
    size += chunk.length;
    if (size > limit) {
      reject(new Error('grande'));
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

const sendJson = (res, status, data) => {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
};

const authorized = req => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  return token && sessions.has(token);
};

const safeItem = item => {
  const id = String(item.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
  const src = String(item.src || '');
  const duration = Number(item.duracion);
  const tipo = item.tipo === 'capsula' ? 'capsula' : 'musica';
  if (!id || !src.startsWith('/radio/audio/') || src.includes('..')) return null;
  if (!Number.isFinite(duration) || duration <= 0 || duration > 60 * 60 * 4) return null;
  return {
    id,
    tipo,
    titulo: String(item.titulo || 'Sin título').slice(0, 140),
    src,
    duracion: Math.round(duration * 1000) / 1000
  };
};

const feedXml = (req, state) => {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const origin = `${proto}://${req.headers.host}`;
  const items = state.pista.filter(item => item.tipo === 'capsula').map(item => {
    const filePath = path.join(root, decodeURIComponent(item.src));
    const length = existsSync(filePath) ? statSync(filePath).size : 0;
    const ext = path.extname(filePath).toLowerCase();
    return `    <item>
      <title>${escapeXml(item.titulo)}</title>
      <guid isPermaLink="false">${escapeXml(item.id)}</guid>
      <enclosure url="${origin}${item.src}" length="${length}" type="${MIME[ext] || 'audio/mpeg'}"/>
    </item>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>eki radio</title>
    <link>${origin}/</link>
    <description>Cápsulas de eki radio, conducidas por ${escapeXml(state.conductora || 'Yineth Ortiz')}.</description>
    <language>es-co</language>
${items}
  </channel>
</rss>`;
};

const escapeXml = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const setLive = on => {
  const state = loadState();
  state.enVivo = on;
  saveState(state);
  const note = JSON.stringify({ type: 'live', on });
  for (const listener of listeners) {
    if (listener.readyState === 1) listener.send(note);
  }
};

const serveFile = (req, res, filePath) => {
  const stat = statSync(filePath);
  const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;
  if (range) {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    if (!match) {
      res.writeHead(416);
      res.end();
      return;
    }
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : stat.size - 1;
    if (start >= stat.size || end >= stat.size || start > end) {
      res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
      res.end();
      return;
    }
    res.writeHead(206, {
      'Content-Type': type,
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Cache-Control': 'public, max-age=3600'
    });
    createReadStream(filePath, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': stat.size,
    'Accept-Ranges': 'bytes',
    'Cache-Control': type.startsWith('audio/') ? 'public, max-age=3600' : 'no-cache'
  });
  createReadStream(filePath).pipe(res);
};

const resolvePublic = pathname => {
  const decoded = decodeURIComponent(pathname);
  if (decoded.includes('\0')) return null;
  const full = path.resolve(root, `.${decoded}`);
  const relative = path.relative(root, full);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  const top = relative.split(path.sep)[0];
  if (blocked.has(top) || relative.includes('.radio-clave')) return null;
  return full;
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
  try {
    if (url.pathname === '/api/radio/salud' && req.method === 'GET') {
      sendJson(res, 200, { ok: true, modo: 'local' });
      return;
    }
    if (url.pathname === '/api/radio/entrar' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req, 10_000)).toString('utf8') || '{}');
      if (!same(body.clave || '', clave())) {
        sendJson(res, 401, { error: 'clave' });
        return;
      }
      const token = randomBytes(24).toString('hex');
      sessions.add(token);
      sendJson(res, 200, { token });
      return;
    }
    if (url.pathname === '/api/radio/yo' && req.method === 'GET') {
      sendJson(res, authorized(req) ? 200 : 401, { ok: authorized(req) });
      return;
    }
    if (url.pathname === '/api/radio/programacion' && req.method === 'GET') {
      sendJson(res, 200, loadState());
      return;
    }
    if (url.pathname === '/api/radio/programacion' && req.method === 'PUT') {
      if (!authorized(req)) {
        sendJson(res, 401, { error: 'clave' });
        return;
      }
      const body = JSON.parse((await readBody(req, 1_000_000)).toString('utf8') || '{}');
      const state = loadState();
      state.conductora = String(body.conductora || state.conductora || 'Yineth Ortiz').slice(0, 80);
      state.pista = (Array.isArray(body.pista) ? body.pista : []).map(safeItem).filter(Boolean);
      saveState(state);
      sendJson(res, 200, loadState());
      return;
    }
    if (url.pathname === '/api/radio/en-vivo' && req.method === 'POST') {
      if (!authorized(req)) {
        sendJson(res, 401, { error: 'clave' });
        return;
      }
      const body = JSON.parse((await readBody(req, 10_000)).toString('utf8') || '{}');
      setLive(Boolean(body.on));
      sendJson(res, 200, loadState());
      return;
    }
    if (url.pathname === '/api/radio/audio' && req.method === 'POST') {
      if (!authorized(req)) {
        sendJson(res, 401, { error: 'clave' });
        return;
      }
      const kind = req.headers['x-radio-kind'] === 'capsula' ? 'capsula' : 'musica';
      const duration = Number(req.headers['x-radio-duration']);
      const title = decodeURIComponent(String(req.headers['x-radio-title'] || 'Sin título'));
      const original = decodeURIComponent(String(req.headers['x-radio-name'] || ''));
      const extFromName = path.extname(original).slice(1).toLowerCase();
      const ext = EXT_BY_TYPE[String(req.headers['content-type'] || '').split(';')[0]] || (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm'].includes(extFromName) ? extFromName : '');
      if (!ext || !Number.isFinite(duration) || duration <= 0) {
        sendJson(res, 400, { error: 'audio' });
        return;
      }
      const bytes = await readBody(req, 40 * 1024 * 1024);
      const id = randomBytes(8).toString('hex');
      mkdirSync(audioDir, { recursive: true });
      writeFileSync(path.join(audioDir, `${id}.${ext}`), bytes);
      sendJson(res, 200, safeItem({
        id,
        tipo: kind,
        titulo: title,
        src: `/radio/audio/${id}.${ext}`,
        duracion: duration
      }));
      return;
    }
    const audioMatch = url.pathname.match(/^\/api\/radio\/audio\/([a-zA-Z0-9_-]+)$/);
    if (audioMatch && req.method === 'DELETE') {
      if (!authorized(req)) {
        sendJson(res, 401, { error: 'clave' });
        return;
      }
      const id = audioMatch[1];
      const state = loadState();
      const current = state.pista.find(item => item.id === id);
      if (current) {
        const filePath = path.join(root, decodeURIComponent(current.src));
        if (filePath.startsWith(audioDir) && existsSync(filePath) && !['ident-eki.wav', 'cama-eki.wav'].includes(path.basename(filePath))) {
          unlinkSync(filePath);
        }
      }
      sendJson(res, 200, { ok: true });
      return;
    }
    if (url.pathname === '/radio/feed.xml' && req.method === 'GET') {
      const xml = feedXml(req, loadState());
      res.writeHead(200, {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      res.end(xml);
      return;
    }

    const full = resolvePublic(url.pathname === '/' ? '/index.html' : url.pathname);
    if (full && existsSync(full) && statSync(full).isFile()) {
      serveFile(req, res, full);
      return;
    }
    const home = path.join(root, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    createReadStream(home).pipe(res);
  } catch (error) {
    const status = error.message === 'grande' ? 413 : 500;
    sendJson(res, status, { error: status === 413 ? 'grande' : 'server' });
  }
});

const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
  if (url.pathname !== '/api/radio/live') {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, ws => {
    const role = url.searchParams.get('role');
    if (role === 'host') {
      if (!sessions.has(url.searchParams.get('token') || '') || (hostSocket && hostSocket.readyState === 1)) {
        ws.close(4001);
        return;
      }
      hostSocket = ws;
      setLive(true);
      ws.on('message', (data, isBinary) => {
        for (const listener of listeners) {
          if (listener.readyState === 1) listener.send(data, { binary: isBinary });
        }
      });
      ws.on('close', () => {
        if (hostSocket !== ws) return;
        hostSocket = null;
        setLive(false);
      });
      return;
    }
    if (listeners.size >= 40) {
      ws.close(4003);
      return;
    }
    listeners.add(ws);
    ws.send(JSON.stringify({ type: 'live', on: Boolean(hostSocket && hostSocket.readyState === 1) }));
    ws.on('close', () => listeners.delete(ws));
  });
});

mkdirSync(audioDir, { recursive: true });
const studioClave = clave();
server.listen(port, '127.0.0.1', () => {
  console.log(`eki radio en http://127.0.0.1:${port}/`);
  console.log(`estudio http://127.0.0.1:${port}/estudio`);
  console.log(`ESTUDIO_CLAVE=${studioClave}`);
});
