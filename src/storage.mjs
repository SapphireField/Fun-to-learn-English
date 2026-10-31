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
      result.days[key] = {
        words: Array.isArray(day.words) ? [...new Set(day.words.filter(w => typeof w === 'string'))] : [],
        sentences: Object.fromEntries(Object.entries(day.sentences && typeof day.sentences === 'object' ? day.sentences : {}).filter(([, value]) => typeof value === 'string')),
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
function cleanDraft(draft) {
  return { text: typeof draft?.text === 'string' ? draft.text : '', complete: draft?.complete === true, updated: typeof draft?.updated === 'string' ? draft.updated : '' };
}
export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}
export function ensureDay(state, date, language) {
  const key = `${date}-${language}`;
  if (!state.days[key]) state.days[key] = { words: [], sentences: {}, argument: cleanDraft(), story: cleanDraft(), speaking: false };
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
