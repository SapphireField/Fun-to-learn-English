# Mellom — Find your words

A daily language practice app for an adult learner who handles everyday conversation and wants to express complex ideas precisely. Practice American English and Norwegian Bokmål, with Oslo-focused pronunciation notes.

## Run locally

Use **Node.js 24 or later**. No package installation or external frontend resources are needed.

```sh
cd /workspace/Fun-to-learn-English
npm run dev
```

The development server listens on port **5173**. For a production build:

```sh
npm run build
npm run preview
```

Use `PORT=5174 npm run preview` to run a preview alongside the development server. Set `HOST=127.0.0.1` to restrict the listener to the local machine. `npm test` runs Node's built-in tests; `python tests/browser_smoke.py` exercises the browser flow when Python Playwright and Chromium are installed. In sandboxed environments the HTTP tests and server require permission to listen on a loopback port.

## Daily practice

- **Vocabulary:** three expressions, meanings, example sentences, usage/pronunciation notes, and a sentence of your own. Learned expressions enter a review queue, with intervals based on Again / Got it / Easy.
- **Make your point:** a nuanced argument prompt, a structure to work with, and a vocabulary bank.
- **Tell your story:** a separate narrative prompt and saved draft.
- **Speaking:** listen to a device voice, practise the model passage or your own draft, record up to three minutes, replay, download, or delete it.
- **Progress:** real activity counts, a weekly practice calendar, a writing journal, and a JSON export.

The starter pack contains **seven bilingual themes and 42 expressions**. Themes rotate weekly, using calendar days in Europe/Oslo. The suggested language alternates by day; learners can switch anytime. Norwegian prompts and examples use Bokmål. Speech synthesis prefers en-US and nb-NO voices when installed, but it cannot guarantee an Oslo dialect. The app explains that limitation and provides specific pronunciation practice notes. It does **not** automatically assess or score pronunciation.

Without a provider key, **guided writing checks** identify draft length, some structural signals, and vocabulary occurrences, then offer revision questions. They are explicitly labeled as checklists, not grammar corrections or meaning assessments. Completing a writing activity requires at least 30 words; the suggested practice length is 80–120 words. This version uses a curated intermediate-to-advanced starter curriculum, not an automated proficiency assessment.

## Optional AI writing feedback

Core practice does not require an account or API key. To enable meaning, grammar, and precision feedback, put **one** server-side key in an ignored `.env.local` file. Use the variable names shown in `.env.example`, never put keys in browser code or a `VITE_` variable.

- `OPENAI_API_KEY`: OpenAI writing feedback (takes priority when both providers are configured). Optional `OPENAI_MODEL`, default `gpt-4.1-mini`.
- `GEMINI_API_KEY`: Gemini writing feedback. Optional `GEMINI_MODEL`, default `gemini-2.5-flash`.

Restart the server after changing configuration. OpenAI API usage is billed separately from ChatGPT. Model access and billing depend on the provider account. The npm startup commands enable Node's inherited proxy support through `NODE_USE_ENV_PROXY=1`; keep the configured proxy and TLS verification enabled. The corresponding provider hostname (`api.openai.com` or `generativelanguage.googleapis.com`) must be allowed by your environment network settings.

Only pressing **Get AI feedback** sends the current draft, exercise prompt, and target expressions to the selected provider. Feedback encourages revision and clarifies ambiguous meaning rather than replacing the learner's writing wholesale. No writing or audio is sent to the API automatically. Audio is never sent to this backend. Device text-to-speech voices may use their own online service.

Provider request/response handling is tested with mock providers. Live AI calls require a usable key and network access and have not been verified in this cloud environment. `/api/status` reports whether a key is configured, not whether billing, authorization, or provider connectivity has succeeded.

## Publish with GitHub Pages

The included `.github/workflows/pages.yml` tests and publishes the core app whenever code is pushed to `main`. It can also be started manually from the repository's Actions tab.

1. Upload or commit the app files to the root of `SapphireField/Fun-to-learn-English`, including the `.github/workflows/pages.yml` file, then merge into `main`. Never upload `.env.local` or real API keys.
2. In that GitHub repository, open **Settings → Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Open **Actions → Publish Mellom to GitHub Pages → Run workflow**, choose `main`, and run it. Later pushes to `main` publish automatically.
4. When deployment succeeds, open the site link shown by the workflow or in Settings → Pages. Without a custom domain, the expected address is `https://sapphirefield.github.io/Fun-to-learn-English/`.

GitHub Pages hosts a public website; access to the repository may depend on your account and plan. The app's drafts and recordings still stay in each visitor's browser. They are not committed to the repository. GitHub Pages provides HTTPS for microphone access, but browser permission and a supported device are still required.

The workflow uses `npm run build:pages`, which generates relative asset links for project subdirectories and explicitly disables backend requests. Vocabulary, guided writing checks, progress, and local recordings work. AI writing feedback is unavailable on Pages because Pages cannot run `server.mjs`. Adding an API key as a GitHub Actions secret does not create a backend; never embed it in the static build. Use the Node server on a private HTTPS host if you want AI feedback.

You can reproduce the Pages build locally with `npm run build:pages`. GitHub access, repository settings, and the actual hosted deployment must be verified separately; a local passing build is not proof of publication.

## Data and browser support

Writing, sentences, progress, and review schedules are saved in `localStorage`. Recordings are saved in IndexedDB and can be downloaded individually. Data stays in the same browser profile, is not synchronized, and may be removed by private browsing, storage limits, or clearing site data. Export important writing from Preferences or My progress. The app reports storage failures rather than claiming a save succeeded.

Microphone recording needs HTTPS (or localhost), permission, and a browser with MediaRecorder support. Listening requires a suitable installed browser/operating-system voice. Missing voice, declined permission, and unavailable microphone states have explicit messages. Recordings are self-review practice; no accent scores are fabricated.

## Hosting

The Node server serves both the app and optional AI feedback. Use HTTPS when accessing microphone features on a remote device. This first version is for private/single-user use. Before exposing an AI-enabled server to the public, add authentication and per-user spending/rate controls. API keys are server-only; same-origin checks, request limits, a provider timeout, a Content Security Policy, and static path restrictions are included.

The `dist/` folder can also be hosted statically (including Vercel's included static build configuration). Core practice works there, but optional AI feedback needs the Node backend on the same origin. No live processes survive an environment snapshot; restart with the commands above.

## Layout

- `src/app.mjs`, `src/styles.css`: accessible responsive user interface.
- `src/content.mjs`: bilingual starter curriculum.
- `src/learning.mjs`: Oslo calendar, guided checks, word matching, review schedules.
- `src/storage.mjs`: validated local state and recording storage.
- `server.mjs`: static server and optional provider proxy.
- `scripts/build.mjs`: dependency-free static build.
- `tests/`: learning, storage, server integration, and browser checks.
