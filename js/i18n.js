import enMap from './i18n-en-map.js';

const STORAGE_KEY = 'eki-lang';
const ATTRS = ['placeholder', 'aria-label', 'alt', 'title'];

let currentLang = 'es';
const originalText = new WeakMap();
const originalAttrs = new WeakMap();

export function t(esText) {
  if (!esText) return esText;
  if (currentLang === 'es') return esText;
  return enMap[esText] ?? enMap[esText.replace(/\s+/g, ' ').trim()] ?? esText;
}

export function getLang() {
  return currentLang;
}

function shouldSkipTextParent(el) {
  if (!el) return true;
  const tag = el.tagName;
  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'CODE' || tag === 'SVG') return true;
  if (el.closest('[data-i18n-skip]')) return true;
  if (el.closest('.lang-switch')) return true;
  return false;
}

function translateTextNode(node) {
  if (!originalText.has(node)) originalText.set(node, node.nodeValue);
  const orig = originalText.get(node);
  if (currentLang === 'es') {
    node.nodeValue = orig;
    return;
  }
  const lead = (orig.match(/^\s*/) || [''])[0];
  const trail = (orig.match(/\s*$/) || [''])[0];
  const core = orig.slice(lead.length, orig.length - trail.length);
  if (!core) return;
  const translated = enMap[core] ?? enMap[core.replace(/\s+/g, ' ').trim()];
  if (translated) {
    node.nodeValue = lead + translated + trail;
  } else {
    node.nodeValue = orig;
  }
}

function translateElementAttrs(el) {
  if (shouldSkipTextParent(el)) return;
  let bag = originalAttrs.get(el);
  if (!bag) {
    bag = {};
    ATTRS.forEach((attr) => {
      if (el.hasAttribute(attr)) bag[attr] = el.getAttribute(attr);
    });
    originalAttrs.set(el, bag);
  }
  ATTRS.forEach((attr) => {
    if (!(attr in bag)) return;
    const orig = bag[attr];
    el.setAttribute(attr, currentLang === 'es' ? orig : (enMap[orig] ?? enMap[orig.replace(/\s+/g, ' ').trim()] ?? orig));
  });
}

function applyDomTranslations() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (shouldSkipTextParent(node.parentElement)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(translateTextNode);

  document.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(',')).forEach(translateElementAttrs);
}

function syncLangControls() {
  document.querySelectorAll('[data-set-lang]').forEach((btn) => {
    const active = btn.getAttribute('data-set-lang') === currentLang;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.classList.toggle('is-active', active);
  });
}

function syncDocumentLangMeta() {
  document.documentElement.lang = currentLang;
  document.documentElement.setAttribute('data-lang', currentLang);

  const ogLocale = document.querySelector('meta[property="og:locale"]');
  if (ogLocale) ogLocale.setAttribute('content', currentLang === 'en' ? 'en_US' : 'es_CO');

  const ogAlt = document.querySelector('meta[property="og:locale:alternate"]');
  if (ogAlt) ogAlt.setAttribute('content', currentLang === 'en' ? 'es_CO' : 'en_US');

  try {
    const url = new URL(window.location.href);
    if (currentLang === 'en') url.searchParams.set('lang', 'en');
    else url.searchParams.delete('lang');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  } catch (_) { /* ignore */ }
}

export function setLang(lang, { persist = true } = {}) {
  currentLang = lang === 'en' ? 'en' : 'es';
  if (persist) {
    try { localStorage.setItem(STORAGE_KEY, currentLang); } catch (_) { /* ignore */ }
  }
  syncDocumentLangMeta();
  applyDomTranslations();
  syncLangControls();
  document.dispatchEvent(new CustomEvent('eki:langchange', { detail: { lang: currentLang } }));
}

function resolveInitialLang() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl === 'en' || fromUrl === 'es') return fromUrl;
  } catch (_) { /* ignore */ }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch (_) { /* ignore */ }
  return 'es';
}

export function initI18n() {
  window.ekiI18n = { t, getLang, setLang, applyDomTranslations };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-set-lang]');
    if (!btn) return;
    e.preventDefault();
    setLang(btn.getAttribute('data-set-lang'));
  });

  const initial = resolveInitialLang();
  if (initial === 'en') {
    setLang('en');
  } else {
    currentLang = 'es';
    syncDocumentLangMeta();
    syncLangControls();
  }
}
