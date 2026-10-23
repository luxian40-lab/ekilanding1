const MAX_AUDIO = 40 * 1024 * 1024;

const extByType = {
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

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

const emptyState = () => ({
  conductora: 'Yineth Ortiz',
  enVivo: false,
  actualizado: new Date().toISOString(),
  pista: []
});

const normalizeState = data => {
  data.pista = Array.isArray(data.pista) ? data.pista : [];
  data.conductora = data.conductora || 'Yineth Ortiz';
  data.enVivo = Boolean(data.enVivo);
  return data;
};

const loadState = async env => {
  if (!env.RADIO) return emptyState();
  const stored = await env.RADIO.get('programacion.json');
  if (stored) return normalizeState(await stored.json());
  if (env.ASSETS) {
    try {
      const asset = await env.ASSETS.fetch(new Request('https://eki.com.co/radio/programacion.json'));
      if (asset.ok) {
        const data = normalizeState(await asset.json());
        data.enVivo = false;
        await saveState(env, data);
        return data;
      }
    } catch (_error) { /* la programación queda vacía hasta el primer guardado */ }
  }
  return emptyState();
};

const saveState = (env, data) => {
  data.actualizado = new Date().toISOString();
  return env.RADIO.put('programacion.json', JSON.stringify(data, null, 2), {
    httpMetadata: { contentType: 'application/json; charset=utf-8' }
  });
};

const safeItem = item => {
  const id = String(item.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
  const src = String(item.src || '');
  const duration = Number(item.duracion);
  if (!id || !src.startsWith('/radio/audio/') || src.includes('..')) return null;
  if (!Number.isFinite(duration) || duration <= 0 || duration > 60 * 60 * 4) return null;
  return {
    id,
    tipo: item.tipo === 'capsula' ? 'capsula' : 'musica',
    titulo: String(item.titulo || 'Sin título').slice(0, 140),
    src,
    duracion: Math.round(duration * 1000) / 1000
  };
};

const tokenFrom = request => {
  const header = request.headers.get('Authorization') || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return new URL(request.url).searchParams.get('token') || '';
};

const signToken = async (secret, expires) => {
  const payload = String(expires);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
  return `${payload}.${btoa(String.fromCharCode(...sig))}`;
};

const validToken = async (secret, token) => {
  const [payload, sig] = String(token || '').split('.');
  const expires = Number(payload);
  if (!payload || !sig || !Number.isFinite(expires) || expires < Date.now()) return false;
  const expected = await signToken(secret, payload);
  return expected === `${payload}.${sig}`;
};

const canEdit = async (request, env) => {
  if (request.headers.get('Cf-Access-Authenticated-User-Email')) return true;
  if (!env.ESTUDIO_CLAVE) return false;
  return validToken(env.ESTUDIO_CLAVE, tokenFrom(request));
};

const escapeXml = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const liveSockets = (state, tag) => state.getWebSockets(tag).filter(ws => ws.readyState === 1);

const copyAudio = async message => {
  if (!message || typeof message === 'string') return null;
  if (typeof Blob !== 'undefined' && message instanceof Blob) return message.arrayBuffer();
  if (message instanceof ArrayBuffer) return message.slice(0);
  if (ArrayBuffer.isView(message)) return message.buffer.slice(message.byteOffset, message.byteOffset + message.byteLength);
  return null;
};

export class RadioRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('esperado websocket', { status: 426 });
    const url = new URL(request.url);
    const role = url.searchParams.get('role') === 'host' ? 'host' : 'listener';
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    if (role === 'host' && liveSockets(this.state, 'host').length) {
      this.state.acceptWebSocket(server, ['rechazado']);
      server.close(4001, 'ocupado');
      return new Response(null, { status: 101, webSocket: client });
    }
    if (role === 'listener' && liveSockets(this.state, 'listener').length >= 40) {
      this.state.acceptWebSocket(server, ['rechazado']);
      server.close(4003, 'lleno');
      return new Response(null, { status: 101, webSocket: client });
    }
    this.state.acceptWebSocket(server, [role]);
    if (role === 'host') await this.markLive(true);
    else server.send(JSON.stringify({ type: 'live', on: liveSockets(this.state, 'host').length > 0 }));
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    if (!this.state.getTags(ws).includes('host')) return;
    const audio = await copyAudio(message);
    if (!audio) return;
    for (const listener of liveSockets(this.state, 'listener')) {
      try { listener.send(audio.slice(0)); } catch (_error) { /* el oyente ya se fue */ }
    }
  }

  async webSocketClose(ws) {
    if (this.state.getTags(ws).includes('host')) await this.markLive(false);
  }

  async webSocketError(ws) {
    if (this.state.getTags(ws).includes('host')) await this.markLive(false);
  }

  async markLive(on) {
    if (!this.env?.RADIO) return;
    const data = await loadState(this.env);
    data.enVivo = on;
    await saveState(this.env, data);
    const note = JSON.stringify({ type: 'live', on });
    for (const listener of liveSockets(this.state, 'listener')) {
      try { listener.send(note); } catch (_error) { /* el oyente ya se fue */ }
    }
  }
}

