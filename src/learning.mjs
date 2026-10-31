import { lessons } from './content.mjs';

const DAY = 86_400_000;
const ANCHOR_DAY = Date.UTC(2026, 9, 31) / DAY;
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Oslo', year: 'numeric', month: '2-digit', day: '2-digit',
});

/** Calendar dates use Oslo time, independently of a learner's device timezone. */
export function localDateKey(date = new Date()) {
  const parts = Object.fromEntries(dateFormatter.formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function dayNumber(dateKey) {
  if (typeof dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new RangeError('Expected a calendar date in YYYY-MM-DD format.');
  }
  const instant = new Date(`${dateKey}T00:00:00Z`);
  if (Number.isNaN(instant.getTime()) || instant.toISOString().slice(0, 10) !== dateKey) {
    throw new RangeError('Invalid calendar date.');
  }
  return instant.getTime() / DAY;
}

export function getLesson(dateKey = localDateKey()) {
  const offset = dayNumber(dateKey) - ANCHOR_DAY;
  return lessons[((offset % lessons.length) + lessons.length) % lessons.length];
}

/** Punctuation does not count as words; compounds and contractions stay together. */
export function countWords(text = '') {
  return String(text).match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Match complete vocabulary items, allowing common inflections, not substrings. */
function containsWord(text, term, language) {
  const isVerb = /^(to |å )/iu.test(term);
  const base = term.replace(/^(?:a |an |the |to |en |et |ei |å )/iu, '').trim();
  if (!base) return false;
  let pattern = escapeRegExp(base);
  if (isVerb && base.endsWith('e')) {
    const stem = escapeRegExp(base.slice(0, -1));
    pattern = language === 'no' ? `${stem}(?:e|er|et|te|de|t|ende)` : `${stem}(?:e|es|ed|ing)`;
  } else if (isVerb) {
    pattern += language === 'no' ? '(?:r|er|et|te|de|t)?' : '(?:s|ed|ing)?';
  } else {
    pattern += language === 'no' ? '(?:en|et|er|ene|a|s)?' : '(?:s)?';
  }
  return new RegExp(`(?<![\\p{L}\\p{N}])${pattern}(?![\\p{L}\\p{N}])`, 'iu').test(text);
}

/**
 * A deterministic writing checklist. It does not assess grammar, factual accuracy,
 * intended meaning, argument quality, or pronunciation, and never claims to.
 */
export function getGuidedFeedback(text, kind, language, words = []) {
  const draft = String(text ?? '').trim();
  const wordCount = countWords(draft);
  const norwegian = language === 'no';
  const usedWords = [...new Set(words.filter(word =>
    word && typeof word.term === 'string' && containsWord(draft, word.term, language),
  ).map(word => word.term))];
  const strengths = [];
  const suggestions = [];
  const questions = [];
  const sentences = draft.split(/[.!?]+/u).filter(sentence => countWords(sentence) > 0);
  const summary = norwegian
    ? 'En veiledet sjekkliste, ikke en vurdering av grammatikk eller mening. Bruk spørsmålene til å forbedre ditt eget utkast.'
    : 'A guided checklist, not a grammar or meaning assessment. Use the questions to revise your own draft.';

  if (wordCount === 0) {
    suggestions.push(norwegian ? 'Skriv et første utkast før du bruker sjekklisten.' : 'Write a first draft before using the checklist.');
    return { source: 'guided', summary, strengths, suggestions, questions, usedWords, wordCount };
  }
  strengths.push(norwegian ? `Du har skrevet et utkast på ${wordCount} ord.` : `You have written a draft of ${wordCount} words.`);
  if (usedWords.length) {
    strengths.push(norwegian ? `Disse øvingsordene finnes i utkastet: ${usedWords.join(', ')}.` : `These practice expressions appear in your draft: ${usedWords.join(', ')}.`);
  } else if (words.length) {
    suggestions.push(norwegian ? 'Prøv å bruke ett av øvingsordene der det passer naturlig.' : 'Try using one practice expression where it fits naturally.');
  }
  if (wordCount < 60) {
    suggestions.push(norwegian ? 'Utvid gjerne teksten med en konkret detalj eller et eksempel. Sikt mot 60–120 ord.' : 'Add a concrete detail or example if it helps your meaning. Aim for 60–120 words.');
  } else if (wordCount > 180) {
    suggestions.push(norwegian ? 'Se om du kan fjerne gjentakelser og beholde hovedpoenget i 60–120 ord.' : 'Look for repetitions you can remove while keeping your main point in 60–120 words.');
  }
  if (sentences.some(sentence => countWords(sentence) > 35)) {
    suggestions.push(norwegian ? 'Minst én setning har over 35 ord. Se om den blir tydeligere når du deler den.' : 'At least one sentence has more than 35 words. Consider splitting it if that makes the meaning clearer.');
  }
  if (kind === 'argument') {
    const reason = norwegian ? /\b(fordi|derfor|ettersom|siden)\b/iu : /\b(because|therefore|since|as a result)\b/iu;
    const contrast = norwegian ? /\b(men|likevel|samtidig|derimot|imidlertid)\b/iu : /\b(but|however|although|while|nevertheless)\b/iu;
    if (reason.test(draft)) strengths.push(norwegian ? 'Teksten inneholder et ord som kan knytte en grunn til et standpunkt.' : 'Your draft includes a connector that can link a reason to a position.');
    else suggestions.push(norwegian ? 'Gjør sammenhengen tydelig: Hva er grunnen til standpunktet ditt?' : 'Make the link explicit: what is the reason for your position?');
    if (!contrast.test(draft)) suggestions.push(norwegian ? 'Vurder et motargument eller en betingelse som begrenser standpunktet ditt.' : 'Consider an opposing view or a condition that limits your position.');
    questions.push(norwegian ? 'Hvilken konkret påstand vil du at leseren skal forstå?' : 'What exact claim do you want the reader to understand?');
    questions.push(norwegian ? 'Hvilket eksempel støtter påstanden, og når gjelder den ikke?' : 'Which example supports your claim, and when might it not apply?');
  } else {
    const sequence = norwegian ? /\b(først|senere|etterpå|plutselig|til slutt|da)\b/iu : /\b(first|later|afterward|afterwards|suddenly|eventually|finally|then)\b/iu;
    if (sequence.test(draft)) strengths.push(norwegian ? 'Teksten inneholder et tidsuttrykk som kan hjelpe leseren å følge hendelsene.' : 'Your draft includes a time expression that can help a reader follow the events.');
    else suggestions.push(norwegian ? 'Se om tidsuttrykk kan gjøre rekkefølgen på hendelsene tydeligere.' : 'Consider whether a time expression would make the sequence of events clearer.');
    questions.push(norwegian ? 'Hva forandret seg mellom starten og slutten?' : 'What changed between the beginning and the end?');
    questions.push(norwegian ? 'Hvilken konkret handling eller detalj viser hvorfor opplevelsen betydde noe?' : 'Which concrete action or detail shows why the experience mattered?');
  }
  return { source: 'guided', summary, strengths, suggestions, questions, usedWords, wordCount };
}

/**
 * Simple local spaced review: again = tomorrow; good = 1, 2, 4... days;
 * easy = at least 3 days. A word is due on its due date, not after it.
 */
export function scheduleReview(previous, rating, nowDateKey = localDateKey()) {
  const today = dayNumber(nowDateKey);
  if (!['again', 'good', 'easy'].includes(rating)) throw new RangeError('Unknown review rating.');
  const oldInterval = Number.isFinite(previous?.interval) ? Math.max(0, previous.interval) : 0;
  const oldRepetitions = Number.isInteger(previous?.repetitions) ? Math.max(0, previous.repetitions) : 0;
  const interval = rating === 'again' ? 1 : rating === 'easy'
    ? Math.min(180, Math.max(3, Math.round(oldInterval * 2.5)))
    : Math.min(180, Math.max(1, Math.round(oldInterval * 2)));
  return {
    interval,
    due: new Date((today + interval) * DAY).toISOString().slice(0, 10),
    repetitions: rating === 'again' ? 0 : oldRepetitions + 1,
  };
}
