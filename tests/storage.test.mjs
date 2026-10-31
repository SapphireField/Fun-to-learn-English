import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, loadState, saveState, ensureDay, completedSteps } from '../src/storage.mjs';
const storage = value => ({ value, getItem() { return this.value; }, setItem(_, value) { this.value = value; } });

test('local progress round trips independent languages and exercise drafts', () => {
  const state = freshState();
  const en = ensureDay(state, '2026-10-31', 'en');
  en.argument = { text: 'A specific argument.', complete: true, updated: 'now' };
  en.sentences['work-en-1'] = 'A trade-off matters to me.';
  en.words = ['work-en-1'];
  ensureDay(state, '2026-10-31', 'no').story.text = 'Dette er min historie.';
  state.selectedOn = '2026-10-31';
  const target = storage(null);
  assert.equal(saveState(target, state), true);
  assert.deepEqual(loadState(target), state);
  assert.equal(completedSteps(en), 1);
  en.words = ['one', 'two', 'three']; en.story.complete = true; en.speaking = true;
  assert.equal(completedSteps(en), 4);
});

test('missing, malformed and incompatible storage safely starts fresh', () => {
  for (const value of [null, '', '{', '[]', '{"version":12}', '{"version":1,"days":[],"reviews":{}}']) {
    assert.deepEqual(loadState(storage(value)), freshState());
  }
  const denied = { getItem() { throw Error('denied'); }, setItem() { throw Error('quota'); } };
  assert.deepEqual(loadState(denied), freshState());
  assert.equal(saveState(denied, freshState()), false);
});

test('stored values are normalized without losing drafts or duplicate-counting words', () => {
  const target = storage(JSON.stringify({ version: 1, language: 'bad', days: {
    'not-a-date': {}, '2026-10-31-en': { words: ['one', 'one', 2], sentences: { good: 'My words', bad: 9 }, argument: { text: '<img src=x onerror=alert(1)>', complete: 'yes' }, story: 5 },
  }, reviews: { valid: { interval: 1, due: '2026-11-01', repetitions: 2 }, invalid: { interval: 'one', due: 'bad' } } }));
  const result = loadState(target);
  assert.equal(result.language, 'en');
  assert.deepEqual(Object.keys(result.days), ['2026-10-31-en']);
  assert.deepEqual(result.days['2026-10-31-en'].words, ['one']);
  assert.deepEqual(result.days['2026-10-31-en'].sentences, { good: 'My words' });
  assert.equal(result.days['2026-10-31-en'].argument.complete, false);
  assert.equal(result.days['2026-10-31-en'].argument.text, '<img src=x onerror=alert(1)>');
  assert.deepEqual(Object.keys(result.reviews), ['valid']);
});
