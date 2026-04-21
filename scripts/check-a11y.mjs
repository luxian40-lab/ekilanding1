import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const htmlFile = fs.existsSync(path.join(rootDir, 'index.html'))
  ? path.join(rootDir, 'index.html')
  : path.join(rootDir, 'eki_v9_final.html');

const html = fs.readFileSync(htmlFile, 'utf8');
const issues = [];

const lineNumberAt = index => html.slice(0, index).split(/\r?\n/).length;

for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
  const tag = match[0];
  if (!/\balt\s*=\s*["'][^"']*["']/i.test(tag)) {
    issues.push(`${path.basename(htmlFile)}:${lineNumberAt(match.index)} -> Imagen sin atributo alt.`);
  }
}

for (const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
  const attrs = match[1] || '';
  const content = (match[2] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim();
  const hasAriaLabel = /\baria-label\s*=\s*["'][^"']+["']/i.test(attrs);
  const hasVisibleLabel = content.length > 0;
  if (!hasAriaLabel && !hasVisibleLabel) {
    issues.push(`${path.basename(htmlFile)}:${lineNumberAt(match.index)} -> Boton sin nombre accesible.`);
  }
}

for (const match of html.matchAll(/<[^>]+\brole\s*=\s*["']dialog["'][^>]*>/gi)) {
  const tag = match[0];
  if (!/\baria-modal\s*=\s*["']true["']/i.test(tag)) {
    issues.push(`${path.basename(htmlFile)}:${lineNumberAt(match.index)} -> Dialog sin aria-modal=\"true\".`);
  }
}

for (const match of html.matchAll(/<a\b[^>]*target\s*=\s*["']_blank["'][^>]*>/gi)) {
  const tag = match[0];
  const relMatch = tag.match(/\brel\s*=\s*["']([^"']+)["']/i);
  const relValue = relMatch ? relMatch[1].toLowerCase() : '';
  if (!(relValue.includes('noopener') && relValue.includes('noreferrer'))) {
    issues.push(`${path.basename(htmlFile)}:${lineNumberAt(match.index)} -> Enlace _blank sin rel=\"noopener noreferrer\".`);
  }
}

if (issues.length > 0) {
  console.error('Accessibility baseline checks failed:');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Accessibility baseline checks passed.');
