import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function outputFiles(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await outputFiles(path.join(directory, entry.name), relative));
    else files.push(relative);
  }
  return files;
}

test('deployment builds preserve relative assets, exclude private files, and reset static hosting mode', async t => {
  // Run the real script from an isolated root: never modify the app's real dist/.
  const fixture = await mkdtemp(path.join(tmpdir(), 'mellom-build-test-'));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  await Promise.all([
    mkdir(path.join(fixture, 'scripts'), { recursive: true }),
    mkdir(path.join(fixture, 'src', '.private'), { recursive: true }),
    mkdir(path.join(fixture, 'public', 'assets', '.private'), { recursive: true }),
  ]);
  const html = await readFile(path.join(projectRoot, 'index.html'), 'utf8');
  await cp(path.join(projectRoot, 'scripts', 'build.mjs'), path.join(fixture, 'scripts', 'build.mjs'));
  await Promise.all([
    writeFile(path.join(fixture, 'index.html'), html),
    writeFile(path.join(fixture, 'src', 'app.mjs'), 'export const fixture = true;\n'),
    writeFile(path.join(fixture, 'src', 'styles.css'), 'body { color: green; }\n'),
    writeFile(path.join(fixture, 'public', 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>\n'),
    writeFile(path.join(fixture, 'public', 'assets', 'icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>\n'),
    writeFile(path.join(fixture, '.env.local'), 'FIXTURE_ONLY=not-a-real-key\n'),
    writeFile(path.join(fixture, 'src', '.env'), 'FIXTURE_ONLY=not-a-real-key\n'),
    writeFile(path.join(fixture, 'src', '.private', 'internal.txt'), 'private fixture\n'),
    writeFile(path.join(fixture, 'public', '.env.local'), 'FIXTURE_ONLY=not-a-real-key\n'),
    writeFile(path.join(fixture, 'public', 'assets', '.private', 'internal.txt'), 'private fixture\n'),
  ]);

  async function build(...args) {
    const result = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [path.join(fixture, 'scripts', 'build.mjs'), ...args], {
        cwd: fixture, timeout: 10_000,
      });
      let output = '';
      child.stdout.on('data', chunk => { output += chunk; });
      child.stderr.on('data', chunk => { output += chunk; });
      child.once('error', reject);
      child.once('close', status => resolve({ status, output }));
    });
    assert.equal(result.status, 0, result.output);
  }

  const output = path.join(fixture, 'dist');
  await build();
  const normalHtml = await readFile(path.join(output, 'index.html'), 'utf8');
  assert.equal(normalHtml, html);
  assert.match(normalHtml, /href="\.\/favicon\.svg"/);
  assert.match(normalHtml, /href="\.\/src\/styles\.css"/);
  assert.match(normalHtml, /src="\.\/src\/app\.mjs"/);
  assert.deepEqual((await outputFiles(output)).sort(), [
    'assets/icon.svg', 'favicon.svg', 'index.html', 'src/app.mjs', 'src/styles.css',
  ].sort());

  await build('--static');
  const staticHtml = await readFile(path.join(output, 'index.html'), 'utf8');
  assert.match(staticHtml, /<meta name="mellom-hosting" content="static"\s*\/>/);
  assert.equal(await readFile(path.join(output, '.nojekyll'), 'utf8'), '');
  assert.match(staticHtml, /src="\.\/src\/app\.mjs"/);
  assert.deepEqual((await outputFiles(output)).sort(), [
    '.nojekyll', 'assets/icon.svg', 'favicon.svg', 'index.html', 'src/app.mjs', 'src/styles.css',
  ].sort());

  await build();
  assert.equal(await readFile(path.join(output, 'index.html'), 'utf8'), html);
  await assert.rejects(readFile(path.join(output, '.nojekyll')), { code: 'ENOENT' });
  assert.ok(!(await outputFiles(output)).some(file => file.includes('.env') || file.includes('.private')));
});
