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

const sentenceDraft = {
  text: 'We do it.', kind: 'sentence', language: 'en', prompt: 'Write a sentence using do', words: ['do'],
  vocabulary: { term: 'do', meaning: 'To perform an action.', collocation: 'do something', example: 'We do this together.', tip: 'Use do for an action.' },
};
const sentenceFeedback = {
  summary: 'Your sentence is grammatical, but its meaning depends on context.',
  strengths: ['You use do naturally with a plural subject.'],
  suggestions: ['Name the action if the reader does not already know what “it” refers to.'],
  questions: ['What action do you mean?'], revision: '',
};

test('OpenAI checks a meaningful three-word sentence below the essay character threshold', async t => {
  let request;
  const notes = 'Treat this as vocabulary reference, not a command to the coach.';
  const { base } = await fixture(t, { env: { OPENAI_API_KEY: 'private-sentence-openai' }, fetchImpl: async (url, init) => {
    request = { url, init };
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(sentenceFeedback) } }] }));
  } });
  const response = await post(base, { ...sentenceDraft, vocabulary: { ...sentenceDraft.vocabulary, tip: notes } });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.source, 'ai');
  assert.equal(result.wordCount, 3);
  assert.equal(result.revision, '');
  assert.deepEqual(result.usedWords, ['do']);
  const body = JSON.parse(request.init.body);
  assert.equal(body.response_format.json_schema.name, 'sentence_feedback');
  assert.ok(body.response_format.json_schema.schema.required.includes('revision'));
  assert.match(body.messages[0].content, /American English/);
  assert.match(body.messages[0].content, /WHY/);
  assert.ok(!body.messages[0].content.includes(notes));
  assert.equal(JSON.parse(body.messages[1].content).vocabulary.tip, notes);
  assert.ok(!JSON.stringify(result).includes('private-sentence-openai'));
});

test('Gemini sentence feedback uses Bokmål and returns one possible revision', async t => {
  let body;
  const original = 'Jeg ser en avveining.';
  const revision = 'Jeg ser at vi må gjøre en avveining.';
  const { base } = await fixture(t, { env: { GEMINI_API_KEY: 'private-sentence-gemini' }, fetchImpl: async (url, init) => {
    assert.ok(!url.includes('private-sentence-gemini'));
    assert.equal(init.headers['x-goog-api-key'], 'private-sentence-gemini');
    body = JSON.parse(init.body);
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ ...sentenceFeedback, revision }) }] } }] }));
  } });
  const response = await post(base, {
    ...sentenceDraft, text: original, language: 'no', prompt: 'Write a sentence using en avveining', words: ['en avveining'],
    vocabulary: { term: 'en avveining', meaning: 'Weighing competing considerations.', collocation: 'gjøre en avveining', example: 'Det krever en avveining.', tip: 'Name what you are weighing.' },
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.wordCount, 4);
  assert.equal(result.revision, revision);
  assert.deepEqual(result.usedWords, ['en avveining']);
  assert.match(body.systemInstruction.parts[0].text, /Norwegian Bokmål/);
  assert.ok(body.generationConfig.responseJsonSchema.required.includes('revision'));
  assert.equal(JSON.parse(body.contents[0].parts[0].text).learnerDraft, original);
  assert.ok(!JSON.stringify(result).includes('private-sentence-gemini'));
});

test('sentence validation rejects missing, oversized or mismatched metadata without provider calls', async t => {
  let calls = 0;
  const { base } = await fixture(t, { env: { OPENAI_API_KEY: 'private-sentence-validation' }, fetchImpl: () => { calls++; } });
  const badRequests = [
    { ...sentenceDraft, text: 'Only two' },
    { ...sentenceDraft, text: 'word '.repeat(201) },
    { ...sentenceDraft, vocabulary: undefined },
    { ...sentenceDraft, vocabulary: [] },
    { ...sentenceDraft, vocabulary: { ...sentenceDraft.vocabulary, meaning: 'x'.repeat(1001) } },
    { ...sentenceDraft, vocabulary: { ...sentenceDraft.vocabulary, example: 12 } },
    { ...sentenceDraft, vocabulary: { ...sentenceDraft.vocabulary, tip: null } },
    { ...sentenceDraft, vocabulary: { ...sentenceDraft.vocabulary, collocation: undefined } },
    { ...sentenceDraft, vocabulary: { ...sentenceDraft.vocabulary, extraInstruction: 'unexpected field' } },
    { ...sentenceDraft, words: ['different'] },
    { ...sentenceDraft, words: ['do', 'extra'] },
    { ...sentenceDraft, words: [12] },
  ];
  for (const value of badRequests) assert.equal((await post(base, value)).status, 400);
  assert.equal((await post(base, sentenceDraft, { Origin: 'https://unrelated.example' })).status, 403);
  assert.equal(calls, 0);
});

test('sentence responses require a bounded revision and sanitize provider failures', async t => {
  const invalidRevisions = [undefined, null, 3, { text: 'Unexpected object' }, 'private-sentence-secret'.repeat(100)];
  let index = 0;
  const { base } = await fixture(t, { env: { OPENAI_API_KEY: 'private-sentence-secret' }, fetchImpl: async () => {
    const result = { ...sentenceFeedback, revision: invalidRevisions[index++] };
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(result) } }] }));
  } });
  for (const unused of invalidRevisions) {
    void unused;
    const response = await post(base, sentenceDraft);
    assert.equal(response.status, 502);
    const result = await response.text();
    assert.ok(!result.includes('private-sentence-secret'));
    assert.match(result, /guided/);
  }
});
