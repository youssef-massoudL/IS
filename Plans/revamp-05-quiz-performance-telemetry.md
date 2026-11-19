# Revamp Feature 05 — Lightweight Quiz Performance Telemetry (`hub:quizHistory` & `HubQuiz.getSummary()`)

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Depends On:** Features 01–04 (completed & verified)  
**Prepares For:** Feature 06 (Personalized Landing Page — "ملخص أدائه في امتحني")  
**Architect / Lead:** Antigravity

---

## Goal

Add lightweight, zero-server quiz performance tracking to `assets/quiz.js` so both **"امتحني"** and the upcoming **Landing Page (Feature 06)** can display meaningful student performance metrics:
1. Record every completed quiz session in `localStorage` under `hub:quizHistory` (capped at 40 entries).
2. One-time backfill from existing `hub:examState:<subjectId>` entries so returning students see their past scores immediately.
3. Expose a clean, null-safe public API `window.HubQuiz.getSummary()` (attempts, average/best score, last attempt, active mistakes, mastered mistakes, weakest subject, per-subject breakdown, and resumable in-progress quiz).
4. Keep QR/File Progress Sync (`buildSyncPayload` / `applySyncData`) cleanly compatible with `hub:quizHistory`.
5. Display a compact, non-intrusive performance summary strip at the top of the `#practice` builder screen when the student has prior activity.

---

## Critical Gotchas (مطبات حرجة — MUST Handle Explicitly)

1. **Do NOT record 0-answered abandoned sessions:**
   - In `finishSession(auto)` (`assets/quiz.js:1304`), if a student opens a quiz and immediately clicks `إنهاء الاختبار` with `answeredCount(session) === 0`, do **NOT** push a `0%` attempt into `hub:quizHistory` — it would unfairly wreck their average score.
   - Only record into `hub:quizHistory` when `answeredCount(session) > 0 && session.ids.length > 0`.
2. **Cold-start backfill for existing students (`seedHistoryFromExamStates`):**
   - Existing students already have `hub:examState:<subjectId>` saved from midterm studying, even though `hub:quizHistory` didn't exist yet.
   - On `init()`, if `localStorage.getItem("hub:quizHistory") === null`, scan `hub:examState:all` plus `hub:examState:<subject.id>` for every subject in `state.subjects`: for any finished session with `session.score && session.score.total > 0 && answeredCount(session) > 0`, seed it into `hub:quizHistory` (deduped by `finishedAt + subjectId`, sorted newest-first).
   - If nothing exists to seed, write `[]` (or leave empty safely) so the backfill runs at most once.
3. **Keep QR Sync payload compact & 100% backwards-compatible (`assets/quiz.js:1543-1764`):**
   - Include only the **15 most recent** history entries in `buildSyncPayload()` (`history: getHistory().slice(0, 15)`) so QR codes stay small and scannable!
   - In `applySyncData(data, mode)`: handle old `v: 3` payloads that lack `data.history` safely (do NOT wipe local history when importing an older QR code that has no `history` field!).
   - Deduplicate merged history by `entry.id || (entry.subjectId + "|" + entry.finishedAt)`, sort descending by `finishedAt`, and cap at 40 entries.
   - Also export `history` in JSON file export (`exportProgress`) and restore it in `importProgress` (if those reuse `buildSyncPayload` / `applySyncData`, verify they automatically pick it up!).
4. **Match `assets/quiz.js` ES5-style IIFE conventions:**
   - `assets/quiz.js` uses `var`, `function`, `Object.assign`, and `store.getJson` / `store.setJson`. Keep additions clean, idiomatic to `quiz.js`, and pass `node --check assets/quiz.js`.
5. **Dispatch `hub:quiz-updated` event:**
   - Whenever `finishSession` records history or `applySyncData` updates history, dispatch `window.dispatchEvent(new CustomEvent("hub:quiz-updated"))` (matching the existing `hub:mistakes-updated` pattern at line 195) so Feature 06's Landing Page stays in sync automatically.
6. **Cache-bust `assets/quiz.js` in `index.html`:**
   - Remember `index.html` currently loads `<script src="assets/quiz.js?v=20261116a"></script>`! Bump the `?v=` query parameter (e.g. `?v=20261119e`) along with `assets/styles.css` so browsers don't serve the old cached `quiz.js` without `getSummary()`!

---

## Data Contract

### `localStorage` Key: `hub:quizHistory`
JSON array (newest-first, max 40 entries):
```json
[
  {
    "id": "qh-1763570000000-db2",
    "subjectId": "database-2",
    "mode": "practice",
    "examTypeLabel": "تدريب فوري",
    "correct": 17,
    "answered": 20,
    "total": 20,
    "percent": 85,
    "finishedAt": "2026-11-19T17:00:00.000Z"
  }
]
```