const handleRadio = async (request, env, url) => {
  if (!env.RADIO && url.pathname !== '/api/radio/salud') {
    return json({ error: 'sin-carpeta' }, 503);
  }
  if (url.pathname === '/api/radio/salud') {
    return json({ ok: Boolean(env.RADIO), modo: env.RADIO ? 'cloud' : 'sin-carpeta' });
  }
  if (url.pathname === '/api/radio/entrar' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const access = request.headers.get('Cf-Access-Authenticated-User-Email');
    if (access) return json({ token: 'access' });
    if (!env.ESTUDIO_CLAVE || String(body.clave || '') !== env.ESTUDIO_CLAVE) return json({ error: 'clave' }, 401);
    const token = await signToken(env.ESTUDIO_CLAVE, Date.now() + (1000 * 60 * 60 * 12));
    return json({ token });
  }
  if (url.pathname === '/api/radio/yo') return json({ ok: await canEdit(request, env) }, (await canEdit(request, env)) ? 200 : 401);
  if (url.pathname === '/api/radio/programacion' && request.method === 'GET') return json(await loadState(env));
  if (url.pathname === '/api/radio/programacion' && request.method === 'PUT') {
    if (!(await canEdit(request, env))) return json({ error: 'clave' }, 401);
    const body = await request.json().catch(() => ({}));
    const state = await loadState(env);
    state.conductora = String(body.conductora || state.conductora || 'Yineth Ortiz').slice(0, 80);
    state.pista = (Array.isArray(body.pista) ? body.pista : []).map(safeItem).filter(Boolean);
    await saveState(env, state);
    return json(await loadState(env));
  }
  if (url.pathname === '/api/radio/en-vivo' && request.method === 'POST') {
    if (!(await canEdit(request, env))) return json({ error: 'clave' }, 401);
    const body = await request.json().catch(() => ({}));
    const state = await loadState(env);
    state.enVivo = Boolean(body.on);
    await saveState(env, state);
    return json(state);
  }
  if (url.pathname === '/api/radio/audio' && request.method === 'POST') {
    if (!(await canEdit(request, env))) return json({ error: 'clave' }, 401);
    const kind = request.headers.get('X-Radio-Kind') === 'capsula' ? 'capsula' : 'musica';
    const duration = Number(request.headers.get('X-Radio-Duration'));
    const title = decodeURIComponent(request.headers.get('X-Radio-Title') || 'Sin título');
    const original = decodeURIComponent(request.headers.get('X-Radio-Name') || '');
    const extFromName = (original.split('.').pop() || '').toLowerCase();
    const ext = extByType[(request.headers.get('Content-Type') || '').split(';')[0]] || (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm'].includes(extFromName) ? extFromName : '');
    if (!ext || !Number.isFinite(duration) || duration <= 0) return json({ error: 'audio' }, 400);
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > MAX_AUDIO) return json({ error: 'grande' }, 413);
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    await env.RADIO.put(`radio/audio/${id}.${ext}`, bytes, {
      httpMetadata: { contentType: request.headers.get('Content-Type') || 'application/octet-stream' }
    });
    return json(safeItem({ id, tipo: kind, titulo: title, src: `/radio/audio/${id}.${ext}`, duracion: duration }));
  }
  const audioMatch = url.pathname.match(/^\/api\/radio\/audio\/([a-zA-Z0-9_-]+)$/);
  if (audioMatch && request.method === 'DELETE') {
    if (!(await canEdit(request, env))) return json({ error: 'clave' }, 401);
    const state = await loadState(env);
    const current = state.pista.find(item => item.id === audioMatch[1]);
    if (current) await env.RADIO.delete(current.src.slice(1));
    return json({ ok: true });
  }
  if (url.pathname === '/radio/feed.xml') {
    const state = await loadState(env);
    const origin = url.origin;
    const items = state.pista.filter(item => item.tipo === 'capsula').map(item => `    <item>
      <title>${escapeXml(item.titulo)}</title>
      <guid isPermaLink="false">${escapeXml(item.id)}</guid>
      <enclosure url="${origin}${item.src}" length="0" type="audio/mpeg"/>
    </item>`).join('\n');
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>eki radio</title>
    <link>${origin}/</link>
    <description>Cápsulas de eki radio.</description>
    <language>es-co</language>
${items}
  </channel>
</rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
  }
  if (url.pathname === '/api/radio/live') {
    if (url.searchParams.get('role') === 'host' && !(await canEdit(request, env))) {
      return json({ error: 'clave' }, 401);
    }
    const id = env.RADIO_ROOM.idFromName('eki');
    return env.RADIO_ROOM.get(id).fetch(request);
  }
  return json({ error: 'no' }, 404);
};

const serveR2Audio = async (request, env, url) => {
  if (!env.RADIO) return null;
  const key = url.pathname.slice(1);
  const object = await env.RADIO.get(key);
  if (!object) return null;
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/radio') || url.pathname === '/radio/feed.xml') {
      return handleRadio(request, env, url);
    }
    if (url.pathname.startsWith('/radio/audio/')) {
      const fromBucket = await serveR2Audio(request, env, url);
      if (fromBucket) return fromBucket;
    }
    return env.ASSETS.fetch(request);
  }
};
