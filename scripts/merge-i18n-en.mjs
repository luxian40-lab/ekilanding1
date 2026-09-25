import fs from 'fs';
import path from 'path';
import { DATA } from './i18n-en-translate-data.mjs';

const root = path.resolve(import.meta.dirname, '..');
const strings = JSON.parse(fs.readFileSync(path.join(root, 'scripts/i18n-strings.json'), 'utf8'));
let extra = {};
try {
  extra = JSON.parse(fs.readFileSync(path.join(root, 'scripts/i18n-en-translations.json'), 'utf8'));
} catch {
  /* optional */
}

const jsSource = fs.readFileSync(path.join(root, 'eki_v9_final.js'), 'utf8');
const extractBlock = (name) => {
  const re = new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n\\};`, 'm');
  const m = jsSource.match(re);
  if (!m) throw new Error(`Missing ${name}`);
  const obj = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^\s*(?:'([^']+)'|(\w+)):\s*'((?:\\'|[^'])*)'/);
    if (kv) {
      const key = kv[1] || kv[2];
      obj[key] = kv[3].replace(/\\'/g, "'");
    }
  }
  return obj;
};

const titles = extractBlock('PAGE_TITLES');
const descriptions = extractBlock('PAGE_DESCRIPTIONS');

const skip = new Set(['eki', 'eki.', 'X']);
const pureNum = /^[\d\s+\-–—.,:%]+$/;

const SELF = new Set([
  'AR', 'JC', 'JR', 'LS', 'RC', 'SO', 'Dashboard', 'Demo', 'FAO', 'LXP', 'AgStar', 'WhatsApp',
  'Instagram', 'LinkedIn', 'Online', 'Virtual', 'Presencial', 'Híbrido', 'Startup Showcase',
  'Venture Valley', 'Agroindustria', 'Agronexo', 'ANUC', 'MEEJR', 'ANMUCIC', 'Bancolombia',
  'Cenipalma', 'Nitrofert', 'TechnoServe', 'Profamilia', 'Mineducación', 'FedePanela', 'InnovaLab',
  'Nogales Plus', 'alitic', 'gofest.com.co', 'agstar.pro/es/convocatoria-agstar',
  'comunidad.educativa@eki.com.co', 'correo@organizacion.com', 'Julian Ramirez', 'Julian Cubides',
  'Steven Oviedo', 'Andrés Rubiano', 'Juan José Torres', 'Luisa Salazar', 'Rosemery Carrillo',
  'Néstor Buelvas', 'Eidy Clavijo', 'Emprelatam', 'RadioEducación 4.0', 'Rural Mente',
  'WINS Women in Supply Chain Colombia', 'Universidad de La Sabana', 'Universidad del Rosario',
  'Santa Clara Miller Center for Social Entrepreneurship', 'TecPrize', 'Go Fest 2026',
  'Go Fest 2026 · CCB', 'Ágora Bogotá', 'Lego SP', '24/7', '16 horas', '32 horas', 'Ene 23',
  'Sep 23', 'Próx.', 'IA', 'Legal', 'Noticia', 'Vitrina', 'ekipo', 'Hablemos', 'Habeas Data',
  'Módulo 0', 'Módulo 1', 'Módulo 2', 'Módulo 3', 'Módulo 4', 'Página 1', 'Página 2', 'Página 3',
  '302 648 0629', 'ANUC + MEEJR', 'Coaching, Productividad y Liderazgo para el Campo',
]);

const map = { ...extra, ...DATA };

const required = new Set(strings);
for (const v of Object.values(titles)) required.add(v);
for (const v of Object.values(descriptions)) required.add(v);

const missing = [];
for (const s of required) {
  if (skip.has(s) || pureNum.test(s)) continue;
  if (map[s] === undefined) {
    if (SELF.has(s)) map[s] = s;
    else missing.push(s);
  }
}

if (missing.length) {
  console.error('Missing translations:', missing.length);
  for (const m of missing) console.error(JSON.stringify(m));
  process.exit(1);
}

const sortedKeys = Object.keys(map).sort((a, b) => a.localeCompare(b, 'es'));
const sorted = {};
for (const k of sortedKeys) sorted[k] = map[k];

const outPath = path.join(root, 'js/i18n-en-map.js');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `export default ${JSON.stringify(sorted, null, 2)};\n`, 'utf8');
console.log('Wrote', outPath, 'keys:', Object.keys(sorted).length);
