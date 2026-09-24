import { copyFile, mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const source = resolve(projectRoot, 'dist/index.html');
const releaseDirectory = resolve(projectRoot, 'release');
const destination = resolve(releaseDirectory, 'Structural-Visualizer.html');

await stat(source);
await mkdir(releaseDirectory, { recursive: true });
await copyFile(source, destination);

console.log(`Created ${destination}`);
