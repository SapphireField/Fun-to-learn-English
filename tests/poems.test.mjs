import test from 'node:test';
import assert from 'node:assert/strict';
import { poems, getDailyPoem } from '../src/poems.mjs';

test('reading shelf has seven credited original public-domain poems per language', () => {
  assert.equal(new Set(poems.map(poem => poem.id)).size, poems.length);
  for (const language of ['en', 'no']) {
    assert.equal(poems.filter(poem => poem.language === language).length, 7);
  }
  for (const poem of poems) {
    assert.ok(poem.title && poem.author && poem.context && poem.readingPrompt);
    assert.ok(poem.year < 1931);
    assert.ok(Number(poem.authorDates.split('–')[1]) < 1955);
    assert.equal(typeof poem.excerpt, 'boolean');
    assert.ok(poem.lines.length >= 3 && poem.lines.some(line => line.trim()));
    assert.ok(poem.source.label && new URL(poem.source.url).protocol === 'https:');
    assert.ok(poem.glossary.length >= 2 && poem.glossary.every(item => item.term && item.meaning));
    if (poem.language === 'no') assert.match(poem.context, /Historical.*not a model for modern Bokmål/);
  }
});

test('daily reading rotates independently for both languages and wraps weekly', () => {
  for (const language of ['en', 'no']) {
    const week = Array.from({ length: 7 }, (_, i) => getDailyPoem(`2026-11-0${i + 1}`, language));
    assert.equal(new Set(week.map(poem => poem.id)).size, 7);
    assert.ok(week.every(poem => poem.language === language));
    assert.equal(getDailyPoem('2026-10-31', language), getDailyPoem('2026-11-07', language));
    assert.equal(getDailyPoem('2026-10-30', language), getDailyPoem('2026-11-06', language));
    assert.equal(getDailyPoem('2026-11-01', language), getDailyPoem('2026-11-01', language));
  }
  assert.notEqual(getDailyPoem('2026-10-31', 'en').id, getDailyPoem('2026-10-31', 'no').id);
});

test('daily reading rejects malformed and impossible dates and unknown languages', () => {
  for (const date of ['2026-02-29', '2026-04-31', '2026-1-01', 'tomorrow', '', null]) {
    assert.throws(() => getDailyPoem(date, 'en'), RangeError);
  }
  assert.ok(getDailyPoem('2028-02-29', 'no'));
  assert.throws(() => getDailyPoem('2026-10-31', 'fr'), RangeError);
});

test('historical original lines are kept separate from explanatory glosses', () => {
  const original = poems.find(poem => poem.id === 'no-jeg-ser');
  assert.deepEqual(original.lines.slice(0, 3), [
    'Jeg ser paa den hvide himmel,',
    'jeg ser paa de graablaa skyer,',
    'jeg ser paa den blodige sol.',
  ]);
  assert.ok(original.glossary.some(item => item.meaning.includes('på / gråblå')));
  assert.equal(poems.find(poem => poem.id === 'en-rain').excerpt, false);
  assert.equal(poems.find(poem => poem.id === 'en-hope').excerpt, false);
  assert.equal(poems.find(poem => poem.id === 'no-bergmanden').excerpt, true);
  assert.equal(original.lines.at(-1), 'Her er saa underligt. . . .');
});

test('daily shelf prioritizes complete poems and preserves stanza divisions', () => {
  const complete = poems.filter(poem => !poem.excerpt);
  assert.equal(poems.filter(poem => poem.language === 'en' && poem.excerpt).length, 0);
  assert.ok(complete.length >= 11);
  for (const poem of complete.filter(poem => poem.lines.length > 4)) {
    assert.ok(poem.lines.includes(''), `${poem.title} should keep its stanza breaks`);
    assert.match(poem.context, /complete/i);
  }
  const hope = poems.find(poem => poem.id === 'en-hope');
  assert.equal(hope.lines.filter(Boolean).length, 12);
  assert.equal(hope.lines.at(-1), 'It asked a crumb of me.');
  assert.equal(poems.find(poem => poem.id === 'no-borte').lines.at(-1), 'og nu er hun borte.');
});
