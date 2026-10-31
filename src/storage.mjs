export const STORAGE_KEY = 'mellom.practice.v1';
export function freshState() {
  return { version: 1, language: 'en', selectedOn: '', days: {}, reviews: {}, voices: { en: '', no: '' } };
}
export function loadState(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!parsed || parsed.version !== 1 || !parsed.days || Array.isArray(parsed.days) || typeof parsed.days !== 'object' || !parsed.reviews || typeof parsed.reviews !== 'object') return freshState();
    const result = freshState();
    result.language = parsed.language === 'no' ? 'no' : 'en';
    result.selectedOn = typeof parsed.selectedOn === 'string' ? parsed.selectedOn : '';
    result.voices = { en: String(parsed.voices?.en || ''), no: String(parsed.voices?.no || '') };
    for (const [key, day] of Object.entries(parsed.days)) {
      if (!/^\d{4}-\d{2}-\d{2}-(en|no)$/.test(key) || !day || typeof day !== 'object') continue;
      const sentences = Object.fromEntries(Object.entries(day.sentences && typeof day.sentences === 'object' ? day.sentences : {}).filter(([, value]) => typeof value === 'string'));
      result.days[key] = {
        words: Array.isArray(day.words) ? [...new Set(day.words.filter(w => typeof w === 'string'))] : [],
        sentences,
        sentenceFeedback: cleanSentenceFeedback(day.sentenceFeedback, sentences),
        argument: cleanDraft(day.argument), story: cleanDraft(day.story),
        speaking: day.speaking === true,
      };
    }
    for (const [key, review] of Object.entries(parsed.reviews)) {
      if (review && typeof review === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(review.due) && Number.isFinite(review.interval) && Number.isFinite(review.repetitions)) {
        result.reviews[key] = { interval: review.interval, due: review.due, repetitions: review.repetitions };
      }
    }
    return result;
  } catch { return freshState(); }
}
function cleanSentenceFeedback(records, sentences) {
  const clean = {};
  if (!records || typeof records !== 'object' || Array.isArray(records)) return clean;
  for (const [id, record] of Object.entries(records)) {
    if (!Object.hasOwn(sentences, id) || typeof record?.text !== 'string' || record.text !== sentences[id]) continue;
    const result = record.result;
    if (!result || !['guided', 'ai'].includes(result.source) || typeof result.summary !== 'string' || result.summary.length > 2000
      || ['strengths', 'suggestions', 'questions', 'usedWords'].some(field => !Array.isArray(result[field]) || result[field].length > 10 || result[field].some(item => typeof item !== 'string' || item.length > 2000))
      || !Number.isFinite(result.wordCount) || result.wordCount < 0) continue;
    const feedback = { source: result.source, summary: result.summary, strengths: result.strengths, suggestions: result.suggestions, questions: result.questions, usedWords: result.usedWords, wordCount: result.wordCount };
    for (const field of ['example', 'collocation', 'tip', 'revision']) {
      if (typeof result[field] === 'string' && result[field].length <= 2000) feedback[field] = result[field];
    }
    clean[id] = { text: record.text, checkedAt: typeof record.checkedAt === 'string' ? record.checkedAt : '', result: feedback };
  }
  return clean;
}
function cleanDraft(draft) {
  return { text: typeof draft?.text === 'string' ? draft.text : '', complete: draft?.complete === true, updated: typeof draft?.updated === 'string' ? draft.updated : '' };
}
export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}
export function ensureDay(state, date, language) {
  const key = `${date}-${language}`;
  if (!state.days[key]) state.days[key] = { words: [], sentences: {}, sentenceFeedback: {}, argument: cleanDraft(), story: cleanDraft(), speaking: false };
  return state.days[key];
}
export function completedSteps(day, wordCount = 3) {
  if (!day) return 0;
  return Number(day.words.length >= wordCount) + Number(day.argument.complete) + Number(day.story.complete) + Number(day.speaking);
}

let dbPromise;
function openDatabase() {
  if (!globalThis.indexedDB) return Promise.reject(new Error('This browser cannot save recordings.'));
  if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open('mellom-audio', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('recordings');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { dbPromise = null; reject(req.error); };
  });
  return dbPromise;
}
export async function recordingStore(action, key, value) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recordings', action === 'get' ? 'readonly' : 'readwrite');
    const store = tx.objectStore('recordings');
    const request = action === 'put' ? store.put(value, key) : action === 'delete' ? store.delete(key) : store.get(key);
    let result;
    request.onsuccess = () => { result = request.result; };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Recording could not be saved.'));
  });
}
