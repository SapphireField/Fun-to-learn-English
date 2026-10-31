import { countWords } from './learning.mjs';

const normalize = value => String(value ?? '').normalize('NFC')
  .replace(/[‘’]/gu, "'").replace(/[‐‑]/gu, '-');
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const bareTerm = term => normalize(term).trim().replace(/^(?:a|an|the|to|en|et|ei|å)\s+/iu, '');

// These are forms of the six Norwegian verbs in the curated vocabulary shelf,
// not a grammar engine. Other expressions use conservative suffix matching.
const norwegianVerbs = {
  tilrettelegge: ['tilrettelegge', 'tilrettelegger', 'tilrettela', 'tilrettelagt'],
  underbygge: ['underbygge', 'underbygger', 'underbygget', 'underbygde', 'underbygd'],
  undergrave: ['undergrave', 'undergraver', 'undergravde', 'undergravet', 'undergravd'],
  revurdere: ['revurdere', 'revurderer', 'revurderte', 'revurdert'],
  oppveie: ['oppveie', 'oppveier', 'oppveide', 'oppveid'],
  etterprøve: ['etterprøve', 'etterprøver', 'etterprøvde', 'etterprøvet', 'etterprøvd'],
};
const norwegianAdjectives = {
  bevisst: ['bevisst', 'bevisste'],
  gjennomførbar: ['gjennomførbar', 'gjennomførbart', 'gjennomførbare'],
  troverdig: ['troverdig', 'troverdige'],
  foreløpig: ['foreløpig', 'foreløpige'],
};

/** Finds an expression or a common inflection; it does not validate its usage. */
export function containsTargetExpression(text, term, language) {
  const normalizedTerm = normalize(term).trim();
  const base = bareTerm(normalizedTerm).toLocaleLowerCase();
  if (!base) return false;
  const isVerb = /^(?:to|å)\s+/iu.test(normalizedTerm);
  let forms;
  if (language === 'no' && isVerb) {
    forms = norwegianVerbs[base] ?? [base, `${base}r`];
  } else if (language === 'no' && norwegianAdjectives[base]) {
    forms = norwegianAdjectives[base];
  } else if (language !== 'no' && isVerb) {
    const stem = base.endsWith('e') ? base.slice(0, -1) : base;
    const thirdPerson = /(?:s|sh|ch|x|z|o)$/u.test(base) ? `${base}es` : `${base}s`;
    forms = [base, thirdPerson, `${stem}ed`, `${stem}ing`];
  } else if (base === 'trade-off' && language !== 'no') {
    // Both spellings are nouns. “Trade off” with a space is a different construction.
    forms = ['trade-off', 'trade-offs', 'tradeoff', 'tradeoffs'];
  } else if (base === 'sense of belonging' && language !== 'no') {
    forms = ['sense of belonging', 'senses of belonging'];
  } else if (base === 'handlingsrom' && language === 'no') {
    forms = ['handlingsrom', 'handlingsrommet', 'handlingsrommene'];
  } else {
    // English adjectives and uncountable nouns in this shelf have no article;
    // do not invent plural forms such as “autonomys” or “credibles.”
    const endings = language === 'no' ? ['', 'en', 'et', 'er', 'ene', 'a', 's']
      : /^(?:a|an|the)\s+/iu.test(normalizedTerm) ? ['', 's'] : [''];
    forms = endings.map(ending => `${base}${ending}`);
  }
  const pattern = forms.map(form => escapeRegExp(form).replace(/\s+/gu, '\\s+')).join('|');
  return new RegExp(`(?<![\\p{L}\\p{N}_])(?:${pattern})(?![\\p{L}\\p{N}_])`, 'iu')
    .test(normalize(text));
}

function reflectionQuestion(term, meaning) {
  const base = bareTerm(term).toLocaleLowerCase();
  const prompts = {
    'trade-off': 'Which two benefits or priorities are being balanced in your sentence?',
    avveining: 'Which two considerations are being weighed against each other in your sentence?',
    autonomy: 'Which specific decisions can the person make independently in your example?',
    handlingsrom: 'What can the person actually choose or change in your example?',
    substantiate: 'What claim is being supported, and what evidence or example supports it?',
    underbygge: 'What claim is being supported, and what evidence or example supports it?',
    outweigh: 'Which two factors are you comparing, and which matters more?',
    oppveie: 'Which benefit balances or makes up for which drawback?',
    prerequisite: 'What must be in place before the other activity or result is possible?',
    forutsetning: 'Does your sentence mean a necessary condition or an assumption? Make that distinction clear.',
  };
  return prompts[base] ?? `What specific situation in your sentence illustrates “${term}”?${meaning ? ` Compare it with the meaning: ${meaning}` : ''}`;
}

