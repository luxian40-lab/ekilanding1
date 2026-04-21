import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const imageExt = new Set(['.png', '.jpg', '.jpeg', '.svg', '.webp']);
const videoExt = new Set(['.mp4', '.webm']);

const warnImageBytes = 1.5 * 1024 * 1024;
const warnVideoBytes = 20 * 1024 * 1024;
const failImageBytes = 30 * 1024 * 1024;
const failVideoBytes = 120 * 1024 * 1024;

const collected = [];

const walk = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
      walk(fullPath);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!imageExt.has(ext) && !videoExt.has(ext)) continue;

    const stats = fs.statSync(fullPath);
    collected.push({
      file: path.relative(rootDir, fullPath).replace(/\\/g, '/'),
      ext,
      size: stats.size
    });
  }
};

walk(rootDir);
collected.sort((a, b) => b.size - a.size);

const warnings = [];
const blockers = [];

for (const item of collected) {
  const isVideo = videoExt.has(item.ext);
  const warnThreshold = isVideo ? warnVideoBytes : warnImageBytes;
  const failThreshold = isVideo ? failVideoBytes : failImageBytes;

  if (item.size > failThreshold) {
    blockers.push(item);
  } else if (item.size > warnThreshold) {
    warnings.push(item);
  }
}

const toMb = bytes => (bytes / (1024 * 1024)).toFixed(2);

console.log('Top 10 largest media files:');
for (const item of collected.slice(0, 10)) {
  console.log(`- ${item.file}: ${toMb(item.size)} MB`);
}

if (warnings.length > 0) {
  console.warn('Performance warnings (consider optimizing):');
  for (const item of warnings) {
    console.warn(`- ${item.file}: ${toMb(item.size)} MB`);
  }
}

if (blockers.length > 0) {
  console.error('Performance blockers (too large):');
  for (const item of blockers) {
    console.error(`- ${item.file}: ${toMb(item.size)} MB`);
  }
  process.exit(1);
}

console.log('Performance baseline checks passed.');
