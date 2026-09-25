/**
 * Builds js/i18n-en-map.js from scripts/i18n-strings.json, PAGE_TITLES/DESCRIPTIONS,
 * and scripts/i18n-en-translations.json (Spanish → English).
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const strings = JSON.parse(fs.readFileSync(path.join(root, 'scripts/i18n-strings.json'), 'utf8'));
const extra = JSON.parse(fs.readFileSync(path.join(root, 'scripts/i18n-en-translations.json'), 'utf8'));

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

const map = { ...extra };

for (const s of strings) {
  if (skip.has(s) || pureNum.test(s)) continue;
  if (map[s] === undefined) {
    console.warn('MISSING:', JSON.stringify(s).slice(0, 120));
  }
}

for (const v of Object.values(titles)) {
  if (!skip.has(v) && !pureNum.test(v) && map[v] === undefined) {
    console.warn('MISSING TITLE:', JSON.stringify(v).slice(0, 120));
  }
}
for (const v of Object.values(descriptions)) {
  if (!skip.has(v) && !pureNum.test(v) && map[v] === undefined) {
    console.warn('MISSING DESC:', JSON.stringify(v).slice(0, 120));
  }
}

for (const v of Object.values(titles)) {
  if (skip.has(v) || pureNum.test(v)) continue;
  if (map[v] !== undefined) map[v] = map[v];
}
for (const v of Object.values(descriptions)) {
  if (skip.has(v) || pureNum.test(v)) continue;
}

const sortedKeys = Object.keys(map).sort((a, b) => a.localeCompare(b, 'es'));
const sorted = {};
for (const k of sortedKeys) sorted[k] = map[k];

const outPath = path.join(root, 'js/i18n-en-map.js');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
const body = JSON.stringify(sorted, null, 2);
fs.writeFileSync(outPath, `export default ${body};\n`, 'utf8');
console.log('Wrote', outPath, 'keys:', Object.keys(sorted).length);
