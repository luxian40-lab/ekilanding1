const selectAll = selector => Array.from(document.querySelectorAll(selector));

const PAGE_PATHS = {
  home: '/',
  nosotros: '/nosotros',
  soluciones: '/soluciones',
  experiencias: '/experiencias',
  contacto: '/contacto',
  demo: '/demo',
  'habeas-data': '/habeas-data',
  programas: '/programas',
  'programa-emprendimiento-agro-rural': '/programas/emprendimiento-agro-rural',
  'programa-maquinaria-herramientas-agro': '/programas/maquinaria-herramientas-agro',
  'programa-comercializacion-ventas': '/programas/comercializacion-ventas',
  'programa-agricultura-digital-ia': '/programas/agricultura-digital-ia',
  'programa-tome-las-riendas': '/programas/tome-las-riendas',
  noticias: '/noticias',
  'noticia-fao-agtech': '/noticias/fao-agtech-summit-2026',
  'noticia-gofest-2026': '/noticias/gofest-2026-startup-showcase'
};

const PATH_TO_PAGE = Object.fromEntries(
  Object.entries(PAGE_PATHS).map(([id, pagePath]) => [pagePath, id])
);

const DEFAULT_TITLE = 'eki | Educación rural con IA y WhatsApp en Colombia';
const DEFAULT_DESCRIPTION = 'eki transforma comunidades rurales en Colombia con educación digital, inteligencia artificial, formación por WhatsApp y plataforma LXP para el campo.';
const PAGE_TITLES = {
  home: DEFAULT_TITLE,
  nosotros: 'Nosotros — eki | Educación rural con equidad',
  soluciones: 'Soluciones — WhatsApp, IA y LXP para el campo | eki',
  experiencias: 'Experiencias y casos de éxito en territorio | eki',
  contacto: 'Contacto — Hablemos de su proyecto rural | eki',
  demo: 'Solicitar demo de eki | Formación rural con IA',
  'habeas-data': 'Política de Habeas Data — eki',
  programas: 'Programas de formación rural por WhatsApp | eki',
  'programa-emprendimiento-agro-rural': 'Emprendimiento agro rural | Programa eki',
  'programa-maquinaria-herramientas-agro': 'Maquinaria y herramientas para el agro | Programa eki',
  'programa-comercializacion-ventas': 'Comercialización y ventas rurales | Programa eki',
  'programa-agricultura-digital-ia': 'Agricultura digital e IA para el campo | Programa eki',
  'programa-tome-las-riendas': 'Tome las riendas de su dinero | Demo eki',
  noticias: 'Noticias — eki en el territorio',
  'noticia-fao-agtech': 'eki invitada al AGTECH Summit FAO 2026 | Noticia',
  'noticia-gofest-2026': 'eki en G FEST ’26 Startup Showcase | Noticia'
};
const PAGE_DESCRIPTIONS = {
  home: DEFAULT_DESCRIPTION,
  nosotros: 'eki nació para cerrar la brecha educativa en la ruralidad colombiana con formación práctica, liderazgo e innovación al servicio de las personas.',
  soluciones: 'Formación rural por WhatsApp con tutores de IA, programas a medida, contenido contextual y plataforma LXP con métricas de impacto.',
  experiencias: 'Casos reales de eki con caficultores, palma, avicultura, docentes rurales y el reconocimiento de la FAO en agricultura digital.',
  contacto: 'Empresas, fundaciones y entidades públicas: diseñamos la solución educativa que su comunidad rural necesita.',
  demo: 'Vea cómo funcionan las microcápsulas por WhatsApp, los agentes de IA y la plataforma LXP de eki.',
  'habeas-data': 'Política de tratamiento de datos personales de eki, conforme a la Ley 1581 de 2012.',
  programas: 'Catálogo de programas eki: emprendimiento rural, maquinaria, ventas, agricultura digital y la demo Tome las riendas de su dinero.',
  'programa-emprendimiento-agro-rural': 'Pase de tener producto en la finca a un negocio rural más ordenado: oferta, costos básicos y un plan de 30 días, por WhatsApp.',
  'programa-maquinaria-herramientas-agro': 'Use equipos y herramientas del agro con criterio: seguridad, mantenimiento y cuándo no vale la pena comprar.',
  'programa-comercializacion-ventas': 'Lleve su producto al mercado con más claridad: a quién vender, a qué precio, cómo cobrar y cómo cuidar el margen.',
  'programa-agricultura-digital-ia': 'Acerque datos, apps e IA al productor en lenguaje de finca: qué sí sirve en el celular y qué es humo.',
  'programa-tome-las-riendas': 'Demo real de eki: ordene ingresos y gastos, decisiones simples de la semana y hábitos de plata por WhatsApp.',
  noticias: 'Noticias eki: reconocimientos, alianzas y lo que pasa cuando la formación llega al territorio.',
  'noticia-fao-agtech': 'eki fue invitada y seleccionada en el AGTECH Summit FAO 2026 por su solución de agentes de IA y microaprendizaje por WhatsApp.',
  'noticia-gofest-2026': 'eki fue seleccionada para el Startup Showcase de G FEST ’26 en Venture Valley, piso 4, Ágora Bogotá.'
};

