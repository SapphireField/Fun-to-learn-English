import test from 'node:test';
import assert from 'node:assert/strict';
import { languages, lessons } from '../src/content.mjs';
import { localDateKey, getLesson, countWords, getGuidedFeedback, scheduleReview } from '../src/learning.mjs';

test('Oslo calendar date crosses midnight independently of UTC', () => {
  assert.equal(localDateKey(new Date('2026-10-31T23:30:00Z')), '2026-11-01');
  assert.equal(localDateKey(new Date('2026-07-10T22:30:00Z')), '2026-07-11');
  assert.equal(localDateKey(new Date('2026-01-10T22:30:00Z')), '2026-01-10');
});

test('lesson cycle is deterministic, wraps weekly, and validates dates', () => {
  assert.equal(getLesson('2026-10-31').id, lessons[0].id);
  assert.equal(getLesson('2026-11-07').id, getLesson('2026-10-31').id);
  assert.equal(getLesson('2026-10-30').id, lessons.at(-1).id);
  assert.notEqual(getLesson('2026-11-01').id, getLesson('2026-10-31').id);
  assert.throws(() => getLesson('2026-02-30'), RangeError);
  assert.throws(() => getLesson('2026-1-1'), RangeError);
});

test('all seven themes contain complete distinct bilingual practice content', () => {
  assert.deepEqual(languages.map(language => language.id), ['en', 'no']);
  assert.equal(lessons.length, 7);
  assert.equal(new Set(lessons.map(lesson => lesson.id)).size, lessons.length);
  const ids = [];
  for (const lesson of lessons) for (const language of ['en', 'no']) {
    const content = lesson[language];
    assert.equal(content.words.length, 3);
    assert.ok(content.argument.prompt && content.story.prompt && content.speaking.text);
    assert.ok(content.argument.scaffold.length >= 4 && content.story.scaffold.length >= 4);
    for (const word of content.words) {
      ids.push(word.id);
      for (const field of ['id', 'term', 'pronunciation', 'meaning', 'translation', 'example', 'collocation', 'tip']) assert.ok(word[field]);
    }
  }
  assert.equal(ids.length, 42);
  assert.equal(new Set(ids).size, 42);
});

test('count words supports Norwegian letters, contractions and compounds', () => {
  assert.equal(countWords('Jeg bør revurdere påstanden.'), 4);
  assert.equal(countWords("It's a trade-off, isn't it?"), 5);
  assert.equal(countWords(' … — ! '), 0);
});

test('guided checklist distinguishes observations from language assessment', () => {
  const feedback = getGuidedFeedback('I support autonomy because it helps, but there is a trade-off.', 'argument', 'en', lessons[0].en.words);
  assert.equal(feedback.source, 'guided');
  assert.match(feedback.summary, /not a grammar or meaning assessment/);
  assert.deepEqual(feedback.usedWords, ['a trade-off', 'autonomy']);
  assert.ok(feedback.strengths.some(value => value.includes('connector')));
  assert.equal(feedback.questions.length, 2);
  const blank = getGuidedFeedback('', 'argument', 'en');
  assert.equal(blank.wordCount, 0);
  assert.equal(blank.strengths.length, 0);
  assert.ok(blank.suggestions[0].includes('first draft'));
});

test('vocabulary detection respects boundaries and common inflections', () => {
  assert.deepEqual(getGuidedFeedback('The benefits accommodate varied needs. Trade-offs matter.', 'argument', 'en', lessons[0].en.words).usedWords, ['a trade-off', 'to accommodate']);
  assert.deepEqual(getGuidedFeedback('The lack of autonomy undermines us.', 'argument', 'en', [{ term: 'auto' }]).usedWords, []);
  const feedback = getGuidedFeedback('Jeg underbygger synspunktet med et forbehold.', 'argument', 'no', lessons[1].no.words);
  assert.deepEqual(feedback.usedWords, ['et forbehold', 'å underbygge', 'et synspunkt']);
});

test('review schedules persist calendar dates across DST and year changes', () => {
  const first = scheduleReview(null, 'good', '2026-10-24');
  assert.deepEqual(first, { interval: 1, due: '2026-10-25', repetitions: 1 });
  const second = scheduleReview(first, 'good', '2026-10-25');
  assert.deepEqual(second, { interval: 2, due: '2026-10-27', repetitions: 2 });
  assert.deepEqual(scheduleReview(second, 'again', '2026-12-31'), { interval: 1, due: '2027-01-01', repetitions: 0 });
  assert.deepEqual(scheduleReview(null, 'easy', '2028-02-27'), { interval: 3, due: '2028-03-01', repetitions: 1 });
  assert.throws(() => scheduleReview(null, 'invalid', '2026-10-31'), RangeError);
});

test('story feedback checks for narrative structure rather than inventing corrections', () => {
  const feedback = getGuidedFeedback('Først møtte jeg en nabo. Senere ble vi kjent.', 'story', 'no');
  assert.ok(feedback.strengths.some(value => value.includes('tidsuttrykk')));
  assert.ok(feedback.questions.some(value => value.includes('forandret seg')));
  assert.equal(feedback.usedWords.length, 0);
});
