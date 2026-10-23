const TOKEN_KEY = 'eki-estudio';
const tr = value => (window.ekiI18n?.t ? window.ekiI18n.t(value) : value);

const dock = document.getElementById('radioDock');
const launch = document.getElementById('radioLaunch');
const audioEl = document.getElementById('radioAudio');

let air = { conductora: 'Yineth Ortiz', enVivo: false, pista: [] };
let draft = null;
let playing = false;
let mode = 'lista';
let liveSocket = null;
let liveCtx = null;
let liveNode = null;
let hostGear = null;
let hostStarting = false;
let apiMode = 'sin-api';

const bogotaSeconds = () => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date()).map(part => [part.type, part.value]));
  return (Number(parts.hour) * 3600) + (Number(parts.minute) * 60) + Number(parts.second);
};

const clockLabel = () => new Intl.DateTimeFormat(document.documentElement.lang === 'en' ? 'en-US' : 'es-CO', {
  timeZone: 'America/Bogota',
  hour: 'numeric',
  minute: '2-digit'
}).format(new Date());

const locate = (pista, at) => {
  const total = pista.reduce((sum, item) => sum + (Number(item.duracion) || 0), 0);
  if (!total) return null;
  let remain = at % total;
  for (let index = 0; index < pista.length; index += 1) {
    const duration = Number(pista[index].duracion) || 0;
    if (remain < duration) return { index, offset: remain };
    remain -= duration;
  }
  return { index: 0, offset: 0 };
};

const currentSlot = () => locate(air.pista || [], bogotaSeconds());

const kindLabel = item => (item?.tipo === 'capsula' ? tr('Cápsula') : tr('Música'));

const paint = () => {
  const title = document.getElementById('radioTitle');
  const meta = document.getElementById('radioMeta');
  const kicker = document.getElementById('radioKicker');
  const play = document.getElementById('radioPlay');
  const dot = launch?.querySelector('.radio-launch-dot');
  if (!title || !play) return;
  const live = Boolean(air.enVivo);
  dock?.classList.toggle('is-live', live);
  dot?.classList.toggle('is-live', live);
  play.textContent = playing ? tr('Pausar') : tr('Escuchar');
  if (live) {
    kicker.textContent = tr('En vivo');
    title.textContent = air.conductora || 'Yineth Ortiz';
    meta.textContent = tr('Hablando ahora');
    play.disabled = false;
    return;
  }
  kicker.textContent = 'eki radio';
  const slot = currentSlot();
  if (!slot) {
    title.textContent = tr('Aún no hay programación');
    meta.textContent = air.conductora || '';
    play.disabled = true;
    return;
  }
  const item = air.pista[slot.index];
  title.textContent = item.titulo || 'eki radio';
  meta.textContent = `${kindLabel(item)} · ${clockLabel()} · ${air.conductora || 'Yineth Ortiz'}`;
  play.disabled = false;
};

const loadAir = async () => {
  try {
    const response = await fetch('/api/radio/programacion', { cache: 'no-store' });
    if (response.ok) {
      air = await response.json();
      return;
    }
  } catch (_error) { /* el JSON estático cubre la página sin el estudio */ }
  const response = await fetch('/radio/programacion.json', { cache: 'no-store' });
  if (response.ok) air = await response.json();
};

const resample = (input, fromRate, toRate) => {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const length = Math.max(1, Math.round(input.length / ratio));
  const out = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    const pos = index * ratio;
    const left = Math.floor(pos);
    const frac = pos - left;
    const a = input[left] || 0;
    const b = input[left + 1] ?? a;
    out[index] = a + ((b - a) * frac);
  }
  return out;
};

const stopListener = () => {
  if (liveSocket) {
    liveSocket.onclose = null;
    liveSocket.close();
    liveSocket = null;
  }
  if (liveCtx) {
    liveCtx.close().catch(() => {});
    liveCtx = null;
    liveNode = null;
  }
};

const ensureLiveAudio = async () => {
  if (liveCtx) {
    await liveCtx.resume();
    return;
  }
  liveCtx = new AudioContext();
  await liveCtx.resume();
  await liveCtx.audioWorklet.addModule('/js/radio-worklet.js');
  liveNode = new AudioWorkletNode(liveCtx, 'eki-pcm');
  liveNode.connect(liveCtx.destination);
};

