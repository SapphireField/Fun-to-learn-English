import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const staticHosting = process.argv.includes('--static');
const html = await readFile(path.join(root, 'index.html'), 'utf8');
await writeFile(path.join(output, 'index.html'), staticHosting
  ? html.replace('</head>', '  <meta name="mellom-hosting" content="static" />\n  </head>')
  : html);
if (staticHosting) await writeFile(path.join(output, '.nojekyll'), '');
await cp(path.join(root, 'src'), path.join(output, 'src'), {
  recursive: true,
  filter: source => !path.basename(source).startsWith('.'),
});
try {
  for (const item of await readdir(path.join(root, 'public'))) {
    if (!item.startsWith('.')) await cp(path.join(root, 'public', item), path.join(output, item), { recursive: true, filter: source => !path.basename(source).startsWith('.') });
  }
} catch (error) { if (error.code !== 'ENOENT') throw error; }
console.log(staticHosting ? 'Built dist/ for static hosting (guided feedback, no API requests).' : 'Built dist/ with local assets. Start with npm run preview.');
