import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons } from '../src/content.mjs';
import { containsTargetExpression, getSentenceFeedback } from '../src/sentence-feedback.mjs';

const vocabulary = language => lessons.flatMap(lesson => lesson[language].words);
const findWord = term => [...vocabulary('en'), ...vocabulary('no')].find(word => word.term === term);

test('sentence feedback returns honest observations and the unchanged reference metadata', () => {
  const word = findWord('autonomy');
  const feedback = getSentenceFeedback('I need autonomy.', 'en', word);
  assert.equal(feedback.source, 'guided');
  assert.match(feedback.summary, /not a grammar or meaning verdict/);
  assert.equal(feedback.wordCount, 3);
  assert.deepEqual(feedback.usedWords, ['autonomy']);
  assert.equal(feedback.example, word.example);
  assert.equal(feedback.collocation, word.collocation);
  assert.equal(feedback.tip, word.tip);
  assert.equal(Object.hasOwn(feedback, 'rewrite'), false);
  assert.ok(feedback.questions[0].includes('decisions'));
  assert.ok(!feedback.suggestions.some(value => /60|80|120|longer|too short/iu.test(value)));
});

test('expression detection handles common English and Norwegian inflections', () => {
  for (const form of ['accommodate', 'accommodates', 'accommodated', 'accommodating']) {
    assert.equal(containsTargetExpression(`We considered ${form} different needs.`, 'to accommodate', 'en'), true);
  }
  assert.equal(containsTargetExpression('She is substantiating her claim.', 'to substantiate', 'en'), true);
  assert.equal(containsTargetExpression('He reassesses the plan.', 'to reassess', 'en'), true);
  for (const form of ['underbygge', 'underbygger', 'underbygget', 'underbygde', 'underbygd']) {
    assert.equal(containsTargetExpression(`Vi kan ${form} påstanden.`, 'å underbygge', 'no'), true);
  }
  assert.equal(containsTargetExpression('Vi har tilrettelagt for ulike behov.', 'å tilrettelegge', 'no'), true);
  assert.equal(containsTargetExpression('Disse planene er gjennomførbare.', 'gjennomførbar', 'no'), true);
  assert.equal(containsTargetExpression('Jeg forstår synspunktene.', 'et synspunkt', 'no'), true);
  assert.equal(containsTargetExpression('Handlingsrommet er større.', 'handlingsrom', 'no'), true);
  assert.equal(containsTargetExpression('Their senses of belonging differ.', 'a sense of belonging', 'en'), true);
});

test('expression detection respects complete boundaries and distinct constructions', () => {
  assert.equal(containsTargetExpression('The autonomous team agreed.', 'autonomy', 'en'), false);
  assert.equal(containsTargetExpression('Autonomys matter.', 'autonomy', 'en'), false);
  assert.equal(containsTargetExpression('The automobile stopped.', 'auto', 'en'), false);
  assert.equal(containsTargetExpression('We need trade off some time.', 'a trade-off', 'en'), false);
  assert.equal(containsTargetExpression('We considered the trade‑offs.', 'a trade-off', 'en'), true);
  assert.equal(containsTargetExpression('Autonomy’s benefits matter.', 'autonomy', 'en'), true);
  assert.equal(containsTargetExpression('autonomy_test', 'autonomy', 'en'), false);
  assert.equal(containsTargetExpression('Påstanden er underbyggende.', 'å underbygge', 'no'), false);
  assert.equal(containsTargetExpression('Something else.', '', 'en'), false);
});

test('missing expression and empty input retain a reference rather than inventing a rewrite', () => {
  const word = findWord('a trade-off');
  const feedback = getSentenceFeedback('The decision needs careful thought.', 'en', word);
  assert.deepEqual(feedback.usedWords, []);
  assert.ok(feedback.suggestions.some(value => value.includes('did not find')));
  assert.ok(feedback.questions[0].includes('two benefits'));
  const empty = getSentenceFeedback('  …  ', 'en', word);
  assert.equal(empty.wordCount, 0);
  assert.equal(empty.strengths.length, 0);
  assert.equal(empty.example, word.example);
  assert.ok(empty.suggestions[0].includes('Write a sentence'));
});

test('mechanics checks are conditional and do not penalize short complete sentences', () => {
  const word = findWord('autonomy');
  const incomplete = getSentenceFeedback('i value autonomy', 'en', word);
  assert.ok(incomplete.suggestions.some(value => value.includes('capital letter')));
  assert.ok(incomplete.suggestions.some(value => value.includes('final period')));
  const complete = getSentenceFeedback('I value autonomy!', 'en', word);
  assert.ok(!complete.suggestions.some(value => /capital letter|final period|35 words/u.test(value)));
  const quoted = getSentenceFeedback('“i value autonomy”', 'en', word);
  assert.ok(!quoted.suggestions.some(value => /capital letter|final period/u.test(value)));
  const code = getSentenceFeedback('`autonomy = true`', 'en', word);
  assert.ok(!code.suggestions.some(value => /capital letter|final period/u.test(value)));
  const long = getSentenceFeedback(`Autonomy ${'can matter '.repeat(18)}in practice.`, 'en', word);
  assert.ok(long.suggestions.some(value => value.includes('35 words')));
});

test('curated construction hints are narrowly scoped and qualified by meaning', () => {
  const autonomy = getSentenceFeedback('I am autonomy.', 'en', findWord('autonomy'));
  assert.ok(autonomy.suggestions.some(value => value.includes('I have autonomy over')));
  const reservation = getSentenceFeedback('I have reservations on the proposal.', 'en', findWord('a reservation'));
  assert.ok(reservation.suggestions.some(value => value.includes('“reservations about…”')));
  const booking = getSentenceFeedback('I have reservations on Friday.', 'en', findWord('a reservation'));
  assert.ok(!booking.suggestions.some(value => value.includes('usual pattern')));
  const norwegian = getSentenceFeedback('Vi tilrettelegger til ulike behov.', 'no', findWord('å tilrettelegge'));
  assert.ok(norwegian.suggestions.some(value => value.includes('tilrettelegge for ulike behov')));
  const otherMeaning = getSentenceFeedback('Vi må tilrettelegge til eksamen.', 'no', findWord('å tilrettelegge'));
  assert.ok(!otherMeaning.suggestions.some(value => value.includes('relationship explicit')));
});

test('every curated vocabulary item receives metadata-specific practice guidance', () => {
  for (const language of ['en', 'no']) for (const word of vocabulary(language)) {
    const feedback = getSentenceFeedback(word.example, language, word);
    assert.equal(feedback.example, word.example);
    assert.ok(feedback.suggestions.some(value => value.includes(word.collocation)));
    assert.equal(feedback.questions.length, 1);
    assert.ok(!/your sentence is correct|correct grammar|perfect sentence/iu.test(JSON.stringify(feedback)));
  }
});
