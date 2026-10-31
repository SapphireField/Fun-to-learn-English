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

test('sentence feedback survives reload only when it matches the saved sentence', () => {
  const state = freshState();
  const record = ensureDay(state, '2026-10-31', 'en');
  record.sentences['work-en-2'] = 'I have more autonomy at work.';
  const result = { source: 'guided', summary: 'Usage observations', strengths: ['The expression appears.'], suggestions: ['Be specific about the choices you can make.'], questions: ['What can you decide yourself?'], usedWords: ['autonomy'], wordCount: 7, example: 'Greater autonomy helps me plan my work.', collocation: 'greater autonomy', tip: 'Name a choice.' };
  record.sentenceFeedback['work-en-2'] = { text: record.sentences['work-en-2'], result, checkedAt: '2026-10-31T10:00:00Z' };
  const target = storage(null);
  assert.equal(saveState(target, state), true);
  assert.deepEqual(loadState(target).days['2026-10-31-en'].sentenceFeedback['work-en-2'].result, result);
  // Even a spelling or punctuation change makes the previous assessment stale.
  record.sentences['work-en-2'] += ' I can choose my schedule.';
  saveState(target, state);
  assert.deepEqual(loadState(target).days['2026-10-31-en'].sentenceFeedback, {});
});

test('malformed sentence feedback is ignored while the original writing is preserved', () => {
  const state = freshState();
  const record = ensureDay(state, '2026-10-31', 'no');
  record.sentences['work-no-2'] = 'Jeg ønsker større handlingsrom på jobb.';
  record.sentenceFeedback['work-no-2'] = { text: record.sentences['work-no-2'], result: { source: 'ai', summary: 'Short feedback', strengths: 'not an array', suggestions: [], questions: [], usedWords: [], wordCount: 7 } };
  const target = storage(JSON.stringify(state));
  const restored = loadState(target).days['2026-10-31-no'];
  assert.equal(restored.sentences['work-no-2'], record.sentences['work-no-2']);
  assert.deepEqual(restored.sentenceFeedback, {});
});