const SITE_ORIGIN = 'https://eki.com.co';

const resolvePageFromLocation = () => {
  const hash = window.location.hash || '';
  if(hash.startsWith('#page-')) return hash.replace('#page-', '');
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  return PATH_TO_PAGE[path] || null;
};

const updatePageUrl = id => {
  const pagePath = PAGE_PATHS[id] || '/';
  const next = `${pagePath}${window.location.search || ''}`;
  try {
    if(window.history && window.history.replaceState){
      window.history.replaceState(null, '', next);
    } else if(id === 'home'){
      window.location.hash = '';
    } else {
      window.location.hash = `#page-${id}`;
    }
  } catch (error) {
    window.location.hash = id === 'home' ? '' : `#page-${id}`;
  }
};

const setPageMeta = id => {
  document.title = PAGE_TITLES[id] || DEFAULT_TITLE;
  const description = PAGE_DESCRIPTIONS[id] || DEFAULT_DESCRIPTION;
  const descTag = document.querySelector('meta[name="description"]');
  if(descTag) descTag.setAttribute('content', description);
  const path = PAGE_PATHS[id] || '/';
  const url = `${SITE_ORIGIN}${path}`;
  const canonical = document.querySelector('link[rel="canonical"]');
  if(canonical) canonical.setAttribute('href', url);
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if(ogUrl) ogUrl.setAttribute('content', url);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if(ogTitle) ogTitle.setAttribute('content', PAGE_TITLES[id] || DEFAULT_TITLE);
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if(ogDesc) ogDesc.setAttribute('content', description);
};

