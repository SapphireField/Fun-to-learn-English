import { languages, lessons } from './content.mjs';
import { localDateKey, getLesson, countWords, getGuidedFeedback, scheduleReview } from './learning.mjs';
import { loadState, saveState, ensureDay, completedSteps, recordingStore } from './storage.mjs';
import { getDailyPoem } from './poems.mjs';

const app = document.querySelector('#app');
const browserStorage = { getItem: key => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value) };
const state = loadState(browserStorage);
let today = localDateKey();
function setDailyLanguage() {
  if (state.selectedOn !== today) {
    state.language = Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.UTC(2026, 9, 31)) / 86400000) % 2 === 0 ? 'en' : 'no';
    state.selectedOn = today;
  }
}
setDailyLanguage();
let route = location.hash.slice(1) || 'today';
let reviewMode = false;
let feedback = null;
let feedbackBusy = false;
let aiStatus = { aiAvailable: false, provider: null };
let recorder;
let recordingSession = null;
let recordingGeneration = 0;
let recordingLoadGeneration = 0;
let recordingNotice = null;
let recordingUrl = null;
let speakingSource = 'model';
let storageOK = true;
let voiceList = [];
let speechNotice = '';
const allWords = lessons.flatMap(l => ['en', 'no'].flatMap(lang => l[lang].words.map(w => ({ ...w, language: lang }))));
const e = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const paths = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  book: '<path d="M12 5v16M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>',
  pen: '<path d="m15 5 4 4M4 20l5-1L21 7a3 3 0 0 0-4-4L5 15Z"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/>',
  chart: '<path d="M4 3v17h17M8 15v-4m5 4V6m5 9V9"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  sound: '<path d="m11 4-6 5H2v6h3l6 5Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m10 3-1 3-3 1-3 3 2 2-1 4 3 2 3-1 2 4 3-1 1-3 4-1 1-3-3-2V7l-4-1-1-3Z"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  repeat: '<path d="m17 2 4 4-4 4M3 10V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14 0v2a2 2 0 0 1-2 2H3"/>',
  leaf: '<path d="M20 3c-1 5 3 11-5 15-5 3-11-1-9-6 2-5 8-4 14-9ZM3 22 16 9"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
