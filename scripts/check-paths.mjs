import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const filesToScan = [
  'index.html',
  'eki_v9_final.html',
  'eki_v9_final.css',
  'eki_v9_final.js',
  'css/main.css',
  'js/main.js',
  'js/modules/legacy-app.js'
]
  .map(file => path.join(rootDir, file))
  .filter(file => fs.existsSync(file));

const refRegex = /(?:src|href|poster|data-video|data-image)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^"')]+)["']?\s*\)|import\s+["']([^"']+)["']/gi;
const issues = [];

const isExternalRef = ref => {
  return (
    ref.startsWith('#') ||
    ref.startsWith('mailto:') ||
    ref.startsWith('tel:') ||
    ref.startsWith('data:') ||
    /^(https?:)?\/\//i.test(ref)
  );
};

const lineNumberAt = (text, index) => text.slice(0, index).split(/\r?\n/).length;

for (const filePath of filesToScan) {
  const content = fs.readFileSync(filePath, 'utf8');
  let match;

  while ((match = refRegex.exec(content)) !== null) {
    const rawRef = (match[1] || match[2] || match[3] || '').trim();
    if (!rawRef) continue;

    const cleanRef = rawRef.split('?')[0].trim();
    if (!cleanRef || isExternalRef(cleanRef)) continue;

    const line = lineNumberAt(content, match.index);
    const normalizedRef = cleanRef.replace(/\\/g, '/');

    if (/[ ,]/.test(normalizedRef)) {
      issues.push(`${path.relative(rootDir, filePath)}:${line} -> Ruta no recomendada: ${normalizedRef}`);
    }

    const resolved = path.resolve(path.dirname(filePath), normalizedRef);
    if (!fs.existsSync(resolved)) {
      issues.push(`${path.relative(rootDir, filePath)}:${line} -> Archivo no encontrado: ${normalizedRef}`);
    }
  }
}

if (issues.length > 0) {
  console.error('Path validation failed:');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Path validation passed.');