const connectListener = async () => {
  stopListener();
  const socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/radio/live?role=listener`);
  socket.binaryType = 'arraybuffer';
  liveSocket = socket;
  socket.onmessage = async event => {
    if (typeof event.data === 'string' || !playing || mode !== 'vivo') return;
    await ensureLiveAudio();
    const pcm = new Int16Array(event.data);
    const floats = new Float32Array(pcm.length);
    for (let index = 0; index < pcm.length; index += 1) floats[index] = pcm[index] / 32768;
    liveNode.port.postMessage(resample(floats, 16000, liveCtx.sampleRate));
  };
  socket.onclose = () => {
    if (liveSocket === socket) liveSocket = null;
  };
};

const syncLista = async () => {
  const slot = currentSlot();
  if (!slot || !playing) return;
  const item = air.pista[slot.index];
  if (!item?.src) return;
  if (audioEl.dataset.src !== item.src) {
    audioEl.dataset.src = item.src;
    audioEl.src = item.src;
    await new Promise((resolve, reject) => {
      audioEl.onloadedmetadata = resolve;
      audioEl.onerror = () => reject(new Error('audio'));
    });
  }
  const target = Math.min(slot.offset, Math.max(0, (audioEl.duration || slot.offset) - 0.2));
  if (Math.abs((audioEl.currentTime || 0) - target) > 2.5) audioEl.currentTime = target;
  if (audioEl.paused) await audioEl.play();
};

const tick = async () => {
  if (air.enVivo) {
    if (mode !== 'vivo') {
      mode = 'vivo';
      audioEl.pause();
      if (playing) await connectListener();
    }
    paint();
    return;
  }
  if (mode === 'vivo') {
    mode = 'lista';
    stopListener();
  }
  paint();
  if (!playing || mode !== 'lista') return;
  try {
    await syncLista();
  } catch (_error) {
    if (audioEl.error) {
      playing = false;
      paint();
    }
  }
};

const pausePlayback = () => {
  playing = false;
  audioEl.pause();
  stopListener();
  paint();
};

const setDock = open => {
  if (!dock || !launch) return;
  dock.hidden = !open;
  launch.setAttribute('aria-pressed', open ? 'true' : 'false');
  if (open) document.getElementById('radioPlay')?.focus();
};

launch?.addEventListener('click', () => setDock(dock.hidden));
document.getElementById('radioClose')?.addEventListener('click', () => setDock(false));
document.getElementById('radioPlay')?.addEventListener('click', async () => {
  if (playing) {
    pausePlayback();
    return;
  }
  playing = true;
  paint();
  await tick();
});
audioEl?.addEventListener('ended', () => { tick(); });
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) tick();
});
document.addEventListener('eki:langchange', () => {
  paint();
  renderDraft();
});

const token = () => {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (_error) { return ''; }
};

const authHeaders = extra => ({
  Authorization: `Bearer ${token()}`,
  ...extra
});

const studioMsg = text => {
  const node = document.getElementById('estudioMsg');
  if (node) node.textContent = text ? tr(text) : '';
};

const renderDraft = () => {
  const list = document.getElementById('estudioLista');
  if (!list || !draft) return;
  list.replaceChildren();
  draft.pista.forEach((item, index) => {
    const row = document.createElement('article');
    row.className = 'estudio-row';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = item.titulo;
    const meta = document.createElement('span');
    const minutes = Math.floor((Number(item.duracion) || 0) / 60);
    const seconds = Math.round((Number(item.duracion) || 0) % 60).toString().padStart(2, '0');
    meta.textContent = `${kindLabel(item)} · ${minutes}:${seconds}`;
    copy.append(title, meta);
    const actions = document.createElement('div');
    actions.className = 'estudio-row-actions';
    const up = document.createElement('button');
    up.type = 'button';
    up.className = 'is-quiet';
    up.textContent = tr('Arriba');
    up.disabled = index === 0;
    up.addEventListener('click', () => moveItem(index, -1));
    const down = document.createElement('button');
    down.type = 'button';
    down.className = 'is-quiet';
    down.textContent = tr('Abajo');
    down.disabled = index === draft.pista.length - 1;
    down.addEventListener('click', () => moveItem(index, 1));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'is-quiet';
    remove.textContent = tr('Quitar');
    remove.addEventListener('click', () => removeItem(item.id));
    actions.append(up, down, remove);
    row.append(copy, actions);
    list.append(row);
  });
  const name = document.getElementById('estudioConductora');
  if (name && document.activeElement !== name) name.value = draft.conductora || 'Yineth Ortiz';
  const liveBtn = document.getElementById('estudioLive');
  if (liveBtn) liveBtn.textContent = hostGear ? tr('Terminar') : tr('Salir en vivo');
};

const saveDraft = async () => {
  const name = document.getElementById('estudioConductora');
  draft.conductora = (name?.value || 'Yineth Ortiz').trim() || 'Yineth Ortiz';
  const response = await fetch('/api/radio/programacion', {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ conductora: draft.conductora, pista: draft.pista })
  });
  if (!response.ok) throw new Error('guardar');
  air = await response.json();
  draft.conductora = air.conductora;
  draft.pista = air.pista;
  paint();
};

const moveItem = async (index, delta) => {
  const next = index + delta;
  if (!draft || next < 0 || next >= draft.pista.length) return;
  const [item] = draft.pista.splice(index, 1);
  draft.pista.splice(next, 0, item);
  renderDraft();
  try {
    await saveDraft();
    studioMsg('La programación quedó al aire.');
  } catch (_error) {
    studioMsg('No se pudo guardar la programación.');
  }
};

const removeItem = async id => {
  if (!draft) return;
  const response = await fetch(`/api/radio/audio/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!response.ok && response.status !== 404) {
    studioMsg('No se pudo quitar ese audio.');
    return;
  }
  draft.pista = draft.pista.filter(item => item.id !== id);
  try {
    await saveDraft();
    renderDraft();
    studioMsg('Se quitó de la programación.');
  } catch (_error) {
    studioMsg('No se pudo guardar la programación.');
  }
};