const setActivePage = id => {
  selectAll('.page').forEach(page => page.classList.toggle('active', page.id === `page-${id}`));
  window.scrollTo(0, 0);
  selectAll('nav a').forEach(link => link.classList.toggle('on', link.id === `n-${id}`));
  updatePageUrl(id);
  setPageMeta(id);
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
    key: 'telefono',
    type: 'text',
    text: '¿Y cuál es tu número de celular o WhatsApp?',
    placeholder: 'Ej. 310 384 4274'
  },
  {
    key: 'necesidad',
    type: 'text',
    text: 'Cuéntame cuál es tu necesidad o el problema que tienes. Así podemos orientarte hacia la mejor solución posible.',
    placeholder: 'Describe tu necesidad, reto o situación actual'
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

const validateHablemosValue = (step, value) => {
  if(step.key === 'correo' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Por favor escribe un correo válido, por ejemplo correo@organizacion.com.';
  }
  if(step.key === 'telefono') {
    const digits = value.replace(/\D/g, '');
    if(digits.length < 7) {
      return 'Por favor escribe un número válido con al menos 7 dígitos.';
    }
  }
  return '';
};

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
  pintarMensajeHablemos('Gracias. Ya tengo lo necesario. En breve un asesor de eki se contactará contigo para ayudarte a encontrar la mejor solución.', 'incoming', 'eki');
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
  setHablemosField('telefono', '');
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

  const validationError = step.type === 'text' ? validateHablemosValue(step, value) : '';
  if(validationError){
    pintarMensajeHablemos(validationError, 'incoming', 'eki');
    scrollHablemosToBottom();
    return;
  }

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
  const teamImgs = ['andres.jpeg','rosmery.jpeg','julian.jpeg','luisa.jpeg','juliand.jpeg','juliana.jpeg','andres.jpg','rosmery.jpg','julian.jpg','luisa.jpg','disenador.jpg','juliana.jpg'];
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

document.addEventListener('click', e => {
  const link = e.target.closest('a[href]');
  if(!link || link.target === '_blank' || link.hasAttribute('data-modal')) return;
  const href = link.getAttribute('href') || '';
  if(!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#') || href.startsWith('javascript:')) return;
  let url;
  try {
    url = new URL(href, window.location.origin);
  } catch (error) {
    return;
  }
  if(url.origin !== window.location.origin) return;
  const path = url.pathname.replace(/\/$/, '') || '/';
  const pageId = PATH_TO_PAGE[path];
  if(!pageId) return;
  e.preventDefault();
  setActivePage(pageId);
});

['home','nosotros','soluciones','experiencias','demo','contacto','programas'].forEach(id => {
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
    const rendered = (state.el.textContent || '').trim();
    const isPlaceholder = rendered === '+0' || rendered === '0' || rendered === '';
    if(!isPlaceholder){
      state.value = state.target;
      state.finished = true;
      observer.observe(state.el);
      return;
    }
    updateDisplay(state);
    observer.observe(state.el);
  });
};

window.sP = setActivePage;
window.setActivePage = setActivePage;
window.oM = openModal;
window.oR = updateModalImage;
window.cM = closeModal;

const initMobileNav = () => {
  const body = document.body;
  const toggle = document.getElementById('mobileNavToggle');
  const closeBtn = document.getElementById('mobileNavClose');
  const backdrop = document.getElementById('mobileNavBackdrop');
  const panel = document.getElementById('mobileNavPanel');
  if(!toggle || !backdrop || !panel) return;

  const openNav = () => {
    backdrop.hidden = false;
    body.classList.add('mobile-nav-open');
    toggle.setAttribute('aria-expanded', 'true');
  };

  const closeNav = () => {
    body.classList.remove('mobile-nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    backdrop.hidden = true;
  };

  toggle.addEventListener('click', () => {
    if(body.classList.contains('mobile-nav-open')){
      closeNav();
      return;
    }
    openNav();
  });

  closeBtn?.addEventListener('click', closeNav);
  backdrop.addEventListener('click', event => {
    if(event.target === backdrop) closeNav();
  });

  window.addEventListener('keydown', event => {
    if(event.key === 'Escape' && body.classList.contains('mobile-nav-open')){
      closeNav();
    }
  });

  window.addEventListener('eki:pagechange', closeNav);
};

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
    document.body.classList.remove('mobile-nav-open');
    const backdrop = document.getElementById('mobileNavBackdrop');
    const toggle = document.getElementById('mobileNavToggle');
    if(backdrop) backdrop.hidden = true;
    if(toggle) toggle.setAttribute('aria-expanded', 'false');
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
  const pageId = resolvePageFromLocation();
  if(pageId) setActivePage(pageId);
  else setActivePage('home');
});

window.addEventListener('popstate', () => {
  const pageId = resolvePageFromLocation();
  if(pageId) setActivePage(pageId);
  else setActivePage('home');
});