const language = () => languages.find(l => l.id === state.language);
const lesson = () => getLesson(today);
const content = () => lesson()[state.language];
const dailyPoem = () => getDailyPoem(today, state.language);
const day = () => ensureDay(state, today, state.language);
const dayKey = () => `${today}-${state.language}`;
const dueWords = () => allWords.filter(w => w.language === state.language && state.reviews[w.id]?.due <= today);
const learnedWords = () => allWords.filter(w => w.language === state.language && state.reviews[w.id]);
function persist() {
  storageOK = saveState(browserStorage, state);
  const warning = document.querySelector('#storage-warning');
  if (warning) warning.hidden = storageOK;
  return storageOK;
}
function announce(message) { document.querySelector('#announcer').textContent = message; }
function go(target) {
  if (recorder?.state === 'recording') { announce('Stop your recording before leaving this exercise.'); return; }
  if (location.hash === `#${target}`) render(); else location.hash = target;
}
function dateLabel(date = today, options = { weekday: 'long', month: 'long', day: 'numeric' }) {
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'Europe/Oslo' }).format(new Date(`${date}T12:00:00Z`));
}
function navItem(target, label, name, active) {
  return `<a href="#${target}" class="nav-item ${active ? 'active' : ''}" ${active ? 'aria-current="page"' : ''}>${icon(name)}<span>${label}</span>${target === 'vocabulary' && dueWords().length ? `<span class="nav-count">${dueWords().length}</span>` : ''}</a>`;
}
function shell() {
  const done = completedSteps(day());
  return `<a class="skip-link" href="#main">Skip to practice</a>
  <aside class="sidebar">
    <a href="#today" class="brand" aria-label="Mellom home"><span class="brand-mark">m</span>mellom<span class="brand-dot">.</span></a>
    <div class="brand-caption">A little practice. A clearer voice.</div>
    <div class="nav-label">YOUR SPACE</div>
    <nav aria-label="Main navigation">
      ${navItem('today', 'Today’s practice', 'sun', route === 'today' || route === 'poem')}
      ${navItem('vocabulary', 'My vocabulary', 'book', route === 'vocabulary')}
      ${navItem('argument', 'Writing studio', 'pen', ['argument', 'story'].includes(route))}
      ${navItem('speaking', 'Speaking practice', 'mic', route === 'speaking')}
      ${navItem('progress', 'My progress', 'chart', route === 'progress')}
    </nav>
    <div class="sidebar-bottom">
      <div class="daily-meter"><div class="meter-label">${icon('leaf')}<span>A little, every day</span></div><p>${done === 4 ? 'Today’s practice is complete.' : 'Small steps make your voice stronger.'}</p><div class="meter-track"><span style="width:${done * 25}%"></span></div><div class="meter-caption">${done} of 4 activities completed</div></div>
      <button class="settings-link" data-action="settings">${icon('settings')} Preferences & data</button>
      <div class="local-note"><span class="status-dot"></span> Your progress stays on this device</div>
    </div>
  </aside>
  <div class="workspace"><header class="topbar"><div class="breadcrumb">Your daily language space <span>/</span> <strong>${({ today: 'Overview', vocabulary: 'Vocabulary', argument: 'Writing', story: 'Writing', speaking: 'Speaking', progress: 'Progress', poem: 'Daily poem' })[route]}</strong></div>
    <div class="topbar-actions"><div class="language-switch" role="group" aria-label="Practice language">${languages.map(l => `<button data-action="language" data-language="${l.id}" class="${state.language === l.id ? 'selected' : ''}" aria-pressed="${state.language === l.id}"><span class="flag ${l.id}" aria-hidden="true">${l.id === 'en' ? '🇺🇸' : '🇳🇴'}</span>${l.name}</button>`).join('')}</div><button class="icon-button mobile-preferences" data-action="settings" aria-label="Preferences">${icon('settings')}</button></div>
  </header><main id="main" tabindex="-1"><div id="storage-warning" class="notice error" role="alert" ${storageOK ? 'hidden' : ''}>Your browser could not save your progress. Export your writing in Preferences before closing this tab.</div><div id="page"></div></main>
  <footer class="page-footer"><span>Find your words. Make them yours.</span><span>${state.language === 'en' ? 'American English' : 'Norwegian Bokmål · Oslo pronunciation'}</span></footer></div>
  <dialog id="preferences" aria-labelledby="preferences-title"></dialog>`;
}
function heading(eyebrow, title, subtitle, extra = '') {
  return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div>${extra}</div>`;
}
function dailyArt() {
  return `<div class="hero-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><span class="art-star">✳</span><div class="word-slip"><span class="slip-label">BETTER WORDS, DEEPER THOUGHTS</span><span class="slip-word">${state.language === 'en' ? 'a fresh perspective' : 'et nytt perspektiv'}</span><span class="slip-meaning">A different way of seeing things.</span><div class="slip-line"></div><div class="slip-line short"></div></div><div class="voice-slip">${icon('sound')}<div class="wave">${[9, 18, 26, 15, 33, 42, 24, 35, 17, 28, 12, 20, 9].map(h => `<i style="height:${h}px"></i>`).join('')}</div><span>Your voice, with confidence.</span></div><span class="art-dot"></span></div>`;
}
function activityCard(kind, n, title, description, time, name, tint, complete) {
  return `<button class="activity-card ${tint}" data-action="go" data-route="${kind}"><div class="activity-top"><span class="activity-icon">${icon(name)}</span><span class="step-number">${complete ? icon('check') : `0${n}`}</span></div><h3>${title}</h3><p>${description}</p><div class="activity-bottom"><span>${icon('clock')}${time} min</span><span class="round-arrow">${icon('arrow')}</span></div></button>`;
}
function todayPage() {
  const c = content(), d = day(), done = completedSteps(d);
  const first = d.words.length < 3 ? 'vocabulary' : !d.argument.complete ? 'argument' : !d.story.complete ? 'story' : 'speaking';
  return `${heading(dateLabel().toUpperCase(), 'Find the words.<br class="mobile-break"> Own the conversation.', 'A little more precise. A little more confident. Every day.', `<span class="practice-pill">${icon('clock')}15–20 min for yourself</span>`)}
  <section class="hero"><div class="hero-copy"><div class="hero-eyebrow"><span></span> TODAY’S FOCUS <span class="hero-category">${e(lesson().category)}</span></div><h2>${e(c.title)}</h2><p>${e(c.description)}</p><button class="button primary" data-action="go" data-route="${first}">${done === 4 ? 'Revisit today’s practice' : done ? 'Continue my practice' : 'Start my practice'}${icon('arrow')}</button><div class="hero-meta"><span>${icon('book')}3 useful expressions</span><span>${icon('mic')}Your ideas, out loud</span></div></div>${dailyArt()}</section>
  ${poemPreview()}
  <div class="section-heading"><div><span class="eyebrow">MAKE IT A DAILY HABIT</span><h2>Your practice, one step at a time</h2></div><span class="subtle">${done} / 4 complete</span></div>
  <section class="activity-grid" aria-label="Today’s activities">
    ${activityCard('vocabulary', 1, 'Find better words', 'Go beyond everyday vocabulary. Learn expressions you’ll actually use.', 3, 'book', 'sage', d.words.length >= 3)}
    ${activityCard('argument', 2, 'Make your point', 'Turn a thought into a clear, convincing argument. There’s room for nuance.', 5, 'pen', 'peach', d.argument.complete)}
    ${activityCard('story', 3, 'Tell your story', 'Bring an experience to life. Make your meaning felt, not just understood.', 5, 'spark', 'lavender', d.story.complete)}
  </section>
  <section class="speaking-banner"><span class="speaking-icon">${icon('mic')}</span><div><span class="eyebrow">THEN, SAY IT OUT LOUD</span><h3>Give your words a voice.</h3><p>Listen, record, and find your natural rhythm.</p></div><button class="button outline" data-action="go" data-route="speaking">${d.speaking ? 'Practise again' : 'Practise speaking'}${icon('arrow')}</button></section>
  <div class="dashboard-bottom"><section class="week-card"><div class="section-heading small"><h3>A little consistency goes a long way.</h3><span>This week</span></div>${weekStrip()}</section><aside class="tip-card"><span class="tip-symbol">“</span><p>You don’t need bigger words.<br>You need the <em>right</em> ones.</p><span>YOUR DAILY REMINDER</span></aside></div>`;
}
function poemPreview() {
  const poem = dailyPoem();
  return `<section class="daily-poem-preview" aria-labelledby="daily-poem-heading"><div class="poem-preview-copy"><span class="eyebrow">A CLASSIC, JUST FOR FUN</span><h2 id="daily-poem-heading">${e(poem.title)}</h2><p>${e(poem.author)} · ${e(poem.year)}${poem.excerpt ? ' · An excerpt' : ''}</p></div><blockquote class="poem-preview-lines" lang="${poem.language === 'en' ? 'en' : 'no'}">${poem.lines.filter(Boolean).slice(0, 2).map(line => `<span>${e(line)}</span>`).join('')}</blockquote><button class="button outline" data-action="go" data-route="poem">Read today’s poem${icon('arrow')}</button></section>`;
}
function poemPage() {
  const poem = dailyPoem();
  const stanzas = poem.lines.join('\n').split(/\n\s*\n/);
  return `${heading('A MOMENT FOR THE JOY OF WORDS', 'A poem for today.', 'A short classic to enjoy, reflect on, and read aloud. A new selection each day.')}
  <div class="poem-reading-layout"><article class="poem-reading-card" aria-labelledby="poem-title"><span class="tag">${poem.language === 'en' ? 'English classic' : 'Norwegian classic'}${poem.excerpt ? ' · Excerpt' : ''}</span><h2 id="poem-title">${e(poem.title)}</h2><p class="poem-byline">${e(poem.author)} (${e(poem.authorDates)}) · ${e(poem.year)}</p><div class="poem-text" lang="${poem.language === 'en' ? 'en' : 'no'}">${stanzas.map(stanza => `<p>${stanza.split('\n').map(line => `<span>${e(line)}</span>`).join('')}</p>`).join('')}</div><div class="poem-reading-actions"><button class="button primary" data-action="listen-poem">${icon('sound')}Listen to the poem</button><button class="button outline" data-action="practise-poem">${icon('mic')}Read it aloud myself</button></div><p id="speech-notice" class="helper-text" role="status">Listening uses a voice available on your device. You can also enjoy reading silently.</p><p class="poem-credit">Public-domain text${poem.excerpt ? ', excerpted from the original' : ''}. Source: <a href="${e(poem.source.url)}" target="_blank" rel="noopener noreferrer">${e(poem.source.label)}</a>.</p></article>
  <aside class="poem-reading-notes"><section class="support-card poem-context"><span class="eyebrow">A LITTLE CONTEXT</span><h3>Read for pleasure.</h3><p>${e(poem.context)}</p></section><section class="support-card"><span class="eyebrow">SOMETHING TO THINK ABOUT</span><h3>${e(poem.readingPrompt)}</h3><p class="support-note">There is no test or right answer. Notice what the words bring to mind.</p></section><section class="support-card"><span class="eyebrow">A FEW WORDS TO EXPLORE</span><dl class="poem-glossary">${poem.glossary.map(word => `<dt>${e(word.term)}</dt><dd>${e(word.meaning)}</dd>`).join('')}</dl></section><button class="text-button" data-action="go" data-route="today">${icon('arrow')}Back to today’s practice</button></aside></div>`;
}
function weekDates() {
  const base = new Date(`${today}T12:00:00Z`);
  const weekday = base.getUTCDay();
  base.setUTCDate(base.getUTCDate() - ((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(base); d.setUTCDate(d.getUTCDate() + i); return d.toISOString().slice(0, 10); });
}
function weekStrip() {
  return `<div class="week-strip">${weekDates().map(date => {
    const entries = ['en', 'no'].map(lang => state.days[`${date}-${lang}`]);
    const practiced = entries.some(d => d && (d.words.length || d.argument.text || d.story.text || d.speaking));
    return `<div class="week-day ${date === today ? 'is-today' : ''} ${practiced ? 'practiced' : ''}" aria-label="${e(dateLabel(date))}: ${practiced ? 'practised' : 'no practice yet'}"><span>${dateLabel(date, { weekday: 'short' }).slice(0, 1)}</span><div>${practiced ? icon('check') : date.slice(-2).replace(/^0/, '')}</div>${date === today ? '<b>Today</b>' : '<b>&nbsp;</b>'}</div>`;
  }).join('')}</div>`;
}
function vocabularyPage() {
  const c = content(), due = dueWords();
  return `${heading('WORDS THAT GO FURTHER', 'A more precise vocabulary.', 'Learn in context. Put it into your own words. Come back to make it stick.')}
  <div class="tab-row" role="group" aria-label="Vocabulary set"><button class="tab ${!reviewMode ? 'active' : ''}" data-action="vocab-tab" data-mode="today">Today’s expressions <span>3</span></button><button class="tab ${reviewMode ? 'active' : ''}" data-action="vocab-tab" data-mode="review">Due for review <span>${due.length}</span></button></div>
  ${reviewMode ? (due.length ? `<p class="section-intro">Try to recall the meaning first. Then reveal the answer and choose how well you remembered.</p><div class="word-grid">${due.map(reviewCard).join('')}</div>` : `<div class="empty-state">${icon('leaf')}<h2>You’re up to date.</h2><p>Learn today’s expressions and they’ll return for a review tomorrow.</p><button class="button primary" data-action="vocab-tab" data-mode="today">Learn today’s words${icon('arrow')}</button></div>`) : `<div class="topic-line"><span class="tag">${e(c.title)}</span><span>Use these in today’s argument and story.</span></div><div class="word-grid">${c.words.map((w, i) => wordCard(w, i)).join('')}</div><div class="next-step"><p>${day().words.length === 3 ? 'Three expressions, ready to put into practice.' : 'Write a sentence for each expression to make it yours.'}</p><button class="button primary" data-action="go" data-route="argument">Put your words to work${icon('arrow')}</button></div>`}
  ${learnedWords().length ? `<section class="collection"><div class="section-heading"><h2>Your growing collection</h2><span>${learnedWords().length} expressions</span></div><div class="collection-list">${learnedWords().map(w => `<div><strong>${e(w.term)}</strong><span>${e(w.meaning)}</span><small>Next review ${e(state.reviews[w.id].due)}</small></div>`).join('')}</div></section>` : ''}`;
}
function wordCard(w, i) {
  const learned = day().words.includes(w.id);
  return `<article class="word-card"><div class="word-card-top"><span class="eyebrow">EXPRESSION 0${i + 1}</span><button class="icon-button" data-action="say-word" data-word="${e(w.id)}" aria-label="Listen to ${e(w.term)}">${icon('sound')}</button></div><h2>${e(w.term)}</h2><span class="pronunciation">${e(w.pronunciation)}</span><p class="word-meaning">${e(w.meaning)}</p><span class="translation">${e(w.translation)}</span><blockquote lang="${state.language === 'en' ? 'en-US' : 'nb-NO'}">${e(w.example)}</blockquote><p class="collocation"><strong>Pairs well with</strong>${e(w.collocation)}</p><details class="word-tip"><summary>Usage & pronunciation note</summary><p>${e(w.tip)}</p></details><label class="input-label" for="sentence-${e(w.id)}">Make it yours: write a sentence</label><textarea id="sentence-${e(w.id)}" class="word-sentence" data-word-sentence="${e(w.id)}" rows="3" maxlength="1000" placeholder="Use this expression in your own words…">${e(day().sentences?.[w.id] || '')}</textarea><button class="button ${learned ? 'learned' : 'outline'} full" data-action="learn-word" data-word="${e(w.id)}">${icon(learned ? 'check' : 'book')}${learned ? 'Added to your vocabulary' : 'Add to my vocabulary'}</button></article>`;
}
function reviewCard(w) {
  return `<article class="word-card review-card"><span class="eyebrow">RECALL BEFORE REVEALING</span><h2>${e(w.term)}</h2><p>What does it mean? Can you use it in a sentence?</p><details><summary class="button outline">Reveal meaning</summary><div class="review-answer"><p>${e(w.meaning)}</p><blockquote>${e(w.example)}</blockquote><button class="text-button" data-action="say-word" data-word="${e(w.id)}">${icon('sound')}Listen</button><div class="review-ratings"><button data-action="rate" data-rating="again" data-word="${e(w.id)}">Again</button><button data-action="rate" data-rating="good" data-word="${e(w.id)}">Got it</button><button data-action="rate" data-rating="easy" data-word="${e(w.id)}">Easy</button></div></div></details></article>`;
}
function writingPage() {
  const kind = route, c = content(), exercise = c[kind], draft = day()[kind], n = countWords(draft.text);
  return `${heading('THINK IT THROUGH. WRITE IT CLEARLY.', 'Your writing studio.', 'A place for thoughtful arguments, memorable stories, and your own voice.')}
  <div class="tab-row"><a class="tab ${kind === 'argument' ? 'active' : ''}" href="#argument">${icon('pen')}Make your point</a><a class="tab ${kind === 'story' ? 'active' : ''}" href="#story">${icon('spark')}Tell your story</a></div>
  <div class="writing-layout"><div class="writing-main"><section class="prompt-card"><span class="eyebrow">${kind === 'argument' ? 'TODAY’S QUESTION' : 'TODAY’S STORY PROMPT'}</span><h2>${e(exercise.prompt)}</h2><div class="prompt-meta"><span>${icon('clock')}About 5 minutes</span><span>Aim for 80–120 words</span></div></section>
  <div class="editor-card"><label for="writing-input" class="editor-label">${kind === 'argument' ? 'Your perspective' : 'Your story'}<span>${language().standard}</span></label><textarea id="writing-input" maxlength="6000" placeholder="${e(exercise.starter)}" spellcheck="true" lang="${state.language === 'en' ? 'en-US' : 'nb-NO'}">${e(draft.text)}</textarea><div class="editor-footer"><span id="save-status">${draft.text ? 'Saved on this device' : 'Your draft saves as you write'}</span><span id="word-count">${n} words</span></div></div>
  <div class="writing-actions"><button class="button primary" data-action="feedback" ${feedbackBusy ? 'disabled' : ''}>${icon('spark')}${feedbackBusy ? 'Reading your draft…' : aiStatus.aiAvailable ? 'Get AI feedback' : 'Check my draft'}</button><button class="button outline" data-action="complete-writing" ${n < 30 ? 'disabled' : ''}>${icon(draft.complete ? 'check' : 'arrow')}${draft.complete ? 'Practice completed' : 'Finish this exercise'}</button></div><p class="helper-text" id="feedback-disclosure">${aiStatus.aiAvailable ? `AI feedback by ${e(aiStatus.provider)}. Your draft is sent only when you request feedback.` : 'Guided checks cover length, structure, and vocabulary use. They do not assess grammar or whether your argument is correct.'} Write at least 30 words to finish.</p>
  <div id="feedback-panel" aria-live="polite">${feedback ? feedbackHTML(feedback) : ''}</div></div>
  <aside class="writing-aside"><section class="support-card"><span class="support-icon">${icon(kind === 'argument' ? 'pen' : 'spark')}</span><h3>${kind === 'argument' ? 'Give your argument shape' : 'Give your story shape'}</h3><ol class="scaffold">${exercise.scaffold.map(s => `<li>${e(s)}</li>`).join('')}</ol><p class="support-note">A little structure helps. Your voice makes it yours.</p></section><section class="support-card word-bank"><span class="eyebrow">WORDS TO WEAVE IN</span>${c.words.map(w => `<div><strong>${e(w.term)}</strong><span>${e(w.meaning)}</span></div>`).join('')}</section></aside></div>`;
}
function feedbackHTML(f) {
  if (f.error) return `<div class="notice error">${e(f.error)}</div>`;
  return `<section class="feedback-card"><span class="eyebrow">${f.source === 'ai' ? 'AI WRITING FEEDBACK' : 'YOUR GUIDED WRITING CHECK'}</span><h2>${e(f.summary)}</h2>${[['What’s working', f.strengths], ['Try this next', f.suggestions], ['Think a little deeper', f.questions]].map(([label, items]) => items?.length ? `<h3>${label}</h3><ul>${items.map(item => `<li>${e(item)}</li>`).join('')}</ul>` : '').join('')}<p class="helper-text">${f.source === 'guided' ? 'These are rule-based prompts for revision, not a grammar or meaning assessment.' : 'AI can misunderstand your intention. Keep the suggestions that express what you mean.'}</p></section>`;
}
function selectedSpeechText() {
  if (speakingSource === 'poem') return dailyPoem().lines.join('\n');
  return speakingSource === 'model' ? content().speaking.text : day()[speakingSource]?.text || content().speaking.text;
}
function speakingPage() {
  const text = selectedSpeechText();
  const poemFocus = ['Pause gently at punctuation and between stanzas.', 'Choose one line and let its most meaningful word stand out.', 'Read for rhythm and enjoyment. Older spelling may differ from the language you practise in daily lessons.'];
  return `${heading('YOUR IDEAS, OUT LOUD', 'Find your natural rhythm.', 'Listen closely. Say it your way. Listen back and try again.')}
  <div class="speaking-layout"><section class="speech-card"><div class="speech-card-header"><span class="tag">${speakingSource === 'poem' ? 'Poetry · read for rhythm' : state.language === 'en' ? 'American English' : 'Oslo pronunciation focus'}</span><label class="sr-only" for="speech-source">Text to practise</label><select id="speech-source"><option value="model" ${speakingSource === 'model' ? 'selected' : ''}>Today’s practice passage</option><option value="poem" ${speakingSource === 'poem' ? 'selected' : ''}>Today’s poem</option>${['argument', 'story'].filter(k => day()[k].text.trim()).map(k => `<option value="${k}" ${speakingSource === k ? 'selected' : ''}>My ${k}</option>`).join('')}</select></div><p class="speech-passage" lang="${state.language === 'en' ? 'en-US' : 'nb-NO'}">${e(text)}</p><div class="speech-controls"><button class="button primary" data-action="listen">${icon('sound')}Listen to the passage</button><label class="speed-label" for="speech-speed">Speed<select id="speech-speed"><option value="0.8">Slow</option><option value="0.95" selected>Natural</option></select></label></div><p id="speech-notice" class="helper-text" role="status">${e(speechNotice || 'Playback uses a voice available on your device. Choose one in Preferences.')}</p><p class="helper-text">${state.language === 'no' ? 'A Norwegian device voice is not guaranteed to use an Oslo dialect. Use the Oslo-focused practice notes alongside it.' : 'An en-US device voice is preferred when available. Voice availability depends on your browser and operating system.'}</p></section>
  <aside class="support-card pronunciation-card"><span class="support-icon">${icon('sound')}</span><h3>Give these a little attention</h3><ul class="focus-list">${(speakingSource === 'poem' ? poemFocus : content().speaking.focus).map(f => `<li>${icon('check')}<span>${e(f)}</span></li>`).join('')}</ul><p class="support-note">Aim for clear and comfortable. You don’t need to erase your own accent.</p></aside></div>
  <section class="recorder-card"><div class="recording-heading"><div><span class="eyebrow">LISTEN TO YOURSELF</span><h2>Your turn to say it.</h2><p>Record the passage or explain the idea in your own words.</p></div><span class="privacy-badge">Saved only on this device</span></div><div class="recording-controls"><button class="record-button" id="record-button" data-action="record">${icon('mic')}Start recording</button><span id="recording-time" role="timer">0:00</span><span id="recording-status" role="status">Your microphone stays off until you start.</span></div><div id="recording-playback"></div><p class="helper-text">Listen for the sounds and rhythm in today’s notes. This version does not score pronunciation or assess your accent. Microphone access requires HTTPS or localhost.</p><button class="button outline" data-action="complete-speaking">${icon(day().speaking ? 'check' : 'arrow')}${day().speaking ? 'Speaking practice completed' : 'I’ve listened and practised'}</button></section>`;
}
function progressPage() {
  const langEntries = Object.entries(state.days).filter(([key]) => key.endsWith(`-${state.language}`));
  const practiced = langEntries.filter(([, d]) => d.words.length || d.argument.text || d.story.text || d.speaking);
  const drafts = langEntries.flatMap(([key, d]) => ['argument', 'story'].filter(k => d[k].text.trim()).map(kind => ({ date: key.slice(0, 10), kind, ...d[kind] }))).sort((a, b) => b.date.localeCompare(a.date));
  return `${heading('SMALL STEPS, REAL PROGRESS', 'Look how far your words go.', 'Your vocabulary, your writing, and the days you showed up.')}
  <div class="stat-grid">${[[learnedWords().length, 'Expressions learned', 'book'], [practiced.length, 'Days with practice', 'sun'], [drafts.filter(d => d.complete).length, 'Writing exercises finished', 'pen'], [langEntries.filter(([, d]) => d.speaking).length, 'Speaking sessions', 'mic']].map(([n, label, name]) => `<section class="stat-card">${icon(name)}<strong>${n}</strong><span>${label}</span></section>`).join('')}</div>
  <section class="week-card progress-week"><div class="section-heading small"><h2>Your week at a glance</h2><span>Both languages · Oslo time</span></div>${weekStrip()}</section>
  <div class="section-heading"><h2>Your writing journal</h2><button class="text-button" data-action="export">${icon('download')}Export my practice</button></div>
  ${drafts.length ? `<div class="journal-list">${drafts.map(d => `<details class="journal-entry"><summary><span class="journal-icon">${icon(d.kind === 'argument' ? 'pen' : 'spark')}</span><span><strong>${e(getLesson(d.date)[state.language].title)}</strong><small>${e(dateLabel(d.date))} · ${d.kind === 'argument' ? 'Argument' : 'Story'} · ${countWords(d.text)} words</small></span><span class="tag">${d.complete ? 'Complete' : 'Draft'}</span>${icon('chevron')}</summary><div class="journal-text" lang="${state.language === 'en' ? 'en-US' : 'nb-NO'}">${e(d.text)}</div></details>`).join('')}</div>` : `<div class="empty-state">${icon('pen')}<h2>Your first page is waiting.</h2><p>Write a little today. In a week, you’ll have something to look back on.</p><button class="button primary" data-action="go" data-route="argument">Write my first argument${icon('arrow')}</button></div>`}`;
}
function render() {
  recordingLoadGeneration++;
  if (recordingUrl) { URL.revokeObjectURL(recordingUrl); recordingUrl = null; }
  if (!['today', 'vocabulary', 'argument', 'story', 'speaking', 'progress', 'poem'].includes(route)) route = 'today';
  app.innerHTML = shell();
  document.querySelector('#page').innerHTML = ({ today: todayPage, vocabulary: vocabularyPage, argument: writingPage, story: writingPage, speaking: speakingPage, progress: progressPage, poem: poemPage })[route]();
  document.title = `${({ today: 'Today’s practice', vocabulary: 'My vocabulary', argument: 'Make your point', story: 'Tell your story', speaking: 'Speaking practice', progress: 'My progress', poem: 'Daily poem' })[route]} — Mellom`;
  if (route === 'speaking') { updateRecordingControls(); loadRecording(); }
}
function openPreferences() {
  const dialog = document.querySelector('#preferences');
  const langCode = state.language === 'en' ? 'en' : 'nb';
  const matching = voiceList.filter(v => state.language === 'no' ? /^(nb|no)(-|_)/i.test(v.lang) : v.lang.toLowerCase().startsWith(langCode));
  dialog.innerHTML = `<div class="dialog-heading"><div><span class="eyebrow">MAKE YOURSELF AT HOME</span><h2 id="preferences-title">Your preferences</h2></div><button class="icon-button" data-action="close-settings" aria-label="Close preferences">${icon('close')}</button></div><label class="input-label" for="voice-select">Listening voice · ${e(language().name)}</label><select id="voice-select" class="full-select"><option value="">Automatic (${state.language === 'en' ? 'American English' : 'Norwegian'} preferred)</option>${matching.map(v => `<option value="${e(v.voiceURI)}" ${state.voices[state.language] === v.voiceURI ? 'selected' : ''}>${e(v.name)} · ${e(v.lang)}</option>`).join('')}</select><p class="helper-text">${matching.length ? 'Available voices come from your device. Norwegian voices may not match the Oslo dialect.' : 'No matching voice is currently available. Try another browser or install the language’s speech voice in your device settings.'}</p><hr><h3>Writing feedback</h3><p>${aiStatus.aiAvailable ? `AI feedback is connected through ${e(aiStatus.provider)}. Text is sent to that provider only when you request feedback.` : 'Guided writing checks work without an account. AI feedback can be connected by the person running this app; no API keys are stored in the browser.'}</p><hr><h3>Your words belong to you</h3><p>Drafts and progress stay in this browser. Recordings are stored locally too. They do not sync between devices. Export your writing before clearing browser data.</p><button class="button outline full" data-action="export">${icon('download')}Export writing & progress</button><p class="helper-text">Recordings can be downloaded individually from Speaking practice. Shared devices can access saved work. Browser listening voices may use their provider’s online speech service.</p>`;
  dialog.showModal();
}
function speak(text) {
  if (!('speechSynthesis' in window)) { showSpeechNotice('Listening is not supported in this browser. You can still record and practise the passage.'); return; }
  const lang = state.language === 'en' ? 'en-US' : 'nb-NO';
  voiceList = speechSynthesis.getVoices();
  const voice = voiceList.find(v => v.voiceURI === state.voices[state.language]) || voiceList.find(v => v.lang.toLowerCase() === lang.toLowerCase()) || (state.language === 'no' ? voiceList.find(v => /^(nb|no)(-|_)/i.test(v.lang)) : null);
  if (!voice) { showSpeechNotice(`No ${state.language === 'en' ? 'American English' : 'Norwegian'} listening voice is available yet. Check Preferences or your device’s speech settings.`); return; }
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang; utterance.voice = voice;
  utterance.rate = Number(document.querySelector('#speech-speed')?.value || 0.95);
  utterance.onerror = () => showSpeechNotice('The listening voice could not play. Try another voice in Preferences.');
  speechSynthesis.speak(utterance);
  showSpeechNotice(`Listening with ${voice.name} (${voice.lang}).`);
}
function showSpeechNotice(message) {
  speechNotice = message;
  const el = document.querySelector('#speech-notice');
  if (el) el.textContent = message;
  announce(message);
}
function updateRecordingControls() {
  if (route !== 'speaking') return;
  const button = document.querySelector('#record-button');
  const status = document.querySelector('#recording-status');
  if (!button || !status) return;
  const session = recordingSession;
  const active = session?.key === dayKey() ? session : null;
  const phase = active?.phase;
  button.disabled = Boolean(session && phase !== 'recording');
  button.classList.toggle('recording', phase === 'recording');
  button.innerHTML = `${icon(phase === 'recording' ? 'stop' : 'mic')}${phase === 'recording' ? 'Stop recording' : phase === 'starting' ? 'Opening microphone…' : session ? 'Saving recording…' : 'Start recording'}`;
  status.textContent = phase === 'starting' ? 'Waiting for microphone permission…'
    : phase === 'recording' ? 'Recording… up to 3 minutes. Your audio stays here.'
    : session ? 'Saving your previous recording. You can start again in a moment.'
    : recordingNotice?.key === dayKey() ? recordingNotice.message : 'Your microphone stays off until you start.';
  const clock = document.querySelector('#recording-time');
  if (clock) {
    const seconds = active?.started ? Math.floor(((active.ended || Date.now()) - active.started) / 1000) : 0;
    clock.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
}
function cancelPendingRecording() {
  recordingGeneration++;
  if (recordingSession?.phase === 'starting') {
    recordingSession = null;
    updateRecordingControls();
  }
}
function stopRecordingSession() {
  const session = recordingSession;
  if (!session || session.phase !== 'recording') return;
  session.phase = 'saving';
  session.ended = Date.now();
  clearInterval(session.timer);
  if (session.recorder.state !== 'inactive') session.recorder.stop();
  updateRecordingControls();
}
function finishRecordingSession(session, message) {
  clearInterval(session.timer);
  session.stream?.getTracks().forEach(track => track.stop());
  if (recordingSession !== session) return;
  recordingSession = null;
  if (recorder === session.recorder) recorder = null;
  recordingNotice = { key: session.key, message };
  updateRecordingControls();
}
async function loadRecording() {
  const key = dayKey();
  const generation = ++recordingLoadGeneration;
  try {
    const record = await recordingStore('get', key);
    if (generation !== recordingLoadGeneration || key !== dayKey() || route !== 'speaking') return;
    const container = document.querySelector('#recording-playback');
    if (!container) return;
    if (recordingUrl) { URL.revokeObjectURL(recordingUrl); recordingUrl = null; }
    if (!record?.blob || !(record.blob instanceof Blob)) { container.innerHTML = ''; return; }
    recordingUrl = URL.createObjectURL(record.blob);
    container.innerHTML = `<div class="saved-recording"><div><strong>Your saved recording</strong><small>${e(new Date(record.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))} · Listen for clarity and rhythm</small></div><audio controls src="${recordingUrl}" aria-label="Your practice recording"></audio><a href="${recordingUrl}" download="mellom-${key}.${record.blob.type.includes('mp4') ? 'm4a' : 'webm'}" class="icon-button" aria-label="Download recording">${icon('download')}</a><button class="text-button danger" data-action="delete-recording">Delete</button></div>`;
  } catch {
    if (generation === recordingLoadGeneration && key === dayKey() && route === 'speaking') announce('Recording storage is unavailable in this browser.');
  }
}
async function toggleRecording() {
  if (recordingSession?.phase === 'recording') { stopRecordingSession(); return; }
  if (recordingSession || route !== 'speaking') return;
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    recordingNotice = { key: dayKey(), message: 'Recording is unavailable. Use a browser with microphone support over HTTPS or localhost.' };
    updateRecordingControls(); return;
  }
  const session = { key: dayKey(), generation: ++recordingGeneration, phase: 'starting', chunks: [], stream: null, recorder: null, timer: null };
  recordingSession = session;
  updateRecordingControls();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (recordingSession !== session || session.generation !== recordingGeneration || route !== 'speaking' || session.key !== dayKey()) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    session.stream = stream;
    const localRecorder = new MediaRecorder(stream);
    session.recorder = localRecorder;
    recorder = localRecorder;
    localRecorder.ondataavailable = event => { if (event.data.size) session.chunks.push(event.data); };
    localRecorder.onstop = async () => {
      clearInterval(session.timer);
      stream.getTracks().forEach(track => track.stop());
      session.ended ||= Date.now();
      session.phase = 'saving';
      if (session.failed) { finishRecordingSession(session, 'Recording failed. Please try again.'); return; }
      updateRecordingControls();
      const blob = new Blob(session.chunks, { type: localRecorder.mimeType || 'audio/webm' });
      if (!blob.size) { finishRecordingSession(session, 'No audio was captured. Please try again.'); return; }
      let message;
      try {
        await recordingStore('put', session.key, { blob, created: new Date().toISOString() });
        message = 'Saved on this device. Listen back, then try again.';
      } catch { message = 'Your recording could not be saved. Check browser storage permissions.'; }
      finishRecordingSession(session, message);
      if (session.key === dayKey() && route === 'speaking') await loadRecording();
    };
    localRecorder.onerror = () => {
      session.failed = true;
      clearInterval(session.timer);
      stream.getTracks().forEach(track => track.stop());
      if (localRecorder.state !== 'inactive') localRecorder.stop();
      else finishRecordingSession(session, 'Recording failed. Please try again.');
    };
    localRecorder.start();
    session.phase = 'recording'; session.started = Date.now();
    updateRecordingControls();
    session.timer = setInterval(() => {
      if (recordingSession === session) updateRecordingControls();
      if (Date.now() - session.started >= 180000 && localRecorder.state === 'recording') stopRecordingSession();
    }, 500);
  } catch (err) {
    finishRecordingSession(session, err.name === 'NotAllowedError' ? 'Microphone permission was declined. Allow it in your browser settings to record.' : 'No microphone could be opened. Check that a microphone is connected and try again.');
  }
}
async function requestFeedback() {
  if (feedbackBusy) return;
  const text = day()[route].text;
  if (countWords(text) < 15) { feedback = { error: 'Write at least 15 words so there is something useful to reflect on.' }; render(); return; }
  if (!aiStatus.aiAvailable) { feedback = getGuidedFeedback(text, route, state.language, content().words); render(); return; }
  const kind = route, lang = state.language, key = dayKey();
  feedbackBusy = true; render();
  try {
    const response = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, kind, language: lang, prompt: content()[kind].prompt, words: content().words.map(w => w.term) }), signal: AbortSignal.timeout(35000) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Feedback is unavailable right now.');
    if (key === dayKey() && kind === route && day()[kind].text === text) feedback = result;
  } catch (err) {
    if (key === dayKey() && kind === route) feedback = { error: `${err.name === 'TimeoutError' ? 'Feedback took too long. Please try again.' : err.message} Your draft is still saved. Use the guided check below while you wait.` };
  } finally {
    feedbackBusy = false;
    if (key === dayKey() && kind === route && day()[kind].text === text) {
      render();
      if (feedback?.error) document.querySelector('#feedback-panel').insertAdjacentHTML('beforeend', '<button class="button outline" data-action="guided-feedback">Use guided writing check</button>');
    } else {
      const button = document.querySelector('[data-action="feedback"]');
      if (button) { button.disabled = false; button.innerHTML = `${icon('spark')}Get AI feedback`; }
    }
  }
}
function exportData() {
  const blob = new Blob([JSON.stringify({ ...state, exportedAt: new Date().toISOString(), note: 'Audio recordings are downloaded separately from Speaking practice.' }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
  anchor.href = url; anchor.download = `mellom-practice-${today}.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce('Your writing and progress export has been downloaded.');
}

app.addEventListener('click', async event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'go') go(target.dataset.route);
  if (action === 'language') {
    if (recorder?.state === 'recording') { announce('Stop recording before switching languages.'); return; }
    if (state.language === target.dataset.language) return;
    cancelPendingRecording();
    state.language = target.dataset.language; feedback = null; speakingSource = 'model'; speechNotice = ''; persist(); window.speechSynthesis?.cancel(); render();
  }
  if (action === 'settings') openPreferences();
  if (action === 'close-settings') document.querySelector('#preferences').close();
  if (action === 'export') exportData();
  if (action === 'vocab-tab') { reviewMode = target.dataset.mode === 'review'; render(); }
  if (action === 'say-word') speak(allWords.find(w => w.id === target.dataset.word)?.term || '');
  if (action === 'learn-word') {
    const id = target.dataset.word;
    if (day().words.includes(id)) { announce('This expression is already in your vocabulary.'); return; }
    const sentence = day().sentences?.[id] || '';
    if (countWords(sentence) < 3) { const input = document.querySelector(`#sentence-${CSS.escape(id)}`); input.setCustomValidity('Write a sentence of at least 3 words before adding this expression.'); input.reportValidity(); input.focus(); return; }
    day().words.push(id);
    if (!state.reviews[id]) state.reviews[id] = scheduleReview(null, 'good', today);
    persist(); render(); announce('Expression saved. It will return for review.');
  }
  if (action === 'rate') { const id = target.dataset.word; state.reviews[id] = scheduleReview(state.reviews[id], target.dataset.rating, today); persist(); render(); announce('Review saved. Your next review is scheduled.'); }
  if (action === 'feedback') await requestFeedback();
  if (action === 'guided-feedback') { feedback = getGuidedFeedback(day()[route].text, route, state.language, content().words); render(); }
  if (action === 'complete-writing') {
    if (countWords(day()[route].text) < 30) return;
    day()[route].complete = true; persist(); render(); announce('Writing practice completed. Your draft is saved.');
  }
  if (action === 'listen') speak(selectedSpeechText());
  if (action === 'listen-poem') speak(dailyPoem().lines.join('\n'));
  if (action === 'practise-poem') { speakingSource = 'poem'; go('speaking'); }
  if (action === 'record') await toggleRecording();
  if (action === 'delete-recording') { await recordingStore('delete', dayKey()); await loadRecording(); announce('Recording deleted.'); }
  if (action === 'complete-speaking') { if (recordingSession) { announce('Finish recording and let it save before completing the exercise.'); return; } day().speaking = true; persist(); render(); announce('Speaking practice marked complete.'); }
});
app.addEventListener('input', event => {
  if (event.target.id === 'writing-input') {
    const draft = day()[route]; draft.text = event.target.value; draft.complete = false; draft.updated = new Date().toISOString(); feedback = null;
    const saved = persist(); document.querySelector('#save-status').textContent = saved ? 'Saved on this device' : 'Not saved — please export your writing';
    const n = countWords(draft.text); document.querySelector('#word-count').textContent = `${n} words`;
    const button = document.querySelector('[data-action="complete-writing"]'); button.disabled = n < 30; button.innerHTML = `${icon('arrow')}Finish this exercise`;
    document.querySelector('#feedback-panel').innerHTML = '';
  }
  if (event.target.dataset.wordSentence) {
    event.target.setCustomValidity('');
    day().sentences ||= {}; day().sentences[event.target.dataset.wordSentence] = event.target.value; persist();
  }
});
app.addEventListener('change', event => {
  if (event.target.id === 'voice-select') { state.voices[state.language] = event.target.value; persist(); }
  if (event.target.id === 'speech-source') {
    if (recordingSession) { event.target.value = speakingSource; announce('Finish recording and let it save before changing the practice passage.'); return; }
    speakingSource = event.target.value; render();
  }
});
window.addEventListener('hashchange', () => {
  cancelPendingRecording();
  stopRecordingSession();
  route = location.hash.slice(1) || 'today'; feedback = null; window.speechSynthesis?.cancel(); render();
  document.querySelector('#main').focus({ preventScroll: true }); window.scrollTo({ top: 0 });
});
window.addEventListener('beforeunload', event => { if (recordingSession && recordingSession.phase !== 'starting') { event.preventDefault(); event.returnValue = ''; } });
window.addEventListener('storage', event => {
  if (event.key !== 'mellom.practice.v1') return;
  // Refresh in-memory data without replacing the active editor or microphone UI.
  const latest = loadState(browserStorage);
  state.days = latest.days;
  state.reviews = latest.reviews;
  state.voices = latest.voices;
  announce('Practice data changed in another tab. The latest saved progress is now available.');
});
window.addEventListener('focus', () => {
  const date = localDateKey();
  if (date !== today && recorder?.state !== 'recording') { cancelPendingRecording(); today = date; setDailyLanguage(); persist(); feedback = null; speakingSource = 'model'; render(); announce('A new day of practice is ready.'); }
});
if ('speechSynthesis' in window) { voiceList = speechSynthesis.getVoices(); speechSynthesis.addEventListener('voiceschanged', () => { voiceList = speechSynthesis.getVoices(); }); }
persist();
render();
if (document.querySelector('meta[name="mellom-hosting"]')?.content !== 'static') fetch('/api/status').then(r => { if (!r.ok) throw new Error('No feedback server'); return r.json(); }).then(status => {
  aiStatus = status;
  const input = document.querySelector('#writing-input');
  if (!input && !document.querySelector('dialog[open]') && !recordingSession) render();
  const button = document.querySelector('[data-action="feedback"]');
  if (button && !feedbackBusy) button.innerHTML = `${icon('spark')}${aiStatus.aiAvailable ? 'Get AI feedback' : 'Check my draft'}`;
  const disclosure = document.querySelector('#feedback-disclosure');
  if (disclosure) disclosure.textContent = `${aiStatus.aiAvailable ? `AI feedback by ${aiStatus.provider}. Your draft is sent only when you request feedback.` : 'Guided checks cover length, structure, and vocabulary use. They do not assess grammar or whether your argument is correct.'} Write at least 30 words to finish.`;
}).catch(() => { /* Guided practice also works on a static host. */ });
