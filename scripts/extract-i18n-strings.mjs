import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const texts = new Set();
const cleaned = html
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '');

const re = />[^<]+</g;
let m;
while ((m = re.exec(cleaned))) {
  let t = m[0].slice(1, -1).replace(/\s+/g, ' ').trim();
  if (!t || t.length < 2) continue;
  if (/^[\d\s+\-–—.,:%]+$/.test(t)) continue;
  if (t === 'X' || t === 'eki.' || t === 'eki') continue;
  texts.add(t);
}

for (const match of html.matchAll(/(?:placeholder|aria-label|alt)=\"([^\"]+)\"/g)) {
  const t = match[1].replace(/\s+/g, ' ').trim();
  if (t.length > 2) texts.add(t);
}

const arr = [...texts].sort((a, b) => a.localeCompare(b, 'es'));
fs.mkdirSync('scripts', { recursive: true });
fs.writeFileSync('scripts/i18n-strings.json', JSON.stringify(arr, null, 2));
console.log('count', arr.length);
