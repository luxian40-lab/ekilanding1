import { promises as fs } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

const excludedNames = new Set([
  'node_modules',
  'dist',
  '.git',
  '.github',
  'scripts',
  'media-originals',
  'package.json',
  'package-lock.json',
  'wrangler.jsonc'
]);

const shouldSkip = name => {
  if (excludedNames.has(name)) return true;
  if (name.startsWith('.git')) return true;
  return false;
};

const copyEntry = async name => {
  const src = path.join(rootDir, name);
  const dest = path.join(distDir, name);
  await fs.cp(src, dest, { recursive: true, force: true });
};

await fs.rm(distDir, { recursive: true, force: true });
await fs.mkdir(distDir, { recursive: true });

const entries = await fs.readdir(rootDir, { withFileTypes: true });
for (const entry of entries) {
  if (shouldSkip(entry.name)) continue;
  await copyEntry(entry.name);
}

await fs.writeFile(path.join(distDir, '.nojekyll'), '');
console.log(`Build complete: ${distDir}`);