const initTeamCarousel = () => {
  const slider = document.querySelector('.eq-slider');
  if(!slider) return;
  const track = slider.querySelector('.eq-track');
  const prev = slider.querySelector('.eq-prev');
  const next = slider.querySelector('.eq-next');
  const dots = Array.from(slider.querySelectorAll('.eq-dot'));
  const isMobileScrollMode = window.matchMedia('(max-width: 700px)').matches;

  if(isMobileScrollMode){
    slider.classList.add('eq-mobile-scroll');
    if(track){
      track.style.transform = 'none';
    }
    prev?.setAttribute('hidden', '');
    next?.setAttribute('hidden', '');
    dots.forEach(dot => dot.setAttribute('hidden', ''));
    return;
  }

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
  if(videoCards.length === 0) return;
  const heroVideo = hero?.querySelector('video');

  const parseList = value => (value || '').split(',').map(item => item.trim()).filter(Boolean);
  const FALLBACK_COLLAGE_IMAGE = 'experiencias/fotos/Anuc.jpeg';
  const PLACEHOLDER_COLLAGE_IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e8daef"/><stop offset="100%" stop-color="#d7e7f9"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>')}`;
  const COLLAGE_FILENAME_POOL = [
    'adriana.jpeg',
    'Anuc.jpeg',
    'empreexperiencia2.jpeg',
    'experiencia1.jpg',
    'foto 14 panela .jpeg',
    'foto 16 panela .jpeg',
    'foto 22 panela .jpeg',
    'WhatsApp Image 2026-04-17 at 3.22.47 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.22.49 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.22.56 PM (2).jpeg',
    'WhatsApp Image 2026-04-17 at 3.22.56 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.22.57 PM (1).jpeg',
    'WhatsApp Image 2026-04-17 at 3.22.57 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.22.58 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.00 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.01 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.03 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.04 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.05 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.06 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.07 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.14 PM (1).jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.14 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.16 PM (1).jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.16 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.17 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.18 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.19 PM (1).jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.19 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.20 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.21 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.23 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.24 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.25 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.28 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.35 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.36 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.37 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.39 PM (1).jpeg',
    'WhatsApp Image 2026-04-17 at 3.23.39 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 7.32.33 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 7.32.34 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 7.32.345PM.jpeg',
    'WhatsApp Image 2026-04-17 at 7.32.51 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 7.32.52 PM.jpeg',
    'WhatsApp Image 2026-04-17 at 7.32.523 PM.jpeg'
  ];
  const DEFAULT_COLLAGE_POOL = COLLAGE_FILENAME_POOL.map(name => `experiencias/fotos/${name}`);
  const applySafeImage = (img, src, fallback = FALLBACK_COLLAGE_IMAGE) => {
    if(!img) return;
    img.onerror = () => {
      if(img.dataset.fallbackApplied === '1'){
        img.onerror = null;
        img.src = PLACEHOLDER_COLLAGE_IMAGE;
        return;
      }
      img.dataset.fallbackApplied = '1';
      img.src = fallback;
    };
    img.dataset.fallbackApplied = '0';
    img.src = src;
  };
  const photoPathToSrc = rawPath => {
    const normalized = (rawPath || '').replace(/^\/+/, '');
    const fileName = normalized.split('/').pop();
    if(!fileName) return '';
    return encodeURI(`experiencias/fotos/${fileName}`);
  };

  const normalizeCollagePath = value => {
    if(!value) return '';
    let path = String(value).replace(/^\/+/, '');
    try {
      path = decodeURI(path);
    } catch (error) {
      /* ignore */
    }
    return path;
  };

  const ensureCollagePath = raw => {
    const t = (raw || '').trim();
    if(!t) return '';
    if(t.includes('/')) return t.replace(/^\/+/, '');
    return `experiencias/fotos/${t}`;
  };

  const dedupeCollagePaths = paths => {
    const seen = new Set();
    const out = [];
    for(const raw of paths){
      const full = ensureCollagePath(raw);
      const key = normalizeCollagePath(full).toLowerCase();
      if(!key || seen.has(key)) continue;
      seen.add(key);
      out.push(full);
    }
    return out;
  };

  const pickUniqueCollagePaths = (preferred, fillerPool, count) => {
    const out = [];
    const used = new Set();
    const push = path => {
      if(out.length >= count) return;
      const full = ensureCollagePath(path);
      const key = normalizeCollagePath(full).toLowerCase();
      if(!key || used.has(key)) return;
      used.add(key);
      out.push(full);
    };
    for(const path of preferred) push(path);
    if(out.length < count){
      for(const path of shuffleArray(fillerPool.slice())) push(path);
    }
    if(out.length < count){
      for(const path of fillerPool) push(path);
    }
    while(out.length < count){
      const before = out.length;
      for(const path of fillerPool) push(path);
      if(out.length === before) break;
    }
    return out.slice(0, count);
  };

  const buildSlideFromCard = card => ({
    src: card.dataset.video,
    title: card.dataset.videoTitle || '',
    poster: card.dataset.poster || heroVideo?.poster || '',
    relatedPhotos: parseList(card.dataset.relatedPhotos),
    photoCaptions: parseList((card.dataset.photoCaptions || '').replace(/\|/g, ','))
  });

  const heroSlide = hero && heroVideo
    ? {
      src: hero.dataset.video || heroVideo.src,
      title: hero.dataset.videoTitle || 'Video institucional de eki',
      poster: hero.dataset.poster || heroVideo.poster || '',
      relatedPhotos: parseList(hero.dataset.relatedPhotos),
      photoCaptions: parseList((hero.dataset.photoCaptions || '').replace(/\|/g, ','))
    }
    : buildSlideFromCard(videoCards[0]);

  const ensurePreviewSource = previewVideo => {
    if(!previewVideo) return;
    const dataSrc = previewVideo.dataset.src;
    if(dataSrc && !previewVideo.getAttribute('src')){
      previewVideo.src = dataSrc;
      previewVideo.load();
    }
  };

  const startCardPreviews = () => {
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const onExperiencias = document.getElementById('page-experiencias')?.classList.contains('active');

    videoCards.forEach(card => {
      const previewVideo = card.querySelector('video');
      if(!previewVideo) return;
      previewVideo.muted = true;
      previewVideo.preload = 'none';
      previewVideo.loop = true;
      previewVideo.playbackRate = 0.75;
      previewVideo.autoplay = false;
      previewVideo.removeAttribute('autoplay');

      // No descargar videos pesados hasta estar en Experiencias y visibles.
      if(!onExperiencias || isMobile || isReducedMotion){
        previewVideo.pause();
        return;
      }

      if('IntersectionObserver' in window){
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if(entry.isIntersecting){
              ensurePreviewSource(previewVideo);
              previewVideo.play().catch(() => {});
            } else {
              previewVideo.pause();
            }
          });
        }, { rootMargin: '120px 0px', threshold: 0.2 });
        observer.observe(card);
      } else {
        ensurePreviewSource(previewVideo);
        previewVideo.play().catch(() => {});
      }
    });
  };

  const updateCollage = slide => {
    const collageItems = Array.from(document.querySelectorAll('.exp-photo[data-image]'));
    const photos = (slide.relatedPhotos || []).filter(Boolean);
    const captions = slide.photoCaptions || [];
    const preferred = photos.length ? photos : [FALLBACK_COLLAGE_IMAGE];
    const assigned = pickUniqueCollagePaths(preferred, DEFAULT_COLLAGE_POOL, collageItems.length);
    collageItems.forEach((item, idx) => {
      const rawPath = assigned[idx] || FALLBACK_COLLAGE_IMAGE;
      const captionText = captions[idx] || '';
      const img = item.querySelector('img');
      const caption = item.querySelector('.expn');
      const src = photoPathToSrc(rawPath) || photoPathToSrc(FALLBACK_COLLAGE_IMAGE);
      if(!src) return;
      item.dataset.image = src;
      if(img){
        applySafeImage(img, src);
        const label = item.dataset.title || rawPath.split('/').pop() || 'Foto experiencia';
        img.alt = captionText || label;
      }
      if(caption){
        const label = (rawPath.split('/').pop() || '').replace(/[-_]/g,' ').replace(/\.(jpg|jpeg|png)$/i,'');
        caption.textContent = captionText || label || 'Experiencia en territorio';
      }
    });
  };

  const getCollagePool = () => {
    const merged = [...DEFAULT_COLLAGE_POOL];
    document.querySelectorAll('.exp-photo[data-image]').forEach(item => {
      let path = (item.dataset.image || '').replace(/^\/+/, '');
      try {
        path = decodeURI(path);
      } catch (error) {
        /* ignore decode issues */
      }
      if(path) merged.push(path);
    });
    document.querySelectorAll('.ev[data-related-photos]').forEach(card => {
      parseList(card.dataset.relatedPhotos).forEach(photo => {
        const normalized = photo.replace(/^\/+/, '');
        if(!normalized) return;
        const fileName = normalized.split('/').pop();
        if(fileName) merged.push(`experiencias/fotos/${fileName}`);
      });
    });
    return dedupeCollagePaths(merged);
  };

  const shuffleArray = array => array.slice().sort(() => Math.random() - 0.5);

  const rotateCollagePhotos = () => {
    const collageItems = Array.from(document.querySelectorAll('.exp-photo[data-image]'));
    if(collageItems.length === 0) return;
    const pool = getCollagePool();
    if(pool.length === 0) return;
    const selection = pickUniqueCollagePaths(shuffleArray(pool), DEFAULT_COLLAGE_POOL, collageItems.length);
    collageItems.forEach((item, idx) => {
      const img = item.querySelector('img');
      const nextSrc = selection[idx];
      if(!img || !nextSrc){
        if(img) img.style.opacity = '1';
        return;
      }
      const current = normalizeCollagePath(item.dataset.image);
      const candidate = normalizeCollagePath(nextSrc);
      if(candidate && current && candidate === current){
        img.style.opacity = '1';
        return;
      }
      img.style.transition = 'opacity .4s ease';
      img.style.opacity = '0';
      setTimeout(() => {
        try {
          const raw = normalizeCollagePath(nextSrc);
          const encoded = encodeURI(raw);
          item.dataset.image = encoded;
          applySafeImage(img, encoded);
        } finally {
          img.style.opacity = '1';
        }
      }, 320);
    });
  };

  startCardPreviews();
  document.addEventListener('eki:pagechange', event => {
    if(event.detail?.id === 'experiencias'){
      startCardPreviews();
    } else {
      videoCards.forEach(card => {
        const previewVideo = card.querySelector('video');
        if(previewVideo) previewVideo.pause();
      });
    }
  });
  updateCollage(heroSlide);
  if(heroVideo){
    heroVideo.loop = false;
  }
  // Rotación más lenta para no saturar red con fotos.
  setInterval(() => {
    if(document.hidden) return;
    if(!document.getElementById('page-experiencias')?.classList.contains('active')) return;
    rotateCollagePhotos();
  }, 12000);
};