const readDuration = file => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const probe = new Audio();
  probe.preload = 'metadata';
  probe.onloadedmetadata = () => {
    const duration = probe.duration;
    URL.revokeObjectURL(url);
    if (!Number.isFinite(duration) || duration <= 0) reject(new Error('duracion'));
    else resolve(duration);
  };
  probe.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('audio'));
  };
  probe.src = url;
});

const showStudio = on => {
  const gate = document.getElementById('estudioGate');
  const app = document.getElementById('estudioApp');
  if (gate) gate.hidden = on;
  if (app) app.hidden = !on;
};

const enterStudio = async clave => {
  const response = await fetch('/api/radio/entrar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clave })
  });
  if (!response.ok) {
    studioMsg('Clave incorrecta.');
    return;
  }
  const data = await response.json();
  try { localStorage.setItem(TOKEN_KEY, data.token); } catch (_error) { /* sigue en memoria de esta pestaña */ }
  const program = await fetch('/api/radio/programacion', { cache: 'no-store' });
  draft = await program.json();
  air = draft;
  showStudio(true);
  renderDraft();
  studioMsg('');
  paint();
};

const releaseHost = () => {
  if (!hostGear) return null;
  const gear = hostGear;
  hostGear = null;
  gear.processor.onaudioprocess = null;
  gear.processor.disconnect();
  gear.source.disconnect();
  gear.stream.getTracks().forEach(track => track.stop());
  gear.ctx.close().catch(() => {});
  return gear;
};

const stopHost = async () => {
  const gear = releaseHost();
  if (!gear) return;
  gear.socket.close();
  try {
    await fetch('/api/radio/en-vivo', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ on: false })
    });
  } catch (_error) { /* el cierre del micrófono ya apaga el en vivo */ }
  air.enVivo = false;
  if (draft) draft.enVivo = false;
  renderDraft();
  studioMsg('Terminó el en vivo. La programación sigue.');
  tick();
};

