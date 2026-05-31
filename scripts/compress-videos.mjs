import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const originalsDir = path.join(rootDir, 'media-originals');
const targetBytes = 22 * 1024 * 1024;
const audioKbps = 96;

const files = [
  'testimonioCenipalma.mp4',
  'testimonioanuc.mp4',
  'experiencias/videos/campocolombiano.mp4',
  'experiencias/videos/testimonio1.mp4'
];

const probeDuration = file => {
  const result = spawnSync(
    'ffprobe',
    [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      file
    ],
    { encoding: 'utf8' }
  );

  if (result.status !== 0) {
    throw new Error(`ffprobe failed for ${file}: ${result.stderr}`);
  }

  return Number.parseFloat(result.stdout.trim());
};

const compressVideo = async relativePath => {
  const input = path.join(rootDir, relativePath);
  const stats = await fs.stat(input);

  if (stats.size <= targetBytes) {
    console.log(`Skip ${relativePath}: ${(stats.size / (1024 * 1024)).toFixed(2)} MiB`);
    return;
  }

  await fs.mkdir(originalsDir, { recursive: true });
  const backup = path.join(originalsDir, relativePath.replace(/\//g, '__'));
  if (!(await fs.stat(backup).catch(() => null))) {
    await fs.copyFile(input, backup);
    console.log(`Backup: ${relativePath} -> media-originals/`);
  }

  const duration = probeDuration(input);
  const videoKbps = Math.max(
    500,
    Math.floor((targetBytes * 8) / duration / 1000) - audioKbps
  );

  const tempOutput = `${input}.tmp.mp4`;
  const scaleFilter = relativePath.includes('testimonio') && relativePath.endsWith('.mp4') && !relativePath.includes('experiencias')
    ? 'scale=720:-2'
    : relativePath.includes('campocolombiano')
      ? 'scale=960:-2'
      : 'scale=848:-2';

  console.log(`Compress ${relativePath} -> ~${videoKbps}k video (${(stats.size / (1024 * 1024)).toFixed(2)} MiB)`);

  const result = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-i', input,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-b:v', `${videoKbps}k`,
      '-maxrate', `${Math.floor(videoKbps * 1.2)}k`,
      '-bufsize', `${videoKbps * 2}k`,
      '-vf', scaleFilter,
      '-c:a', 'aac',
      '-b:a', `${audioKbps}k`,
      '-movflags', '+faststart',
      tempOutput
    ],
    { stdio: 'inherit' }
  );

  if (result.status !== 0) {
    throw new Error(`ffmpeg failed for ${relativePath}`);
  }

  const compressedStats = await fs.stat(tempOutput);
  if (compressedStats.size > 25 * 1024 * 1024) {
    await fs.rm(tempOutput, { force: true });
    throw new Error(`${relativePath} still too large after compression (${(compressedStats.size / (1024 * 1024)).toFixed(2)} MiB)`);
  }

  await fs.rename(tempOutput, input);
  console.log(`Done ${relativePath}: ${(compressedStats.size / (1024 * 1024)).toFixed(2)} MiB`);
};

for (const file of files) {
  await compressVideo(file);
}

console.log('Video compression complete.');