### Public API: `window.HubQuiz.getSummary()`
Must always return a valid, null-safe object even if `localStorage` is empty or corrupted:
```js
{
  attempts: number,           // total entries in hub:quizHistory
  avgScore: number | null,    // rounded integer 0..100 across attempts (null if attempts === 0)
  bestScore: number | null,   // max percent 0..100 (null if attempts === 0)
  lastAttempt: {              // null if attempts === 0
    id: string,
    subjectId: string,
    subjectName: string,      // Arabic name or "كل المواد"
    accent: string,
    correct: number,
    answered: number,
    total: number,
    percent: number,
    mode: string,
    examTypeLabel: string,
    finishedAt: string
  } | null,
  activeMistakes: number,     // count of valid entries in hub:mistakes
  masteredMistakes: number,   // count of valid entries in hub:corrected
  weakestSubject: {           // real subject (not "all") needing most attention, or null
    subjectId: string,
    subjectName: string,
    accent: string,
    mistakes: number,
    avgScore: number | null
  } | null,
  bySubject: {                // keyed by each real subject.id
    [subjectId]: {
      attempts: number,
      avgScore: number | null,
      lastScore: number | null,
      activeMistakes: number,
      mastered: number
    }
  },
  hasInProgress: {            // most recent unfinished hub:examState:* session, or null
    subjectId: string,
    subjectName: string,
    answered: number,
    total: number
  } | null
}
```
- **Weakest Subject selection rule:**
  1. Among real subjects (`subject.id` in `state.subjects`), if any subject has `activeMistakes > 0`, pick the one with the **highest `activeMistakes`** (tie-breaker: lowest `avgScore`).
  2. Otherwise, if any real subject has `attempts > 0` and `avgScore < 85`, pick the one with the **lowest `avgScore`**.
  3. Otherwise return `null` (student is doing great or hasn't practiced yet!).

---

## Step-by-Step Implementation Plan

### 1. History Storage & Backfill Helpers (`assets/quiz.js`)
Near lines 60–65 (`MISTAKES_KEY`, `CORRECTED_KEY`, `CONFIG_KEY`):
- Add:
  ```js
  var HISTORY_KEY = "hub:quizHistory";
  var MAX_HISTORY = 40;
  var MAX_SYNC_HISTORY = 15;
  ```
- Add clean helpers:
  - `getHistory()`: reads `store.getJson(HISTORY_KEY, [])`, validates it's an Array of valid objects (`total > 0`), returns sanitized array.
  - `saveHistory(list)`: trims to `MAX_HISTORY`, writes via `store.setJson(HISTORY_KEY, list)`, dispatches `window.dispatchEvent(new CustomEvent("hub:quiz-updated"))`.
  - `recordHistoryFromSession(session)`:
    - Computes `answered = answeredCount(session)`, `total = Array.isArray(session.ids) ? session.ids.length : 0`, `correct = correctCount(session)`.
    - Returns early if `answered <= 0 || total <= 0`.
    - Builds compact entry `{ id, subjectId: session.subjectId || "all", mode: session.mode || "practice", examTypeLabel: session.examTypeLabel || "", correct, answered, total, percent: percent(correct, total), finishedAt: session.finishedAt || new Date().toISOString() }`.
    - Prepends to `getHistory()`, dedupes by `id`, saves via `saveHistory()`.
  - `seedHistoryFromExamStates()`:
    - Checks `localStorage.getItem(HISTORY_KEY) === null` (inside `try/catch`). If already present, return.
    - Scans `["all"].concat(state.subjects.map(function (s) { return s.id; }))`.
    - For each key, reads `store.getJson(examKey(subjectId), null)`; if `s && s.finished && s.score && s.score.total > 0 && answeredCount(s) > 0`, converts to a history entry.
    - Sorts newest-first by `finishedAt` and writes to `HISTORY_KEY` (only if seeded entries > 0, or writes `[]` cleanly so backfill doesn't re-scan every boot).
- Call `seedHistoryFromExamStates()` at the end of `init()` (`assets/quiz.js`).
- Call `recordHistoryFromSession(session)` inside `finishSession(auto)` right after `store.setJson(examKey(session.subjectId), session)` (line 1326).

### 2. Implement `getSummary()` & Expose on `window.HubQuiz` (`assets/quiz.js`)
- Write `getSummary()` implementing the exact Data Contract above:
  - Uses `getHistory()`, `mistakeEntries()` (or `getMistakes()`), `correctedEntries()` (or `getCorrected()`), and checks `examKey(id)` across `"all"` + `state.subjects` for `hasInProgress` (`session && !session.finished && Array.isArray(session.ids) && session.ids.length > 0 && answeredCount(session) > 0`).
  - Resolves `subjectName` (`subjectById(id)?.nameAr || (id === "all" ? "كل المواد" : id)`) and `accent`.
- Add `getSummary: getSummary` to `window.HubQuiz = { ... }` at lines 2293–2311.

### 3. Integrate `history` with Progress Sync (`assets/quiz.js:1543-1764`)
- Add `mergeHistory(current, incoming)`:
  - Concatenates `current` and `incoming`, deduplicates by `entry.id || (entry.subjectId + "|" + entry.finishedAt)`, sorts descending by `String(entry.finishedAt || "")`, slices to `MAX_HISTORY`.
- In `buildSyncPayload()` (line 1543): add `history: getHistory().slice(0, MAX_SYNC_HISTORY)`.
- In `applySyncData(data, mode)` (line 1709):
  - Check `var hasHistory = Array.isArray(data.history);`
  - If `hasHistory`:
    - If `mode === "replace"`: `saveHistory(mergeHistory([], data.history))`.
    - Else (`merge`): `saveHistory(mergeHistory(getHistory(), data.history))`.
  - Include `history: getHistory().length` in the return stats object (keeping existing properties unchanged!).

### 4. Compact Performance Strip on `#practice` Builder Screen (`assets/quiz.js` + `assets/styles.css`)
- In `renderPractice` builder screen (only when `ui.screen === "builder"`):
  - Call `var summary = getSummary();`
  - If `summary.attempts > 0 || summary.activeMistakes > 0 || summary.masteredMistakes > 0`, render a clean 1-row `.quiz-telemetry-strip` right below the hero/subject selector showing up to 4 compact stat chips:
    - **الاختبارات المكتملة:** `${summary.attempts}`
    - **متوسط الدرجات:** `${summary.avgScore}%` (only if `summary.avgScore !== null`)
    - **أخطاء للمراجعة:** `${summary.activeMistakes}` (clickable link to `#mistakes` when `> 0`)
    - **أسئلة متقنة:** `${summary.masteredMistakes}` (when `> 0`)
- Add lightweight, light+dark-mode CSS for `.quiz-telemetry-strip` and `.qt-stat` in `assets/styles.css`.
- Bump `?v=` on `assets/quiz.js` and `assets/styles.css` in `index.html` (e.g., `?v=20261119e`).

---

## Verification Checklist (Must All Pass Before Moving to Feature 06)

### Automated CLI Checks
```powershell
node --check assets/quiz.js
node --check assets/app.js
node scripts/build.mjs --check
```

### Browser Functional & Visual Checks
1. **API Contract Check (DevTools Console):**
   - Run `window.HubQuiz.getSummary()` on a fresh/empty `localStorage` → confirms no errors, returns `{ attempts: 0, avgScore: null, bestScore: null, lastAttempt: null, activeMistakes: 0, masteredMistakes: 0, weakestSubject: null, bySubject: {...}, hasInProgress: null }`.
2. **0-Answered Guard:**
   - Start a quiz in `#practice/database-2`, click `إنهاء الاختبار` immediately without answering any question → confirm `HubQuiz.getSummary().attempts` is STILL `0`!
3. **Normal Completion & Telemetry Update:**
   - Start a 5-question quiz, answer all 5 questions (mix of right & wrong), finish → confirm:
     - `localStorage.getItem("hub:quizHistory")` contains 1 entry with accurate `correct`, `total`, `percent`, `subjectId`, `finishedAt`.
     - `HubQuiz.getSummary()` reflects `attempts: 1`, exact `avgScore` / `bestScore`, `lastAttempt`, updated `activeMistakes`, and `weakestSubject`.
     - Returning to `#practice` displays the compact `.quiz-telemetry-strip` cleanly in Light & Dark mode and on 375px mobile.
4. **In-Progress Detection:**
   - Start a quiz, answer 2 questions, navigate away to `#schedule` → run `HubQuiz.getSummary().hasInProgress` → confirms `{ subjectId, subjectName, answered: 2, total: ... }`.
5. **Backfill Check:**
   - Remove `hub:quizHistory` from `localStorage` (while keeping a finished `hub:examState:database-2`) and reload → confirm `hub:quizHistory` is automatically seeded with that finished attempt!
6. **QR Sync Safety:**
   - Open Sync modal in `#mistakes` → confirm QR code still generates cleanly without overflow errors, and exporting/importing preserves `hub:quizHistory`.