const startHost = async () => {
  if (hostGear || hostStarting) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    studioMsg('Este navegador no puede usar el micrófono.');
    return;
  }
  hostStarting = true;
  const ctx = new AudioContext();
  const resume = ctx.resume();
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 }
    });
    await resume;
  } catch (_error) {
    ctx.close().catch(() => {});
    hostStarting = false;
    studioMsg('El navegador no dejó usar el micrófono.');
    return;
  }
  const source = ctx.createMediaStreamSource(stream);
  const processor = ctx.createScriptProcessor(4096, 1, 1);
  const mute = ctx.createGain();
  mute.gain.value = 0;
  source.connect(processor);
  processor.connect(mute);
  mute.connect(ctx.destination);
  const socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/radio/live?role=host&token=${encodeURIComponent(token())}`);
  socket.binaryType = 'arraybuffer';
  hostGear = { processor, source, stream, ctx, socket };
  hostStarting = false;
  let opened = false;
  socket.onopen = () => {
    opened = true;
    air.enVivo = true;
    if (draft) draft.enVivo = true;
    renderDraft();
    studioMsg('Ya estás al aire.');
    tick();
  };
  socket.onclose = event => {
    if (!hostGear || hostGear.socket !== socket) return;
    releaseHost();
    air.enVivo = false;
    if (draft) draft.enVivo = false;
    renderDraft();
    if (!opened) studioMsg('No se pudo abrir el en vivo.');
    else if (event.code === 4001) studioMsg('Ya hay un en vivo abierto en otra ventana.');
    else studioMsg('Terminó el en vivo. La programación sigue.');
    tick();
  };
  socket.onerror = () => {
    if (!opened) studioMsg('No se pudo abrir el en vivo.');
  };
  processor.onaudioprocess = event => {
    if (socket.readyState !== 1) return;
    const input = new Float32Array(event.inputBuffer.getChannelData(0));
    const down = resample(input, ctx.sampleRate, 16000);
    const pcm = new Int16Array(down.length);
    for (let index = 0; index < down.length; index += 1) {
      const sample = Math.max(-1, Math.min(1, down[index]));
      pcm[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    socket.send(pcm.buffer);
  };
};

const bindStudio = () => {
  document.getElementById('estudioEntrar')?.addEventListener('click', () => {
    const clave = document.getElementById('estudioClave')?.value || '';
    enterStudio(clave);
  });
  document.getElementById('estudioClave')?.addEventListener('keydown', event => {
    if (event.key === 'Enter') document.getElementById('estudioEntrar')?.click();
  });
  document.getElementById('estudioSalir')?.addEventListener('click', () => {
    try { localStorage.removeItem(TOKEN_KEY); } catch (_error) { /* nada */ }
    showStudio(false);
    studioMsg('');
  });
  document.getElementById('estudioGuardar')?.addEventListener('click', async () => {
    try {
      await saveDraft();
      studioMsg('La programación quedó al aire.');
    } catch (_error) {
      studioMsg('No se pudo guardar la programación.');
    }
  });
  document.getElementById('estudioLive')?.addEventListener('click', () => {
    if (hostGear) stopHost();
    else startHost();
  });
  document.getElementById('estudioSubir')?.addEventListener('click', async () => {
    const input = document.getElementById('estudioArchivo');
    const file = input?.files?.[0];
    const rights = document.getElementById('estudioDerechos');
    if (!file || !rights?.checked) {
      studioMsg('Elige un audio y confirma que eki puede emitirlo.');
      return;
    }
    let duration = 0;
    try {
      duration = await readDuration(file);
    } catch (_error) {
      studioMsg('Ese audio no se pudo leer.');
      return;
    }
    const titleInput = document.getElementById('estudioTitulo');
    const kind = document.getElementById('estudioTipo')?.value === 'capsula' ? 'capsula' : 'musica';
    const title = (titleInput?.value || file.name.replace(/\.[^.]+$/, '')).trim();
    const response = await fetch('/api/radio/audio', {
      method: 'POST',
      headers: authHeaders({
        'Content-Type': file.type || 'application/octet-stream',
        'X-Radio-Title': encodeURIComponent(title),
        'X-Radio-Kind': kind,
        'X-Radio-Duration': String(duration),
        'X-Radio-Name': encodeURIComponent(file.name)
      }),
      body: file
    });
    if (!response.ok) {
      studioMsg('No se pudo subir el audio.');
      return;
    }
    const item = await response.json();
    draft.pista.push(item);
    try {
      await saveDraft();
      if (titleInput) titleInput.value = '';
      if (input) input.value = '';
      rights.checked = false;
      renderDraft();
      studioMsg('El audio quedó en la programación.');
    } catch (_error) {
      studioMsg('El audio se subió, pero no quedó guardado en la lista.');
    }
  });
  const rss = document.getElementById('estudioRss');
  if (rss) rss.textContent = `${location.origin}/radio/feed.xml`;
};

const bootStudio = async () => {
  bindStudio();
  try {
    const health = await fetch('/api/radio/salud', { cache: 'no-store' });
    if (!health.ok) throw new Error('salud');
    const data = await health.json();
    apiMode = data.modo || 'local';
  } catch (_error) {
    apiMode = 'sin-api';
  }
  const note = document.getElementById('estudioNota');
  if (note) {
    if (apiMode === 'sin-api' || apiMode === 'sin-carpeta') {
      note.textContent = tr('Desde aquí todavía no se pueden guardar audios. El botón de la página sí puede sonar con la programación publicada.');
      const gate = document.getElementById('estudioGate');
      if (gate) gate.hidden = true;
    } else if (apiMode === 'local') {
      note.textContent = tr('Esta vista guarda los audios en este computador. Yineth entra con la clave del estudio.');
    } else {
      note.textContent = tr('Yineth entra con su correo cuando Cloudflare Access esté activo, o con la clave del estudio.');
    }
  }
  if (!token() || apiMode === 'sin-api') return;
  const probe = await fetch('/api/radio/programacion', {
    cache: 'no-store',
    headers: authHeaders()
  });
  if (!probe.ok) return;
  const me = await fetch('/api/radio/yo', { headers: authHeaders() });
  if (!me.ok) {
    try { localStorage.removeItem(TOKEN_KEY); } catch (_error) { /* nada */ }
    return;
  }
  draft = await probe.json();
  showStudio(true);
  renderDraft();
};

loadAir().then(() => {
  paint();
  setInterval(async () => {
    const wasLive = Boolean(air.enVivo);
    await loadAir();
    if (Boolean(air.enVivo) !== wasLive || mode === 'lista') tick();
    else paint();
  }, 8000);
});
bootStudio();
window.addEventListener('beforeunload', () => {
  if (hostGear) hostGear.socket?.close();
});
