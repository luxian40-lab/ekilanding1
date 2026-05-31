import fs from 'node:fs';
import path from 'node:path';

const distDir = path.join(process.cwd(), 'dist');
const maxBytes = 25 * 1024 * 1024;

if (!fs.existsSync(distDir)) {
  console.error('Cloudflare check failed: dist/ not found. Run npm run build first.');
  process.exit(1);
}

const blockers = [];

const walk = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    const size = fs.statSync(fullPath).size;
    if (size > maxBytes) {
      blockers.push({
        file: path.relative(distDir, fullPath).replace(/\\/g, '/'),
        sizeMb: (size / (1024 * 1024)).toFixed(2)
      });
    }
  }
};

walk(distDir);

if (blockers.length === 0) {
  console.log('Cloudflare asset size checks passed.');
  process.exit(0);
}

console.error('Cloudflare deploy blockers (max 25 MiB per file):');
for (const item of blockers) {
  console.error(`- ${item.file}: ${item.sizeMb} MiB`);
}
console.error('Compress these files or host them externally (R2, Stream, YouTube).');
process.exit(1);
