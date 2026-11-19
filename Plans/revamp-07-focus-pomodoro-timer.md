# Revamp Feature 07 — Built-In Focus Timer (Pomodoro) & Study Completion Loop

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Depends On:** Features 01–06 (all completed & verified — connects directly into `hub:studied`, `.home-hero-actions`, `#modal`, and `updateStudyProgress()`)  
**Architect / Lead:** Antigravity

---

## Goal

Add a calm, zero-dependency, **Built-In Focus Timer (Pomodoro)** as a standalone module (`assets/pomodoro.js`) that works seamlessly across the entire site:
1. **Topbar Trigger + `#home` Quick Launch:** Compact timer icon in `.top-actions` (accessible from every page) + a subtle `"جلسة تركيز (Pomodoro)"` button inside `.home-hero-actions` on `#home`.
2. **Runs in the Background Everywhere:** Keeps running accurately while navigating between subjects, taking a quiz in `امتحني`, or reading a PDF inside `#modal` — appearing as a **compact Floating Mini-Pill (`z-index: 160`, above `#modal`'s `z-index: 100`)** ONLY while a timer is running/paused so the UI stays 100% clutter-free when idle!
3. **Flexible Subject Allocation:** Student picks any of the 5 subjects (auto-defaulting to the currently open subject if on a subject page), picks duration (`15` / `25` / `45` / `50` min or custom `5–120` min), can finish early (`≥ 1 min`), and can even **reassign the completed minutes to another subject** right on the completion card before saving.
4. **Study Completion Loop (`hub:studied`):** When a focus session finishes, a gentle Web Audio chime plays and the completion card reminds the student to **check off which lecture(s) / chapter(s) they finished** — writing straight into `hub:studied` and immediately updating the subject's `.lec-card` checkboxes, progress bar, and `#home` semester progress!

---

## Critical Gotchas (مطبات حرجة — MUST Handle Explicitly)

1. **Computer Networks uses UNIT keys in `hub:studied`, NOT `1..N` lecture numbers!**
   - Standard 4 subjects (`database-2`, `information-theory`, `research-methods`, `system-analysis`) store `hub:studied` keys as `"${subjectId}:${lecture}"` (`1..maxLecture(subject)`).
   - **`computer-networks`** stores `hub:studied` keys as the **9 tracked unit IDs**:
     - `computer-networks:atwan-ch1` … `computer-networks:atwan-ch7`
     - `computer-networks:mahfouz-ch1`, `computer-networks:mahfouz-ch2`
   - **Required fix:** NEVER hardcode `1..N` inside `assets/pomodoro.js`! Pass a single source-of-truth callback `getStudyItems(subjectId)` from `assets/app.js` into `window.HubPomodoro.init(...)` that returns `[{ key, label, studied }]` for any subject (handling both standard subjects and Computer Networks accurately!).
2. **Wall-Clock Timestamp Timing (`endAt`) — NEVER rely on `remainingSeconds -= 1`!**
   - Browsers throttle `setInterval` when a tab is in the background or screen locks.
   - **Required fix:** Persist `endAt = Date.now() + remainingMs` in `localStorage` (`hub:pomoState`). On every 500ms tick, `visibilitychange`, and page boot, calculate `leftMs = Math.max(0, state.endAt - Date.now())`.
   - If a student refreshes the page or switches back to the tab after the timer already expired, `init()` / `visibilitychange` detects `leftMs <= 0` and immediately opens the Completion Confirmation card so their focused minutes are never lost!
3. **Mount Outside `#view` and `#modal` (`document.body`) with Exact `z-index: 160`:**
   - `#modal` (PDF viewer) sits at `z-index: 100`, `.notif-panel` is `70`, `.file-info-bubble` is `1200`.
   - Mount `#pomo-root` directly inside `document.body` at **`z-index: 160`**, with `.pomo-pill` anchored at `bottom: 16px; inset-inline-end: 16px;` so it NEVER covers `#modal`'s top header/close button or PDF zoom toolbar, and stays interactive while reading a PDF!
4. **Escape Key Isolation (Don't Close `#modal` Behind the Timer Panel!):**
   - If a student is reading a PDF in `#modal` (`!modalEl.hidden`), opens the Pomodoro drawer, and hits `Escape`, **ONLY** the Pomodoro drawer should close — `#modal` must stay open!
   - **Required fix:** In `assets/app.js`'s `keydown` Escape handler, check `if (window.HubPomodoro?.isPanelOpen?.()) { window.HubPomodoro.close(); return; }` **BEFORE** `if (!modalEl.hidden) closePreview();`!
5. **No External Audio Files (Web Audio API Chime with Safe Fallback + Mute Toggle):**
   - Synthesize a soft, pleasant 2-note chime (`523.25 Hz` → `659.25 Hz`, gentle gain envelope) using `window.AudioContext || window.webkitAudioContext`, wrapped in `try/catch` so strict autoplay policies never throw errors.
   - Include a persisted mute toggle (`hub:pomoMuted`) inside the panel header.
6. **Zero UI Clutter When Idle:**
   - When `status === "idle"` and panel is closed, the floating `.pomo-pill` MUST be `hidden`! Only the topbar icon button (and the subtle button in `.home-hero-actions`) is visible until the student starts a session.
7. **Live UI Sync Back Into `assets/app.js`:**
   - When the student checks off lecture(s) on the Pomodoro completion card and clicks Save, `pomodoro.js` updates `hub:studied` and calls `onStudyChanged(subjectId)` provided by `app.js`:
     - If currently viewing that subject page: sync all `[data-study]` checkboxes + `.lec-card.is-studied` classes + `updateStudyProgress(subjectId)`!
     - If currently viewing `#home`: re-render `#home` (or refresh `.home-hero` semester progress + `.home-lectures-card` studied badges)!
   - Also expose a `hub:focus-updated` CustomEvent so `#home`'s quick-launch button can reflect today's focus minutes cleanly!

---

## Data Contracts (`localStorage`)

### 1. `hub:pomoState` (Active / Pending Timer State)
```json
{
  "status": "idle",
  "mode": "focus",
  "subjectId": "database-2",
  "durationMin": 25,
  "endAt": null,
  "remainingMs": 1500000,
  "startedAt": null,
  "completedPending": null
}
```
When a focus session completes (or finishes early with ≥ 1 min elapsed), `status` becomes `"completed"` and `completedPending` holds:
```json
{
  "subjectId": "database-2",
  "minutes": 25,
  "finishedAt": "2026-11-19T18:30:00.000Z"
}
```
*(Persisting `completedPending` guarantees that even if the student accidentally refreshes before confirming their lectures, the confirmation card survives until they confirm or dismiss it!)*

### 2. `hub:focusLog` (Accumulated Study Time)
```json
{
  "totalMinutes": 75,
  "todayDate": "2026-11-19",
  "todayMinutes": 50,
  "sessionsCount": 3,
  "bySubject": {
    "database-2": 50,
    "computer-networks": 25
  }
}
```
*(Automatically resets `todayMinutes` to `0` whenever local `YYYY-MM-DD` differs from `todayDate`.)*

---

## Step-by-Step Implementation Plan

### 1. Create Standalone Module `assets/pomodoro.js`
Write a clean, dependency-free IIFE exposing `window.HubPomodoro`:
```js
window.HubPomodoro = {
  init,          // init({ subjects, getCurrentSubjectId, getStudyItems, onStudyChanged, topbarBtnEl })
  open,          // open({ subjectId? })
  close,         // close()
  toggle,        // toggle()
  isPanelOpen,   // () => boolean
  getSummary,    // () => { todayMinutes, totalMinutes, sessionsCount, bySubject, status }
};
```
Core responsibilities inside `assets/pomodoro.js`:
1. **DOM Mount (`#pomo-root` appended to `document.body`):**
   - **Floating Mini-Pill (`.pomo-pill`, `hidden` when idle or when panel is open):**
     - Shows: subject color dot + live monospace countdown (`24:35`, `dir="ltr"`) + status indicator (pulsing dot when running / `"متوقف"` when paused) + quick Pause/Resume button + Expand button.
   - **Expandable Timer Panel (`.pomo-panel`, anchored cleanly bottom-inline-end on desktop, centered bottom sheet on mobile ≤ 620px):**
     - **Header:** `"مؤقت التركيز"` + Mute/Unmute sound icon button (`hub:pomoMuted`) + Minimize/Close button (`×`).
     - **View A — Setup / Running / Paused (`status !== "completed"`):**
       - Mode pill: `جلسة تركيز` / `استراحة قصيرة (5 د)`.
       - Crisp circular or progress-bar timer display (`25:00`, `dir="ltr"`), tinted with the selected subject's `--pomo-accent`.
       - **Subject picker (`<select data-pomo-subject>`):** All 5 subjects (disabled or switchable anytime — allowing switching even while paused/running is super friendly!).
       - **Duration presets (when idle):** `15 د` · `25 د` · `45 د` · `50 د` + compact custom minutes input (`min="5" max="120"`).
       - **Controls:**
         - Idle: **`ابدأ التركيز`** (primary) + **`استراحة 5 د`** (ghost).
         - Running: **`إيقاف مؤقت`** + **`خلصت بدري`** (enabled once ≥ 1 minute elapsed) + **`إعادة ضبط`**.
         - Paused: **`استئناف`** + **`خلصت بدري`** (if ≥ 1 min elapsed) + **`إعادة ضبط`**.
       - **Footer stats line:** `اليوم: X دقيقة · المادة: Y دقيقة` (hidden or `جاهز لأول جلسة تركيز اليوم` if 0).
     - **View B — Completion Confirmation Card (`status === "completed"` & `completedPending`):**
       - Header badge: **`🎉 عاش! خلّصت ${minutes} دقيقة تركيز`**
       - **Reassignable Subject Dropdown (`<select data-pomo-assign-subject>`):** Defaults to `completedPending.subjectId`; changing it immediately switches the lecture checklist below to that subject's lectures!
       - **Lecture Check-In List:**
         - Calls `getStudyItems(selectedSubjectId)`.
         - Shows all **unstudied** lectures/chapters as tappable checklist rows (`<label class="pomo-lec-item"><input type="checkbox" value="${esc(item.key)}"><span>${esc(item.label)}</span></label>`).
         - If some lectures are already studied, shows a small subtle toggle `"عرض المحاضرات المتذاكرة (${studiedCount})"` so they can verify or uncheck if needed.
         - If ALL lectures in that subject are already studied, displays `"🎉 ما شاء الله! خلّصت كل محاضرات المادة دي!"`.
       - **Actions:**
         - **`تأكيد وحفظ`** (primary): logs `minutes` to `hub:focusLog` under the chosen `assignSubjectId`, marks all checked lecture keys as `true` in `hub:studied`, calls `onStudyChanged(assignSubjectId)`, clears `completedPending`, dispatches `hub:focus-updated`, and transitions to a crisp post-save state (with 1-tap **`استراحة 5 د`** or **`إغلاق`**!).
         - **`مراجعة فقط (بدون تعليم محاضرات)`** (ghost): still logs `minutes` to `hub:focusLog` under `assignSubjectId`, clears `completedPending`, closes cleanly!
2. **Topbar Button Live Sync (`topbarBtnEl`):**
   - When idle: shows clean timer SVG icon only (`classList.remove("is-running", "is-paused")`), badge hidden.
   - When running/paused: adds `.is-running` / `.is-paused` and shows compact live `MM:SS` badge (`#pomo-top-time`) right inside/next to the button!
   - When `status === "completed"`: pulses gently with `"✓"` badge until confirmed!
3. **Web Audio Chime (`playChime()`):**
   - Skips if `store.get("hub:pomoMuted") === "1"`.
   - Plays two gentle sine tones (`523.25Hz` for 180ms, then `659.25Hz` for 280ms with smooth exponential fade-out) inside `try/catch`.

### 2. HTML Integration (`index.html`)
- Inside `.top-actions` (`index.html:41-65`, right after `#notif-wrap` and before `#sidebar-toggle`):
  ```html
  <button id="pomo-toggle" class="icon-btn pomo-toggle" type="button" title="مؤقت التركيز (Pomodoro)" aria-label="مؤقت التركيز" aria-expanded="false">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="13" r="7.5" stroke="currentColor" stroke-width="1.7"/><path d="M12 9.2V13l2.6 1.6M9.5 3h5M12 3v2.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span class="pomo-top-time" id="pomo-top-time" dir="ltr" hidden></span>
  </button>
  ```
- Load `assets/pomodoro.js` right before `assets/app.js` (`index.html:167-168`):
  ```html
  <script src="assets/pomodoro.js?v=20261119g"></script>
  <script src="assets/app.js?v=20261119g"></script>
  ```
- Bump `?v=` on `assets/styles.css` to `?v=20261119g`.

### 3. Wire Up Hooks in `assets/app.js`
Minimal, clean integration (~35 lines total in `app.js`):
1. **Single-source study items helper `getStudyItemsForSubject(subjectId)`:**
   - Reads `studiedMap = getStudied()`.
   - If `subjectId === "computer-networks"`: returns the exact 9 tracked units (`atwan-ch1..7`, `mahfouz-ch1..2`) with their Arabic/English short titles and `studied: Boolean(studiedMap["computer-networks:" + unit.id])`.
   - Else: gets `subject = subjectById(subjectId)`, `total = lectureTotal(subject)`, returns `1..total` with `{ key: `${subjectId}:${i}`, label: `محاضرة ${i}`, studied: Boolean(studiedMap[`${subjectId}:${i}`]) }`.
2. **Sync callback `syncStudyFromExternal(subjectId)`:**
   - If currently viewing `subjectId` (and not searching, `!state.feature`):
     - Reads fresh `studiedMap = getStudied()`.
     - Updates every `[data-study^="${CSS.escape(subjectId)}:"]` checkbox's `.checked` and closest `.lec-card, .matrix-row, .file`'s `.is-studied` class, then calls `updateStudyProgress(subjectId)`!
   - If `state.feature === "home"`: calls `renderHome()` cleanly so overall semester progress & studied badges update immediately!
3. **Quick-launch button inside `.home-hero-actions` (`assets/app.js:3351`):**
   - Render a clean button inside `.home-hero-actions`:
     ```js
     const focusSummary = window.HubPomodoro?.getSummary?.();
     const focusMeta = focusSummary?.todayMinutes ? ` · ${focusSummary.todayMinutes} د اليوم` : "";
     ```
     ```html
     <div class="home-hero-actions">
       <button class="btn btn-sm home-pomo-btn" type="button" data-open-pomodoro="1">
         ${ICONS.clock}<span>جلسة تركيز${esc(focusMeta)}</span>
       </button>
     </div>
     ```
   - In `viewEl` click handler: `[data-open-pomodoro]` calls `window.HubPomodoro?.open?.()`.
   - Listen to `window.addEventListener("hub:focus-updated", () => { if (state.feature === "home") renderHome(); })` (or update just the `.home-pomo-btn` text in place!).
4. **Initialize in `boot()` (`assets/app.js` right after `HubQuiz?.init`):**
   ```js
   window.HubPomodoro?.init({
     subjects: state.data.subjects,
     getCurrentSubjectId: () => (!state.feature ? state.subjectId : null),
     getStudyItems: getStudyItemsForSubject,
     onStudyChanged: syncStudyFromExternal,
     topbarBtnEl: $("#pomo-toggle"),
   });
   ```
5. **Escape key priority (`assets/app.js` keydown handler):**
   - Check `if (window.HubPomodoro?.isPanelOpen?.()) { window.HubPomodoro.close(); return; }` **before** closing `#modal`!

### 4. Styles (`assets/styles.css`)
Add sleek, calm, light + dark mode styles for Pomodoro:
- `.pomo-toggle`: matches `.icon-btn`; when `.is-running` or `.is-paused`, expands smoothly into a compact pill showing the icon + `.pomo-top-time` (`font-variant-numeric: tabular-nums; font-size: 12px; font-weight: 700;`) tinted with `--accent` (or green/amber when completed).
- `.pomo-pill`: `position: fixed; bottom: 16px; inset-inline-end: 16px; z-index: 160;` rounded floating pill with subtle glass/surface backdrop, `box-shadow: var(--shadow-lg)`, subject dot, tabular countdown digits, pause & expand buttons. (`[hidden] { display: none; }`).
- `.pomo-panel`: `position: fixed; bottom: 16px; inset-inline-end: 16px; z-index: 160; width: min(360px, calc(100vw - 24px)); max-height: calc(100dvh - 32px); overflow-y: auto;` — elevated card matching `--surface`, `--border`, `--radius`, `--shadow-lg`.
- Timer display (`.pomo-clock`): large clean `font-size: 38px; font-weight: 800; font-variant-numeric: tabular-nums;` + slim `.pomo-progress` bar tinted with `--pomo-accent`.
- Duration preset chips (`.pomo-presets`, `.pomo-preset.is-active`).
- Completion checklist (`.pomo-lec-list`, `max-height: 190px; overflow-y: auto;`, `.pomo-lec-item` tappable rows with green check accent).
- **Mobile (`@media (max-width: 620px)`):**
  - `.pomo-panel`: `inset-inline: 12px; bottom: 12px; width: auto;` (clean floating bottom card, zero horizontal overflow).
  - `.pomo-pill`: `bottom: 12px; inset-inline-end: 12px;`.

---

## Verification Checklist (Final Revamp Sign-Off!)

### Automated CLI Checks
```powershell
node --check assets/pomodoro.js
node --check assets/app.js
node --check assets/quiz.js
node scripts/build.mjs --check
```

### Browser Functional & Visual Checks
1. **Zero Clutter When Idle:**
   - Load `#home` fresh → confirm NO floating pill is visible on screen; only the topbar timer icon and the subtle `"جلسة تركيز"` button in `.home-hero-actions` appear.
2. **Smart Subject Auto-Select & Background Persistence:**
   - Open `#database-2`, click the topbar timer icon → confirm `قواعد البيانات` is auto-selected!
   - Pick `25 د` and click `ابدأ التركيز` → minimize panel → confirm Floating Mini-Pill appears cleanly at bottom corner AND topbar button shows live `24:xx`.
   - Open any PDF inside `#modal` → confirm the Floating Mini-Pill stays visible and clickable **above** the PDF modal (`z-index: 160 > 100`) without covering `#modal`'s close button!
   - Press `Escape` while Pomodoro panel is open over `#modal` → confirm ONLY Pomodoro panel closes while the PDF stays open!
   - Navigate to `#practice` and start a quiz → confirm timer keeps running uninterrupted!
   - Refresh the page (`F5`) → confirm timer resumes at the exact remaining wall-clock time without resetting!
3. **Completion Loop & `hub:studied` Sync (Test Both Standard Subject + Computer Networks!):**
   - Test rapid completion (e.g. temporarily set `endAt = Date.now() + 2000` in DevTools `hub:pomoState` or run 1 min and click `خلصت بدري`):
     - Completion card pops up cleanly with soft chime (respects mute button!).
     - Switch assigned subject dropdown to `شبكات الحاسب` → confirm the checklist displays Computer Networks' real 9 chapters (`Ch 01..Ch 07` + `د. محفوظ Ch 01..02`)!
     - Check off 1 chapter (e.g. `Ch 02: Data Communication`) and click `تأكيد وحفظ` → navigate to `#computer-networks` → confirm `Ch 02` is marked **`تمت المذاكرة`** (green `.is-studied`) and progress bar incremented!
     - Repeat for a standard subject (`database-2` Lecture 3) while currently on `#database-2` → confirm Lecture 3 turns green and progress bar updates **live without reload**!
4. **Focus Log Persistence:**
   - Confirm `hub:focusLog` increments `todayMinutes`, `totalMinutes`, and `bySubject[subjectId]`, and `#home`'s button updates to `جلسة تركيز · X د اليوم`.
5. **Mobile (375px) + Dark Mode:**
   - Test topbar icon, floating pill over mobile PDF.js viewer, expanded panel, and completion checklist in Light & Dark modes with zero horizontal overflow.
