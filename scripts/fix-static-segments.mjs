import { readdir, copyFile } from 'node:fs/promises';
import path from 'node:path';

// Next 16.4 on Windows can retain path separators in static RSC filenames.
// Browsers request these segment payloads using dots, on every static host.
async function visit(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('__next.')) await flatten(file, dir, entry.name);
      else await visit(file);
    }
  }
}
async function flatten(dir, target, prefix) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    const name = `${prefix}.${entry.name}`;
    if (entry.isDirectory()) await flatten(file, target, name);
    else await copyFile(file, path.join(target, name));
  }
}
await visit('out');
