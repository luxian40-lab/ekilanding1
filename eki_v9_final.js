const selectAll = selector => Array.from(document.querySelectorAll(selector));

const setActivePage = id => {
  selectAll('.page').forEach(page => page.classList.toggle('active', page.id === `page-${id}`));
  window.scrollTo(0, 0);
  selectAll('nav a').forEach(link => link.classList.toggle('on', link.id === `n-${id}`));
  try {
    if(window.history && window.history.replaceState){
      window.history.replaceState(null, '', `#page-${id}`);
    } else {
      window.location.hash = `#page-${id}`;
    }
  } catch (error) {
    window.location.hash = `#page-${id}`;
  }
  document.dispatchEvent(new CustomEvent('eki:pagechange', { detail: { id } }));
};

const openModal = id => {
  const modal = document.getElementById(id);
  if(!modal) return;
  modal.classList.add('open');
  const closeButton = modal.querySelector('.mcl');
  if(closeButton) closeButton.focus();
  if(id === 'mChat'){
    resetChatDemo();
    setTimeout(() => document.getElementById('btn-iniciar')?.focus(), 120);
  }
  if(id === 'mHablemos'){
    resetHablemosChat();
    setTimeout(() => {
      const firstOption = document.querySelector('#hablemosOptions .hablemos-option');
      if(firstOption){
        firstOption.focus();
      } else {
        document.getElementById('hablemosInput')?.focus();
      }
    }, HABLEMOS_DELAY + 200);
  }
};