const optimizeInitialMediaLoading = () => {
  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const images = Array.from(document.querySelectorAll('img'));
  images.forEach((img, index) => {
    // Lazy agresivo: solo el logo/hero temprano carga eager.
    if(!img.hasAttribute('loading')){
      img.loading = index > 1 ? 'lazy' : 'eager';
    }
    if(!img.hasAttribute('decoding')){
      img.decoding = 'async';
    }
  });

  document.querySelectorAll('video').forEach(video => {
    const inExperiencesGrid = video.closest('.exp-videos-grid .ev');
    const inNosotros = video.classList.contains('nv-video');
    const inModal = video.closest('.mo');

    if(inModal){
      video.preload = 'metadata';
      return;
    }

    if(inExperiencesGrid){
      video.preload = 'none';
      video.removeAttribute('autoplay');
      video.autoplay = false;
      return;
    }

    if(inNosotros){
      video.preload = 'metadata';
    }

    if((isMobile || isReducedMotion) && video.hasAttribute('autoplay')){
      video.removeAttribute('autoplay');
      video.autoplay = false;
      video.pause();
    }
  });
};

const initNosotrosVideoSound = () => {
  const page = document.getElementById('page-nosotros');
  const video = page?.querySelector('.nv-video');
  if(!video) return;

  video.defaultMuted = true;
  video.muted = true;
  video.loop = false;
  video.playsInline = true;
  video.preload = 'metadata';
  video.autoplay = false;
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.removeAttribute('autoplay');
  video.removeAttribute('loop');

  const playSafely = () => {
    const playPromise = video.play();
    if(playPromise && typeof playPromise.catch === 'function'){
      playPromise.catch(() => {});
    }
  };

  const syncVideoPlayback = pageId => {
    const isNosotrosActive = pageId ? pageId === 'nosotros' : page.classList.contains('active');
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    if(!isNosotrosActive){
      video.pause();
      video.currentTime = 0;
      return;
    }
    // En móvil no forzamos autoplay, pero sí permitimos reproducción manual.
    if(!isMobile){
      playSafely();
    }
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
  const pageId = resolvePageFromLocation();
  if(pageId) setActivePage(pageId);
  else setActivePage('home');

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

  optimizeInitialMediaLoading();
  initTeamCarousel();
  initExperienceAutoRotation();
  initNosotrosVideoSound();
  initMobileNav();
  initAsyncLeadForms();
  initImpactCounters();
  resetChatDemo();
});