/**
 * Offline sentence coaching: observable mechanics plus curated usage prompts.
 * It cannot establish grammatical correctness, naturalness, or intended meaning.
 * The reference example is never presented as a rewrite of the learner's text.
 */
export function getSentenceFeedback(text, language, word) {
  const draft = normalize(text).trim();
  const term = typeof word?.term === 'string' ? word.term : '';
  const base = bareTerm(term).toLocaleLowerCase();
  const wordCount = countWords(draft);
  const usedWords = containsTargetExpression(draft, term, language) ? [term] : [];
  const strengths = [];
  const suggestions = [];
  const questions = [];
  const result = {
    source: 'guided',
    summary: 'Guided sentence check: observable details and usage prompts, not a grammar or meaning verdict.',
    strengths, suggestions, questions, usedWords, wordCount,
    example: typeof word?.example === 'string' ? word.example : '',
    collocation: typeof word?.collocation === 'string' ? word.collocation : '',
    tip: typeof word?.tip === 'string' ? word.tip : '',
  };
  if (!wordCount) {
    suggestions.push(term ? `Write a sentence of your own using “${term}”, then compare it with the reference example.` : 'Write a sentence of your own before using the guided check.');
    return result;
  }

  if (usedWords.length) {
    strengths.push(`Your example contains “${term}” or a common inflection of it.`);
  } else if (term) {
    suggestions.push(`I did not find “${term}” or its common inflections. Try including it if it fits what you mean; this check may miss unusual forms.`);
  }

  // Quoted passages and code may intentionally preserve lowercase or punctuation.
  const quotedOrCode = /^["'“”‘’«»`]/u.test(String(text ?? '').trim());
  if (!quotedOrCode) {
    const first = draft.match(/^[([{]*([\p{L}])/u)?.[1];
    if (first && first !== first.toLocaleUpperCase() && first === first.toLocaleLowerCase()) {
      suggestions.push(`If this is a standalone sentence, start “${first}” with a capital letter.`);
    }
    if (!/[.!?…](?:["'”’»)\]]+)?$/u.test(draft)) {
      suggestions.push('If this is a complete sentence, add a final period, question mark, or exclamation mark.');
    } else {
      strengths.push('Your example ends with sentence punctuation.');
    }
  }

  if (wordCount < 3) {
    suggestions.push('A short sentence can work. To practise the meaning, add one concrete detail about who, what, or why.');
  }
  if (draft.split(/[.!?]+/u).some(sentence => countWords(sentence) > 35)) {
    suggestions.push('One sentence has more than 35 words. Consider splitting it if that would make the idea easier to follow.');
  }

  if (!quotedOrCode && language === 'en' && base === 'autonomy' && /\bi(?:\s+am|'m)\s+autonomy\b/iu.test(draft)) {
    suggestions.push('In ordinary descriptions, “autonomy” names freedom to decide. If you mean you have that freedom, compare “I have autonomy over…”; for a personal quality, compare “I am autonomous.”');
  }
  if (!quotedOrCode && language === 'en' && base === 'reservation' && /\breservations?\s+on\s+(?:the\s+)?(?:proposal|plan|idea|cost|decision|approach|project|policy)\b/iu.test(draft)) {
    suggestions.push('For doubts about a plan or proposal, “reservations about…” is the usual pattern. “On” can express something else, so compare the meaning with the reference example.');
  }
  if (!quotedOrCode && language === 'no' && base === 'tilrettelegge' && /\btilrettelegg(?:e|er)\s+til\s+(?:ulike|forskjellige|spesielle|individuelle)\s+behov\b/iu.test(draft)) {
    suggestions.push('When you mean making arrangements for needs, compare “tilrettelegge for ulike behov.” Here “for” makes that relationship explicit.');
  }

  if (result.collocation) {
    suggestions.push(`Compare your wording with the reference pattern “${result.collocation}”. It is a useful pattern, not the only possible construction.`);
  }
  if (term) questions.push(reflectionQuestion(term, typeof word?.meaning === 'string' ? word.meaning : ''));
  return result;
}