const createChatBubble = (text, type = 'incoming', author = 'eki') => {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${type}`;
  const chatText = document.createElement('div');
  chatText.className = 'chat-text';
  chatText.textContent = text;
  const chatMeta = document.createElement('div');
  chatMeta.className = 'chat-meta';
  chatMeta.textContent = author;
  bubble.appendChild(chatText);
  bubble.appendChild(chatMeta);
  return bubble;
};

const getToastRoot = () => {
  let root = document.getElementById('eki-toast-root');
  if(root) return root;

  root = document.createElement('div');
  root.id = 'eki-toast-root';
  root.className = 'eki-toast-root';
  document.body.appendChild(root);
  return root;
};

const showToast = (message, type = 'success') => {
  const root = getToastRoot();
  const toast = document.createElement('div');
  toast.className = `eki-toast ${type === 'warning' ? 'is-warning' : 'is-success'}`;
  toast.textContent = message;
  root.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('is-visible');
  });

  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 280);
  }, 2600);
};

const flujoModulo1 = [
  { tipo: 'texto', emisor: 'Sistema', texto: 'Bienvenido al programa de eki.' },
  { tipo: 'texto', emisor: 'Claudia', texto: '🤓 ¡Hola usuario! Soy la Facilitadora Claudia. Seré su facilitadora a cargo en el curso TOME LAS RIENDAS DE SU DINERO. Le plantearé retos prácticos para que aplique lo aprendido. ¡Vamos a aprender juntos! 💪' },
  { tipo: 'texto', emisor: 'Dario', texto: '📚 ¡Y yo soy Dario, tu compañero de estudio! Estaré pendiente de ti en este proceso. Si tienes dudas antes de los retos, yo te ayudo a repasar. ¡Cuenta conmigo! 🤝' },
  { tipo: 'texto', emisor: 'Sistema', texto: '🎮 Nuestra experiencia de formación funciona a través de puntos. A medida que avances en el curso, tendrás retos que evaluar.' },
  { tipo: 'texto', emisor: 'Sistema', texto: '💰 Puntos que obtendrás al superar cada reto. ¡Vamos a aprender y avanzar juntos! 💪' },
  { tipo: 'texto', emisor: 'Sistema', texto: '📚 Comenzamos con el primer módulo de tu curso... 👇' },
  { tipo: 'texto', emisor: 'Sistema', texto: '📖 Módulo 1: Bienvenidos. ¡Bienvenido al Módulo 1: “Primero lo Primero”! En este módulo usted conocerá tres conceptos clave para entender mejor cómo manejar el dinero en la vida diaria: gasto, costo e ingreso. Aprender a diferenciarlos le ayudará a tomar mejores decisiones, cuidar sus recursos y valorar más el esfuerzo que hay detrás de cada peso que entra y sale.' },
  { tipo: 'video', url: 'videos-demo/video-modulo-1.mp4', alt: 'Video del módulo 1' },
  { tipo: 'texto', emisor: 'Sistema', texto: 'Tómese su tiempo para ver el material. En cuanto termine, solo responda listo para continuar.' }
];

const flujoModulo2 = [
  { tipo: 'texto', emisor: 'Sistema', texto: '📖 Módulo 2: Organizo mi presente y planifico mi futuro.' },
  { tipo: 'texto', emisor: 'Sistema', texto: 'En este nuevo paso del proceso, usted aprenderá a revisar su situación financiera, llevar un mejor control de su dinero y organizar sus recursos con más claridad. También conocerá cómo identificar lo que tiene, lo que debe y cómo construir un presupuesto que le ayude a tomar mejores decisiones para su presente y su futuro.' },
  { tipo: 'imagen', url: 'videos-demo/modulo-2.jpeg', alt: 'Material del módulo 2' },
  { tipo: 'texto', emisor: 'Sistema', texto: 'Cuando termine este módulo, presione el botón Listo para cerrar el demo.' }
];

let demoExecutionToken = 0;
const DEMO_MESSAGE_DELAY = 2000;

const pintarMensajeTexto = (emisor, texto) => {
  const chatMessages = document.getElementById('chatMessages');
  if(!chatMessages) return;
  chatMessages.appendChild(createChatBubble(texto, 'incoming', emisor));
};

const pintarMedia = (tipo, url, alt = '') => {
  const chatMessages = document.getElementById('chatMessages');
  if(!chatMessages) return;
  const mediaUrl = encodeURI(url);
  const wrapper = document.createElement('div');
  wrapper.className = 'chat-media-card';
  wrapper.style.maxWidth = '100%';
  wrapper.style.width = '100%';
  wrapper.style.alignSelf = 'stretch';
  wrapper.style.flex = '0 0 auto';

  const mediaContainer = document.createElement('div');
  mediaContainer.className = tipo === 'video' ? 'chat-video-wrap' : 'chat-image-wrap';
  mediaContainer.style.width = '100%';
  mediaContainer.style.height = '260px';
  mediaContainer.style.minHeight = '220px';
  mediaContainer.style.borderRadius = '10px';
  mediaContainer.style.overflow = 'hidden';
  wrapper.appendChild(mediaContainer);

  const setStableMediaHeight = (naturalWidth, naturalHeight) => {
    if(!(naturalWidth > 0 && naturalHeight > 0)) return;
    const boxWidth = wrapper.clientWidth || chatMessages.clientWidth || 320;
    const rawHeight = Math.round((boxWidth * naturalHeight) / naturalWidth);
    const safeHeight = Math.max(220, Math.min(420, rawHeight));
    mediaContainer.style.height = `${safeHeight}px`;
  };

  const appendErrorNote = text => {
    const note = document.createElement('div');
    note.className = 'chat-media-note';
    note.textContent = text;
    wrapper.appendChild(note);
  };

  if(tipo === 'video'){
    mediaContainer.style.background = '#000';

    const videoEl = document.createElement('video');
    videoEl.controls = true;
    videoEl.preload = 'metadata';
    videoEl.playsInline = true;
    videoEl.setAttribute('playsinline', '');
    videoEl.setAttribute('webkit-playsinline', '');
    videoEl.src = mediaUrl;
    videoEl.setAttribute('aria-label', alt || 'Video del módulo');
    videoEl.style.display = 'block';
    videoEl.style.width = '100%';
    videoEl.style.height = '100%';
    videoEl.style.objectFit = 'contain';
    videoEl.style.background = '#000';
    videoEl.textContent = 'Tu navegador no soporta video.';
    mediaContainer.appendChild(videoEl);

    videoEl.addEventListener('loadedmetadata', () => {
      setStableMediaHeight(videoEl.videoWidth, videoEl.videoHeight);
    }, { once: true });

    videoEl.addEventListener('error', () => {
      appendErrorNote('No se pudo cargar este video en este navegador.');
    }, { once: true });

    videoEl.load();
  } else {
    mediaContainer.style.background = '#fff';
    mediaContainer.style.display = 'flex';
    mediaContainer.style.alignItems = 'center';
    mediaContainer.style.justifyContent = 'center';

    const imageEl = document.createElement('img');
    imageEl.src = mediaUrl;
    imageEl.alt = alt || 'Contenido del módulo';
    imageEl.setAttribute('loading', 'eager');
    imageEl.setAttribute('decoding', 'sync');
    imageEl.style.display = 'block';
    imageEl.style.width = '100%';
    imageEl.style.height = '100%';
    imageEl.style.objectFit = 'contain';
    mediaContainer.appendChild(imageEl);

    imageEl.addEventListener('load', () => {
      setStableMediaHeight(imageEl.naturalWidth, imageEl.naturalHeight);
    }, { once: true });

    imageEl.addEventListener('error', () => {
      appendErrorNote('No se pudo cargar esta imagen en este navegador.');
    }, { once: true });
  }

  const chatMeta = document.createElement('div');
  chatMeta.className = 'chat-meta';
  chatMeta.textContent = 'Sistema';
  wrapper.appendChild(chatMeta);
  chatMessages.appendChild(wrapper);
};

const scrollChatToBottom = () => {
  const chatMessages = document.getElementById('chatMessages');
  const panel = chatMessages?.parentElement;
  if(chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
  if(panel) panel.scrollTop = panel.scrollHeight;
};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const reproducirFlujo = async (flujo, token) => {
  for(const mensaje of flujo){
    if(token !== demoExecutionToken) return false;
    await wait(DEMO_MESSAGE_DELAY);
    if(token !== demoExecutionToken) return false;

    if(mensaje.tipo === 'texto'){
      pintarMensajeTexto(mensaje.emisor, mensaje.texto);
    } else if(mensaje.tipo === 'imagen'){
      pintarMedia('imagen', mensaje.url, mensaje.alt);
    } else if(mensaje.tipo === 'video'){
      pintarMedia('video', mensaje.url, mensaje.alt);
    }
    scrollChatToBottom();
  }
  return token === demoExecutionToken;
};

const resetChatDemo = () => {
  demoExecutionToken++;
  const chatMessages = document.getElementById('chatMessages');
  const areaInteraccion = document.getElementById('area-interaccion');
  if(!chatMessages || !areaInteraccion) return;

  chatMessages.innerHTML = '';
  chatMessages.appendChild(createChatBubble('Hola, soy la Facilitadora Claudia. Pulsa “Comenzar Demo Interactivo” para iniciar este recorrido.', 'incoming', 'Claudia'));
  areaInteraccion.innerHTML = '<button id="btn-iniciar" class="mbp" type="button">Comenzar Demo Interactivo</button>';
  scrollChatToBottom();
};

const iniciarDemo = async () => {
  const token = ++demoExecutionToken;
  const chatMessages = document.getElementById('chatMessages');
  const areaInteraccion = document.getElementById('area-interaccion');
  if(!chatMessages || !areaInteraccion) return;

  chatMessages.innerHTML = '';
  areaInteraccion.innerHTML = '';

  const termino = await reproducirFlujo(flujoModulo1, token);
  if(!termino || token !== demoExecutionToken) return;
  areaInteraccion.innerHTML = '<button class="mbp" id="btn-listo-mod1" type="button">Enviar "Listo"</button>';
};

const continuarModulo2 = async () => {
  const chatMessages = document.getElementById('chatMessages');
  const areaInteraccion = document.getElementById('area-interaccion');
  if(!chatMessages || !areaInteraccion) return;

  chatMessages.appendChild(createChatBubble('Listo', 'outgoing', 'Tu'));
  scrollChatToBottom();
  areaInteraccion.innerHTML = '';

  const token = ++demoExecutionToken;
  const termino = await reproducirFlujo(flujoModulo2, token);
  if(!termino || token !== demoExecutionToken) return;
  areaInteraccion.innerHTML = '<button class="mbp" id="btn-listo-mod2" type="button">Enviar "Listo"</button>';
};

const finalizarDemo = () => {
  const token = ++demoExecutionToken;
  const chatMessages = document.getElementById('chatMessages');
  const areaInteraccion = document.getElementById('area-interaccion');
  if(!chatMessages || !areaInteraccion) return;

  chatMessages.appendChild(createChatBubble('Listo', 'outgoing', 'Tu'));
  scrollChatToBottom();
  areaInteraccion.innerHTML = '';

  setTimeout(() => {
    if(token !== demoExecutionToken) return;
    pintarMensajeTexto('Sistema', 'Para saber más de cómo funciona nuestra experiencia, agéndate con nosotros. Este demo no tiene costo.');
    areaInteraccion.innerHTML = '<button class="mbp" type="button" data-close="mChat" data-page="contacto">Agéndate con nosotros</button>';
    scrollChatToBottom();
  }, 900);
};

let hablemosExecutionToken = 0;
let hablemosStepIndex = 0;
const HABLEMOS_DELAY = 1200;
const HABLEMOS_FLOW = [
  {
    key: 'solucion',
    type: 'options',
    text: 'Para empezar, elige cuál de nuestras 4 soluciones te interesa:',
    placeholder: 'Primero selecciona una solución',
    options: ['WhatsApp + IA', 'Proyectos a medida', 'Contenido rural', 'Plataforma LXP + Métricas']
  },
  {
    key: 'nombre-organizacion',
    type: 'text',
    text: 'Perfecto. ¿Cuál es tu nombre y organización?',
    placeholder: 'Ej. Ana Gómez - Fundación XYZ'
  },
  {
    key: 'correo',
    type: 'text',
    text: 'Gracias. ¿Cuál es tu correo electrónico de contacto?',
    placeholder: 'correo@organizacion.com'
  },
  {
    key: 'necesidad',
    type: 'text',
    text: 'Ahora sí, cuéntame brevemente tu necesidad para preparar una demo útil para tu equipo.',
    placeholder: 'Describe tu objetivo o reto principal'
  }
];

const getHablemosField = key => document.getElementById(`hablemos-${key}`);
const setHablemosField = (key, value) => {
  const field = getHablemosField(key);
  if(field) field.value = value;
};

const pintarMensajeHablemos = (text, type = 'incoming', author = 'eki') => {
  const chatMessages = document.getElementById('chatMessagesHablemos');
  if(!chatMessages) return;
  chatMessages.appendChild(createChatBubble(text, type, author));
};

const getHablemosControls = () => ({
  input: document.getElementById('hablemosInput'),
  send: document.getElementById('hablemosSend'),
  options: document.getElementById('hablemosOptions')
});

const setHablemosInputState = (enabled, placeholder = 'Escribe aquí...') => {
  const { input, send } = getHablemosControls();
  if(input){
    input.disabled = !enabled;
    input.placeholder = placeholder;
  }
  if(send){
    send.disabled = !enabled;
  }
};

const getCurrentHablemosStep = () => HABLEMOS_FLOW[hablemosStepIndex] || null;

const clearHablemosOptions = () => {
  const { options } = getHablemosControls();
  if(options) options.innerHTML = '';
};

const renderHablemosOptions = optionList => {
  const { options } = getHablemosControls();
  if(!options) return;
  options.innerHTML = '';

  optionList.forEach(optionText => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hablemos-option';
    button.textContent = optionText;
    button.addEventListener('click', () => {
      handleHablemosReply(optionText, 'option');
    });
    options.appendChild(button);
  });

  options.querySelector('.hablemos-option')?.focus();
};

const preguntarPasoHablemos = async (token, conEspera = true) => {
  const step = getCurrentHablemosStep();
  if(!step) return;

  if(conEspera){
    await wait(HABLEMOS_DELAY);
    if(token !== hablemosExecutionToken) return;
  }

  pintarMensajeHablemos(step.text, 'incoming', 'eki');
  scrollHablemosToBottom();

  if(step.type === 'options'){
    setHablemosInputState(false, step.placeholder || 'Selecciona una opción');
    renderHablemosOptions(step.options || []);
    return;
  }

  clearHablemosOptions();
  setHablemosInputState(true, step.placeholder || 'Escribe aquí...');
  setTimeout(() => document.getElementById('hablemosInput')?.focus(), 80);
};

const finalizarHablemosFlujo = async token => {
  clearHablemosOptions();
  setHablemosInputState(false, 'Enviando...');
  await wait(HABLEMOS_DELAY);
  if(token !== hablemosExecutionToken) return;
  pintarMensajeHablemos('Gracias. Ya tengo lo necesario. En breve un asesor de eki se contactará contigo.', 'incoming', 'eki');
  scrollHablemosToBottom();

  const sent = await submitHablemosForm();
  if(token !== hablemosExecutionToken) return;

  if(sent){
    showToast('Solicitud enviada. Gracias por escribirnos.', 'success');
  } else {
    showToast('No pudimos confirmar el envio. Revisaremos tu solicitud.', 'warning');
  }

  setTimeout(() => {
    if(token !== hablemosExecutionToken) return;
    closeModal('mHablemos');
  }, 2000);
};

const resetHablemosChat = () => {
  const token = ++hablemosExecutionToken;
  hablemosStepIndex = 0;
  const chatMessages = document.getElementById('chatMessagesHablemos');
  const areaHablemos = document.getElementById('area-hablemos');
  if(!chatMessages || !areaHablemos) return;

  chatMessages.innerHTML = '';
  areaHablemos.innerHTML = '<div class="chat-form"><input id="hablemosInput" type="text" placeholder="Escribe aquí..." autocomplete="off"><button id="hablemosSend" class="mbp" type="button">Enviar</button></div><div id="hablemosOptions" class="hablemos-options"></div>';

  setHablemosField('nombre-organizacion', '');
  setHablemosField('correo', '');
  setHablemosField('solucion', '');
  setHablemosField('necesidad', '');

  pintarMensajeHablemos('¡Hola! Soy el asistente de eki. Te acompañaré a descubrir cómo impulsamos el desarrollo rural integral mediante procesos que conectan el conocimiento con las necesidades reales del territorio.', 'incoming', 'eki');
  setHablemosInputState(false, 'Primero selecciona una solución');
  clearHablemosOptions();
  scrollHablemosToBottom();

  void preguntarPasoHablemos(token, true);
};

const scrollHablemosToBottom = () => {
  const chatMessages = document.getElementById('chatMessagesHablemos');
  const panel = chatMessages?.parentElement;
  if(chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
  if(panel) panel.scrollTop = panel.scrollHeight;
};

const handleHablemosReply = async (message, source = 'input') => {
  const token = hablemosExecutionToken;
  const { input } = getHablemosControls();
  const value = message?.trim();
  if(!value) return;

  const step = getCurrentHablemosStep();
  if(!step) return;
  if(step.type === 'options' && source !== 'option') return;
  if(step.type === 'text' && input?.disabled) return;

  pintarMensajeHablemos(value, 'outgoing', 'Tú');
  if(input && source === 'input') input.value = '';
  scrollHablemosToBottom();

  setHablemosField(step.key, value);
  hablemosStepIndex++;
  clearHablemosOptions();

  if(!getCurrentHablemosStep()) {
    await finalizarHablemosFlujo(token);
    return;
  }

  await preguntarPasoHablemos(token, true);
};

const submitHablemosForm = async () => {
  const form = document.getElementById('hablemos-form');
  if(!form) return false;
  const payload = new FormData(form);

  try {
    await fetch(form.action, {
      method: 'POST',
      mode: 'no-cors',
      body: payload,
    });
    return true;
  } catch (error) {
    return false;
  }
};

const submitExternalForm = async form => {
  if(!form) return false;
  try {
    await fetch(form.action, {
      method: (form.method || 'POST').toUpperCase(),
      mode: 'no-cors',
      body: new FormData(form),
    });
    return true;
  } catch (error) {
    return false;
  }
};

const initAsyncLeadForms = () => {
  const forms = Array.from(document.querySelectorAll('form[data-async-form="true"]'));
  forms.forEach(form => {
    if(form.dataset.asyncBound === 'true') return;
    form.dataset.asyncBound = 'true';

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if(!form.reportValidity()) return;

      const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
      const originalLabel = submitButton?.textContent;

      if(submitButton){
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';
      }

      const sent = await submitExternalForm(form);
      if(sent){
        showToast(form.dataset.successMessage || 'Solicitud enviada. Gracias por escribirnos.', 'success');
        form.reset();
      } else {
        showToast('No pudimos confirmar el envio. Revisaremos tu solicitud.', 'warning');
      }

      if(submitButton){
        submitButton.disabled = false;
        submitButton.textContent = originalLabel || 'Enviar';
      }
    });
  });
};

const updateModalImage = (src, alt) => {
  const img = document.getElementById('mRimg');
  const label = document.getElementById('mRlabel');
  const title = document.getElementById('mRtitle');
  if(!img) return;
  img.src = src;
  img.alt = alt || 'Recuerdo eki';
  const teamImgs = ['andres.jpeg','rosmery.jpeg','julian.jpeg','luisa.jpeg','andre.jpeg','juliand.jpeg','juliana.jpeg','andres.jpg','rosmery.jpg','julian.jpg','luisa.jpg','andre.jpg','disenador.jpg','juliana.jpg'];
  const isTeam = teamImgs.some(name => src.includes(name));
  if(label && title){
    label.textContent = isTeam ? 'El equipo' : 'Nuestros recuerdos';
    title.textContent = isTeam ? 'Foto del equipo' : 'Galería de recuerdos';
  }
  openModal('mR');
};

const openVideoModal = (src, titleText, poster) => {
  const modal = document.getElementById('mVideo');
  if(!modal) return;
  const source = modal.querySelector('#mVideoSource');
  const video = modal.querySelector('#mVideoPlayer');
  const title = modal.querySelector('#mVideoTitle');
  if(source) source.src = src;
  if(video){
    if(poster){
      video.poster = poster;
    } else {
      video.removeAttribute('poster');
    }
    video.load();
  }
  if(title) title.textContent = titleText || 'Video';
  openModal('mVideo');
};

const closeModal = id => {
  const modal = document.getElementById(id);
  if(!modal) return;
  modal.classList.remove('open');
  modal.querySelectorAll('iframe[data-reset-src]').forEach(iframe => {
    iframe.src = iframe.dataset.resetSrc;
  });
  modal.querySelectorAll('video').forEach(video => {
    video.pause();
    video.currentTime = 0;
  });
  if(id === 'mChat'){
    resetChatDemo();
  }
  if(id === 'mHablemos'){
    resetHablemosChat();
  }
};

selectAll('.mo').forEach(modal => {
  modal.addEventListener('click', e => {
    if(e.target === modal) closeModal(modal.id);
  });
});

selectAll('a[href^="#page-"]').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href') || '';
    if(!href.startsWith('#page-')) return;
    const pageId = href.replace('#page-','');
    if(!pageId) return;
    e.preventDefault();
    setActivePage(pageId);
  });
});

['home','nosotros','soluciones','experiencias','demo','contacto'].forEach(id => {
  const el = document.getElementById(`n-${id}`);
  if(!el) return;
  el.addEventListener('click', e => {
    e.preventDefault();
    setActivePage(id);
  });
});

const animItems = selectAll('.anim-in');
if('IntersectionObserver' in window){
  const animObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });
  animItems.forEach(item => animObserver.observe(item));
} else {
  animItems.forEach(item => item.classList.add('in'));
}

const initImpactCounters = () => {
  const counters = selectAll('.js-count[data-count-target]').map(el => ({
    el,
    target: parseInt(el.dataset.countTarget, 10) || 0,
    prefix: el.dataset.countPrefix || '',
    suffix: el.dataset.countSuffix || '',
    value: 0,
    duration: parseInt(el.dataset.countDuration, 10) || 1400,
    elapsed: 0,
    raf: null,
    startTime: null,
    finished: false,
  }));

  if(counters.length === 0) return;

  const updateDisplay = state => {
    const formatted = Math.floor(state.value).toLocaleString('es-CO');
    state.el.textContent = `${state.prefix}${formatted}${state.suffix}`;
  };

  if(!('IntersectionObserver' in window)){
    counters.forEach(state => {
      state.value = state.target;
      updateDisplay(state);
    });
    return;
  }

  const step = (state, timestamp) => {
    if(state.finished) return;
    if(!state.startTime) state.startTime = timestamp - state.elapsed;
    state.elapsed = timestamp - state.startTime;
    const progress = Math.min(state.elapsed / state.duration, 1);
    state.value = state.target * progress;
    updateDisplay(state);
    if(progress < 1){
      state.raf = requestAnimationFrame(ts => step(state, ts));
    } else {
      state.value = state.target;
      updateDisplay(state);
      state.finished = true;
      state.raf = null;
    }
  };

  const counterByElement = new Map(counters.map(state => [state.el, state]));

  const onIntersect = (entries, observer) => {
    entries.forEach(entry => {
      const state = counterByElement.get(entry.target);
      if(!state) return;
      if(entry.isIntersecting){
        if(state.finished){
          observer.unobserve(state.el);
          return;
        }
        if(state.raf) return;
        state.startTime = performance.now() - state.elapsed;
        state.raf = requestAnimationFrame(ts => step(state, ts));
      } else if(state.raf){
        cancelAnimationFrame(state.raf);
        state.raf = null;
      }
    });
  };

  const observer = new IntersectionObserver(onIntersect, { threshold: 0.35 });
  counters.forEach(state => {
    updateDisplay(state);
    observer.observe(state.el);
  });
};

window.sP = setActivePage;
window.setActivePage = setActivePage;
window.oM = openModal;
window.oR = updateModalImage;
window.cM = closeModal;

// Delegación de eventos para HTML más limpio
window.addEventListener('click', event => {
  const closeTarget = event.target.closest('[data-close]');
  const pageTarget = event.target.closest('[data-page]');
  const modalTarget = event.target.closest('[data-modal]');

  if(closeTarget){
    event.preventDefault();
    closeModal(closeTarget.dataset.close);
    if(pageTarget){
      setActivePage(pageTarget.dataset.page);
      return;
    }
    if(modalTarget){
      openModal(modalTarget.dataset.modal);
      return;
    }
    return;
  }

  if(pageTarget){
    event.preventDefault();
    setActivePage(pageTarget.dataset.page);
    return;
  }

  if(modalTarget){
    event.preventDefault();
    openModal(modalTarget.dataset.modal);
    return;
  }
  const imageTarget = event.target.closest('[data-image]');
  if(imageTarget){
    event.preventDefault();
    updateModalImage(imageTarget.dataset.image, imageTarget.dataset.title);
    return;
  }
  const videoTarget = event.target.closest('[data-video]');
  if(videoTarget){
    if(videoTarget.closest('.exp-hero-block')) return;
    event.preventDefault();
    openVideoModal(videoTarget.dataset.video, videoTarget.dataset.videoTitle, videoTarget.dataset.videoPoster);
    return;
  }
});

window.addEventListener('click', event => {
  const target = event.target.closest('#hablemosSend');
  if(target){
    event.preventDefault();
    const input = document.getElementById('hablemosInput');
    if(input) handleHablemosReply(input.value);
  }
});

window.addEventListener('keydown', event => {
  const input = event.target;
  if(input && input.id === 'hablemosInput' && event.key === 'Enter'){
    event.preventDefault();
    handleHablemosReply(input.value);
  }
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash || '';
  if(hash.startsWith('#page-')){
    setActivePage(hash.replace('#page-',''));
  }
});

const initTeamCarousel = () => {
  const slider = document.querySelector('.eq-slider');
  if(!slider) return;
  const track = slider.querySelector('.eq-track');
  const prev = slider.querySelector('.eq-prev');
  const next = slider.querySelector('.eq-next');
  const dots = Array.from(slider.querySelectorAll('.eq-dot'));
  let currentIndex = 0;

  const updateSlide = index => {
    if(!track || !dots.length) return;
    const pages = dots.length;
    if(index < 0) index = pages - 1;
    if(index >= pages) index = 0;
    currentIndex = index;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('active', dotIndex === index);
      dot.setAttribute('aria-selected', dotIndex === index ? 'true' : 'false');
    });
  };

  prev?.addEventListener('click', () => updateSlide(currentIndex - 1));
  next?.addEventListener('click', () => updateSlide(currentIndex + 1));
  dots.forEach((dot, dotIndex) => dot.addEventListener('click', () => updateSlide(dotIndex)));
  updateSlide(0);
};

const initExperienceAutoRotation = () => {
  const hero = document.querySelector('.exp-hero-video');
  const videoCards = Array.from(document.querySelectorAll('.exp-videos-grid .ev[data-video]'));
  if(!hero || videoCards.length === 0) return;
  const heroVideo = hero.querySelector('video');
  const heroLabel = hero.querySelector('.exp-label');
  if(!heroVideo) return;

  const parseList = value => (value || '').split(',').map(item => item.trim()).filter(Boolean);
  const FALLBACK_COLLAGE_IMAGE = 'experiencias/fotos/Anuc.jpeg';
  const applySafeImage = (img, src, fallback = FALLBACK_COLLAGE_IMAGE) => {
    if(!img) return;
    img.onerror = () => {
      if(img.dataset.fallbackApplied === '1') return;
      img.dataset.fallbackApplied = '1';
      img.src = fallback;
    };
    img.dataset.fallbackApplied = '0';
    img.src = src;
  };

  const heroSlide = {
    src: hero.dataset.video || heroVideo.src,
    title: hero.dataset.videoTitle || 'Video institucional de eki',
    poster: hero.dataset.poster || heroVideo.poster || '',
    relatedPhotos: parseList(hero.dataset.relatedPhotos),
    photoCaptions: parseList((hero.dataset.photoCaptions || '').replace(/\|/g, ','))
  };

  const slides = [heroSlide, ...videoCards.map(card => ({
    src: card.dataset.video,
    title: card.dataset.videoTitle || '',
    poster: card.dataset.poster || heroVideo.poster || '',
    relatedPhotos: parseList(card.dataset.relatedPhotos),
    photoCaptions: parseList((card.dataset.photoCaptions || '').replace(/\|/g, ','))
  }))];

  const startCardPreviews = () => {
    videoCards.forEach(card => {
      const previewVideo = card.querySelector('video');
      if(!previewVideo) return;
      previewVideo.muted = true;
      previewVideo.autoplay = true;
      previewVideo.loop = true;
      previewVideo.playbackRate = 0.75;
      previewVideo.play().catch(() => {});
    });
  };

  const updateCollage = slide => {
    const collageItems = Array.from(document.querySelectorAll('.exp-photo[data-image]'));
    collageItems.forEach((item, idx) => {
      const filename = slide.relatedPhotos[idx];
      const captionText = slide.photoCaptions[idx];
      if(!filename) return;
      const img = item.querySelector('img');
      const caption = item.querySelector('.expn');
      const normalizedFilename = filename.replace(/^\/+/, '');
      const fileName = normalizedFilename.split('/').pop();
      if(!fileName) return;
      const src = encodeURI(`experiencias/fotos/${fileName}`);
      item.dataset.image = src;
      if(img){
        applySafeImage(img, src);
        img.alt = captionText || fileName;
      }
      if(caption){
        caption.textContent = captionText || fileName.replace(/[-_]/g,' ').replace(/\.(jpg|jpeg|png)$/i,'');
      }
    });
  };

  const getCollagePool = () => {
    const pool = new Set();
    document.querySelectorAll('.exp-photo[data-image]').forEach(item => {
      const path = (item.dataset.image || '').replace(/^\/+/, '');
      if(path) pool.add(path);
    });
    document.querySelectorAll('.ev[data-related-photos]').forEach(card => {
      parseList(card.dataset.relatedPhotos).forEach(photo => {
        const normalized = photo.replace(/^\/+/, '');
        if(!normalized) return;
        const fileName = normalized.split('/').pop();
        if(fileName) pool.add(`experiencias/fotos/${fileName}`);
      });
    });
    return Array.from(pool);
  };

  const shuffleArray = array => array.slice().sort(() => Math.random() - 0.5);

  const rotateCollagePhotos = () => {
    const collageItems = Array.from(document.querySelectorAll('.exp-photo[data-image]'));
    if(collageItems.length === 0) return;
    const pool = getCollagePool();
    if(pool.length === 0) return;
    const selection = shuffleArray(pool);
    while(selection.length < collageItems.length){
      selection.push(...selection);
    }
    collageItems.forEach((item, idx) => {
      const img = item.querySelector('img');
      const nextSrc = selection[idx];
      if(!img || !nextSrc || nextSrc === item.dataset.image) return;
      img.style.transition = 'opacity .4s ease';
      img.style.opacity = '0';
      setTimeout(() => {
        item.dataset.image = nextSrc;
        applySafeImage(img, nextSrc);
        img.style.opacity = '1';
      }, 320);
    });
  };

  startCardPreviews();
  updateCollage(heroSlide);
  heroVideo.loop = false;
  setInterval(rotateCollagePhotos, 7500);
};

const initNosotrosVideoSound = () => {
  const page = document.getElementById('page-nosotros');
  const video = page?.querySelector('.nv-video');
  if(!video) return;

  video.defaultMuted = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.autoplay = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.setAttribute('autoplay', '');
  video.setAttribute('loop', '');

  const playSafely = () => {
    const playPromise = video.play();
    if(playPromise && typeof playPromise.catch === 'function'){
      playPromise.catch(() => {});
    }
  };

  const syncVideoPlayback = pageId => {
    const isNosotrosActive = pageId ? pageId === 'nosotros' : page.classList.contains('active');
    if(isNosotrosActive){
      playSafely();
      return;
    }
    video.pause();
    video.currentTime = 0;
  };

  if(video.readyState >= 2){
    syncVideoPlayback();
  } else {
    video.addEventListener('loadeddata', () => syncVideoPlayback(), { once: true });
  }

  document.addEventListener('eki:pagechange', event => {
    syncVideoPlayback(event.detail?.id);
  });

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash || '';
    const pageId = hash.startsWith('#page-') ? hash.replace('#page-', '') : '';
    syncVideoPlayback(pageId);
  });
};

document.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash || '';
  if(hash.startsWith('#page-')){
    setActivePage(hash.replace('#page-',''));
  } else {
    setActivePage('home');
  }

  const areaInteraccion = document.getElementById('area-interaccion');
  if(areaInteraccion){
    areaInteraccion.addEventListener('click', event => {
      const target = event.target.closest('button');
      if(!target) return;
      if(target.id === 'btn-iniciar'){
        iniciarDemo();
      }
      if(target.id === 'btn-listo-mod1'){
        continuarModulo2();
      }
      if(target.id === 'btn-listo-mod2'){
        finalizarDemo();
      }
    });
  }

  initTeamCarousel();
  initExperienceAutoRotation();
  initNosotrosVideoSound();
  initAsyncLeadForms();
  initImpactCounters();
  resetChatDemo();
});