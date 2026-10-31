import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createAppServer } from '../server.mjs';

const draft = { text: 'Although technology improves productivity, it also creates a trade-off for workers.', kind: 'argument', language: 'en', prompt: 'Does technology improve working life?', words: ['trade-off', 'reservation'] };
const feedback = { summary: 'Your main idea is clear.', strengths: ['You identify a trade-off.'], suggestions: ['Add a concrete example to explain your claim.'], questions: ['Which workers do you have in mind?'] };

async function fixture(t, options = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'language-server-'));
  await mkdir(path.join(root, 'src'));
  await mkdir(path.join(root, 'public'));
  await writeFile(path.join(root, 'index.html'), '<h1>Language practice</h1>');
  await writeFile(path.join(root, 'src', 'app.mjs'), 'export const ready = true;');
  await writeFile(path.join(root, '.env.local'), 'PRIVATE=do-not-disclose');
  await writeFile(path.join(root, 'server.mjs'), 'server private implementation');
  await writeFile(path.join(root, 'public', 'icon.svg'), '<svg></svg>');
  const server = createAppServer({ root, env: {}, ...options });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(root, { recursive: true, force: true }); });
  return { root, base: `http://127.0.0.1:${server.address().port}` };
}

function post(base, body = draft, headers = {}) {
  return fetch(`${base}/api/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
}

test('serves the application and public assets while excluding implementation and credentials', async t => {
  const { root, base } = await fixture(t);
  assert.equal(await (await fetch(base)).text(), '<h1>Language practice</h1>');
  assert.match((await fetch(`${base}/src/app.mjs`)).headers.get('content-type'), /javascript/);
  assert.equal((await fetch(`${base}/icon.svg`)).status, 200);
  for (const name of ['.env.local', '.git/config', 'server.mjs', 'package.json', 'src/%2e%2e/.env.local']) {
    const result = await fetch(`${base}/${name}`);
    assert.equal(result.status, 404, name);
    assert.ok(!(await result.text()).includes('do-not-disclose'));
  }
  await symlink(path.join(root, '.env.local'), path.join(root, 'public', 'leak.js'));
  assert.equal((await fetch(`${base}/leak.js`)).status, 404);
  const head = await fetch(base, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});

test('does not require a key for normal use and reports AI connection separately', async t => {
  const { base } = await fixture(t);
  assert.deepEqual(await (await fetch(`${base}/api/status`)).json(), { aiAvailable: false, provider: null });
  const response = await post(base);
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /guided/);
});

test('rejects cross-origin requests, malformed drafts and oversized bodies before provider calls', async t => {
  let calls = 0;
  const { base } = await fixture(t, { env: { OPENAI_API_KEY: 'test-secret' }, fetchImpl: () => { calls++; } });
  assert.equal((await post(base, draft, { Origin: 'https://unrelated.example' })).status, 403);
  assert.equal((await post(base, { ...draft, language: 'unknown' })).status, 400);
  assert.equal((await post(base, { ...draft, words: [7] })).status, 400);
  assert.equal((await post(base, { ...draft, text: 'x'.repeat(30_000) })).status, 413);
  assert.equal((await fetch(`${base}/api/feedback`, { method: 'POST', body: 'invalid' })).status, 415);
  assert.equal(calls, 0);
});

test('keeps OpenAI credentials on the server and validates structured feedback', async t => {
  let request;
  const { base } = await fixture(t, { env: { OPENAI_API_KEY: 'private-openai', GEMINI_API_KEY: 'unused' }, fetchImpl: async (url, init) => {
    request = { url, init };
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(feedback) } }] }));
  } });
  assert.deepEqual(await (await fetch(`${base}/api/status`)).json(), { aiAvailable: true, provider: 'openai' });
  const response = await post(base, draft, { Origin: base });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.source, 'ai');
  assert.equal(result.summary, feedback.summary);
  assert.deepEqual(result.usedWords, ['trade-off']);
  assert.ok(result.wordCount > 10);
  assert.equal(request.url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(request.init.headers.Authorization, 'Bearer private-openai');
  const body = JSON.parse(request.init.body);
  assert.equal(body.response_format.type, 'json_schema');
  assert.ok(!JSON.stringify(result).includes('private-openai'));
});

test('Gemini credentials use a header rather than a URL and provider failures remain private', async t => {
  let request;
  const { base } = await fixture(t, { env: { GEMINI_API_KEY: 'private-gemini' }, fetchImpl: async (url, init) => {
    request = { url, init };
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(feedback) }] } }] }));
  } });
  const response = await post(base, { ...draft, language: 'no' });
  assert.equal(response.status, 200);
  assert.equal(request.init.headers['x-goog-api-key'], 'private-gemini');
  assert.ok(!request.url.includes('private-gemini'));
  assert.match(JSON.parse(request.init.body).systemInstruction.parts[0].text, /Bokmål/);
});

test('rejects malformed AI feedback instead of returning untrusted response fields', async t => {
  const { base } = await fixture(t, { env: { OPENAI_API_KEY: 'private-openai' }, fetchImpl: async () => {
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"summary":"private-openai"}' } }] }));
  } });
  const response = await post(base);
  assert.equal(response.status, 502);
  const text = await response.text();
  assert.ok(!text.includes('private-openai'));
  assert.match(text, /guided/);
});
