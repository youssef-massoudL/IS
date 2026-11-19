# Revamp Feature 02 — Collapsible Lectures Across All Subjects

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Depends On:** Feature 01 (`Plans/revamp-01-post-midterm-cleanup.md` — completed & verified)  
**Architect / Lead:** Antigravity

---

## Goal

Make **every lecture (and every chapter/unit in Computer Networks)** cleanly **collapsible** across all 5 subjects, while simultaneously **eliminating horizontal table scrolling on mobile**:
1. Replace the always-open 5-column / 4-column horizontal-scroll table rows (`.matrix-row`) with **collapsible Lecture Cards (`.lec-card`)** in both standard subjects (`renderMatrix`) and Computer Networks (`renderNetworksUnitTable` / `renderNetworksHub`).
2. Each collapsed card clearly shows at a glance:
   - Lecture / Chapter badge (`1`, `2`, `Ch1`, `Lec`) + Title (+ subtitle for Networks)
   - Compact availability pills showing what files exist inside (`محاضرة 1`, `ملخص 1`, `أسئلة 2`, `حل 1` — only showing non-empty slots, or `لا توجد ملفات` if empty)
   - Independent **`تمت المذاكرة`** checkbox (works **without** toggling the card open/closed!)
   - Chevron toggle indicator
3. Expanding a card reveals a clean responsive slot grid:
   - **Desktop (≥ 900px):** 4 columns (`المحاضرة` · `الملخص` · `الأسئلة` · `الحل`) for standard subjects, 3 columns (`الكتاب / السلايدز` · `الملخص` · `الأسئلة والحل`) for Computer Networks.
   - **Tablet (600px–899px):** 2 columns.
   - **Mobile (≤ 599px):** 1 column stacked — **zero horizontal overflow/scrolling**.
4. Smart default open state + persistence (`hub:lecOpen` in `localStorage`) + a **`فتح الكل / طي الكل`** bulk toggle button in `.subject-toolbar`.
5. Deep-link support for `#<subjectId>/lec-<N>` (and `#<subjectId>/unit-<id>`) so upcoming Feature 06 (Landing Page) and Feature 07 (Pomodoro) can jump directly to and auto-open any lecture card.

---

## Critical Gotchas (مطبات حرجة — MUST Handle Explicitly)

1. **Nested `.section` chevron CSS leak in `computer-networks` (`assets/styles.css:793`):**
   - Line 793 currently has `.section[data-open="true"] .chevron { transform: rotate(180deg); }` (descendant selector!).
   - In `computer-networks`, `.lec-card` lives **inside** `<section class="section net-track" data-open="true">`. If `.lec-card` reuses `.chevron`, every closed chapter card's arrow will render upside down!
   - **Required fix (do BOTH):**
     - Scope line 793 to `.section[data-open="true"] > .section-head .chevron { transform: rotate(180deg); }`.
     - Use `.lec-chevron` on lecture cards with `.lec-card[data-open="true"] .lec-chevron { transform: rotate(180deg); }`.
2. **NEVER nest `<label class="study-check"><input type="checkbox">` inside `<button>`:**
   - HTML5 forbids interactive elements inside `<button>`, and clicking "تمت المذاكرة" would break or accidentally toggle the accordion.
   - **Required DOM structure:** Inside `.lec-card-head` (`display: flex`), put `<button class="lec-card-toggle" type="button">` as the main clickable title/pills trigger (`flex: 1; min-width: 0;`), and place `<div class="lec-head-end">` as a **sibling** containing `${studyHtml}` + `<button class="lec-chevron-btn" type="button" data-lec-toggle ...>`.
3. **Update `is-studied` checkbox handler (`assets/app.js:2738`):**
   - Currently line 2738 does `const row = checkbox.closest(".matrix-row, .file");`.
   - **Required fix:** Update to `const row = checkbox.closest(".lec-card, .matrix-row, .file");` so toggling "تمت المذاكرة" immediately toggles `.is-studied` styling on `.lec-card` and updates the progress bar via `updateStudyProgress(subjectId)`!
   - Also keep `updateStudyProgress(subjectId)` (`assets/app.js:1286-1305`) working identically — it queries `[data-study^="${subjectId}:"]`, which stays unchanged.
4. **Preserve `#<subjectId>/lectures` deep link & Scroll-Spy (`assets/app.js:1630, 2523`):**
   - Keep `id="sec-matrix" data-spy-section="matrix" data-spy-label="جدول المحاضرات"` on the `.lec-list` container, and update line 2523 (`viewEl.querySelector(".matrix-wrap")`) to `viewEl.querySelector("#sec-matrix, .lec-list, .matrix-wrap")`.
5. **Fix `extraSection` ("مراجع وملفات إضافية") missing chevron & state (`assets/app.js:1641-1652`):**
   - Currently `extraSection` hardcodes `data-open="true"` and omits `<svg class="chevron">`.
   - Update it to read `const extraOpen = store.get(\`section:${subject.id}:extra\`) !== "closed";` (or `store.get("section:extra") !== "closed"`), set `data-open="${extraOpen}"` / `aria-expanded="${extraOpen}"`, and include the standard `<svg class="chevron">` icon so it collapses cleanly too.
6. **Smart Default Open State (Don't start all open, don't start all closed!):**
   - Persist explicit user toggles in `localStorage` key `hub:lecOpen` as a JSON map `{ "<cardKey>": true | false }`, where `cardKey = "${subject.id}:${lecture}"` (standard subjects) or `"${subject.id}:${unit.id}"` (Computer Networks).
   - **When a subject has NO saved keys in `hub:lecOpen` yet:**
     - Auto-open **ONLY 1 card**: the **first unstudied** lecture/unit (`!studiedMap[cardKey]` among study-tracked cards), or if all are studied, the **last** lecture/unit. Every other card starts collapsed (`data-open="false"`).
     - Note for `computer-networks`: compute that 1 default open card across Atwan + Mahfouz together (the 9 tracked units: `atwan-ch1..7`, `mahfouz-ch1..2`), so only 1 chapter opens by default across the whole Networks page!
   - Once the user clicks any card or uses "فتح الكل / طي الكل", persist their choice in `hub:lecOpen`.
7. **Bulk "فتح الكل / طي الكل" + Networks Outer Tracks:**
   - When the user clicks **`فتح كل المحاضرات`** inside `computer-networks`, also ensure `#sec-atwan` and `#sec-mahfouz` have `data-open="true"` (and `aria-expanded="true"`) so the opened chapters are immediately visible!
   - Sync the bulk button label dynamically whenever **any** single `.lec-card` is toggled: if all `.lec-card` elements in `viewEl` have `data-open="true"` → show `"طي كل المحاضرات"`, otherwise → show `"فتح كل المحاضرات"`.
8. **Zero Horizontal Overflow on 360px Mobile:**
   - Remove the old `min-width: 940px` / `820px` / `680px` / `840px` table widths on the new `.lec-list` / `.lec-card` containers.
   - Apply `min-width: 0` on `.lec-card`, `.lec-card-head`, `.lec-card-toggle`, `.lec-head-main`, `.lec-slot`, `.cell-files`, `.file.file-compact`, and `.file-main` so long English filenames wrap/ellipsis cleanly without forcing horizontal scroll.

---

## Step-by-Step Implementation Plan

### 1. Lecture Collapse State Helpers (`assets/app.js`)
Add clean helpers right near `getStudied()` (`assets/app.js:1240`):
- `const LEC_OPEN_KEY = "hub:lecOpen";`
- `getLecOpenMap()`: safely reads JSON object `{}` from `store.getJson(LEC_OPEN_KEY, {})`.
- `saveLecOpenMap(map)`: writes to `store.setJson(LEC_OPEN_KEY, map)`.
- `resolveInitialLecOpen(subjectId, cardKeys, studiedMap)`:
  - Reads `openMap = getLecOpenMap()`.
  - Checks if `cardKeys.some((k) => Object.prototype.hasOwnProperty.call(openMap, k))`.
  - If **yes** (user has saved prefs for this subject): returns a `Set` of keys where `openMap[k] === true`.
  - If **no** (first visit to this subject): picks the **first** key in `cardKeys` that is NOT in `studiedMap` (fallback: the **last** key in `cardKeys`), and returns `new Set([defaultKey])`.
- `setLecCardOpen(cardEl, open, { persist = true } = {})`:
  - Updates `cardEl.dataset.open = String(open)`.
  - Updates `aria-expanded` on all `[data-lec-toggle]` / `.lec-card-toggle` buttons inside `cardEl`.
  - Updates `bodyEl.hidden = !open` on `.lec-card-body`.
  - If `persist && cardEl.dataset.lecCard`: updates `openMap[cardEl.dataset.lecCard] = Boolean(open)` and saves.
- `syncBulkLecturesButton()`:
  - Finds `[data-lectures-toggle-all]` inside `viewEl` and all `.lec-card` elements.
  - If no `.lec-card` exists, hides the button.
  - Otherwise computes `allOpen = cards.every((c) => c.dataset.open === "true")`, sets `btn.dataset.allOpen = String(allOpen)`, `btn.setAttribute("aria-pressed", String(allOpen))`, and updates its label span to `allOpen ? "طي كل المحاضرات" : "فتح كل المحاضرات"`.

### 2. Shared Collapsible Lecture Card Renderer (`assets/app.js`)
Create a single reusable renderer `renderLectureCard(config)` used by **both** `renderMatrix()` and `renderNetworksUnitTable()`:
```js
// config shape:
// {
//   cardKey,       // e.g. "database-2:3" or "computer-networks:atwan-ch1"
//   domId,         // e.g. "lec-card-database-2-3" (safe slug for id & aria-controls)
//   badge,         // e.g. "3" or "Ch1" or "Lec"
//   title,         // e.g. "محاضرة 3" or "Ch 01: Introduction to Networks"
//   sub,           // optional subtitle (Networks)
//   studied,       // boolean
//   studyHtml,     // optional <label class="study-check">...</label>
//   open,          // boolean
//   columns,       // array of { key, label, icon, files } (4 cols standard, 3 cols Networks)
//   subject,       // subject object for renderMatrixSlot
//   dataAttrs,     // e.g. 'data-lecture="3"' or 'data-unit="atwan-ch1"'
// }
```
- **Header pills (`.lec-slot-pills`):**
  - For each column in `columns` where `col.files.length > 0`, render `<span class="lec-slot-pill" data-slot-kind="${esc(col.key)}">${esc(col.label)} <b>${col.files.length}</b></span>`.
  - If all columns are empty, render `<span class="lec-slot-pill is-empty">لا توجد ملفات بعد</span>`.
- **Card body (`.lec-card-body`):**
  - Renders `<div class="lec-slots lec-slots-${columns.length}">` containing one `<div class="lec-slot${col.files.length ? "" : " is-empty"}" data-slot="${esc(col.key)}">` per column:
    - Slot header: `<div class="lec-slot-head">${col.icon}<span>${esc(col.label)}</span>${col.files.length ? `<span class="lec-slot-count">${col.files.length}</span>` : ""}</div>`
    - Slot body: `${renderMatrixSlot(col.files, subject)}`

### 3. Update `renderMatrix()` (`assets/app.js:1578-1658`)
- Collect `cardKeys = Array.from({ length: lectureCount }, (_, i) => `${subject.id}:${i + 1}`)`.
- Compute `openSet = resolveInitialLecOpen(subject.id, cardKeys, studiedMap)`.
- For each `lecture = 1..lectureCount`, render via `renderLectureCard(...)` with the 4 standard columns:
  - `{ key: "lecture", label: "المحاضرة", icon: ICONS.lecture, files: slots.lecture }`
  - `{ key: "summary", label: "الملخص", icon: ICONS.summary, files: slots.summary }`
  - `{ key: "questions", label: "الأسئلة", icon: ICONS.question, files: slots.questions }`
  - `{ key: "solution", label: "الحل", icon: ICONS.check, files: slots.solution }`
- Wrap all lecture cards in:
  ```html
  <div class="lec-list" id="sec-matrix" data-spy-section="matrix" data-spy-label="جدول المحاضرات">
    ${cards.join("")}
  </div>
  ```
- Fix `extraSection` (`#sec-extra`) to use saved open state + `<svg class="chevron">`.

### 4. Update `renderNetworksUnitTable()` & `renderNetworksHub()` (`assets/app.js:1704-1840`)
- Pass `openSet` into `renderNetworksUnitTable()` (computed once in `renderNetworksHub()` via `resolveInitialLecOpen("computer-networks", trackedUnitKeys, studiedMap)` so only 1 chapter is expanded by default across Atwan + Mahfouz!).
- Replace the old `.net-matrix` table markup with `<div class="lec-list net-lec-list">` containing `renderLectureCard(...)` items with 3 columns matching `colLabels`:
  - `{ key: "book", label: colLabels[1], icon: ICONS.book, files: slots.book }`
  - `{ key: "summary", label: colLabels[2], icon: ICONS.summary, files: slots.summary }`
  - `{ key: "qa", label: colLabels[3], icon: ICONS.question, files: slots.qa }`

### 5. Bulk Toggle Button in `renderSubject()` (`assets/app.js:1842-1871`)
- In `.subject-toolbar`, when `useMatrix` is true, add a second button right next to `[data-view-toggle]`:
  ```html
  <button class="btn btn-sm" type="button" data-lectures-toggle-all="1" aria-pressed="false">
    <span>فتح كل المحاضرات</span>
  </button>
  ```
- Call `syncBulkLecturesButton()` at the end of `renderSubject(subject)` so the initial button label is always accurate (e.g., if the user previously expanded all lectures).

### 6. Event Handlers & Deep-Link Support (`assets/app.js`)
- **Click delegation in `viewEl.addEventListener("click", ...)`:**
  - Handle `[data-lec-toggle], .lec-card-toggle`:
    - Find `card = target.closest(".lec-card")`, toggle `card.dataset.open !== "true"` via `setLecCardOpen(card, nextOpen, { persist: true })`, then call `syncBulkLecturesButton()`.
  - Handle `[data-lectures-toggle-all]`:
    - Determine `openNext = btn.dataset.allOpen !== "true"`.
    - If `openNext` and `state.subjectId === "computer-networks"`, open `#sec-atwan` and `#sec-mahfouz` first (`dataset.open = "true"`, `aria-expanded = "true"`, `store.set(...)`).
    - Batch-update all `.lec-card` elements in `viewEl` via `setLecCardOpen(card, openNext, { persist: false })`, save all their keys into `hub:lecOpen` in a single `saveLecOpenMap()` write, then call `syncBulkLecturesButton()`.
- **Checkbox change handler (`assets/app.js:2738`):**
  - Update `checkbox.closest(".matrix-row, .file")` → `checkbox.closest(".lec-card, .matrix-row, .file")`.
- **Deep-link support in `route()` (`assets/app.js:2508-2526`):**
  - If `parsed.sectionId` matches `/^lec-(\d+)$/`: find `.lec-card[data-lecture="${match[1]}"]`, call `setLecCardOpen(card, true, { persist: false })`, `syncBulkLecturesButton()`, and scroll it into view!
  - If `parsed.sectionId` matches `/^unit-(.+)$/`: find `.lec-card[data-unit="${CSS.escape(match[1])}"]`, ensure its parent `.section.net-track` is open, call `setLecCardOpen(card, true, { persist: false })`, `syncBulkLecturesButton()`, and scroll it into view!
  - Update fallback selector for `parsed.sectionId === "lectures"` to `viewEl.querySelector("#sec-matrix, .lec-list, .matrix-wrap")`.

### 7. Styles (`assets/styles.css`) & Cache Bust (`index.html`)
- Fix `.section[data-open="true"] .chevron` (line 793) → `.section[data-open="true"] > .section-head .chevron`.
- Update `.subject-toolbar` (line 2414) to include `gap: 8px; flex-wrap: wrap;`.
- Add clean, cohesive styles for:
  - `.lec-list` (`display: grid; gap: 10px; scroll-margin-top: calc(var(--header-h) + 14px);`)
  - `.lec-card` (bordered card matching `--surface`, `--border`, `--radius`, `--shadow-sm`; `.lec-card.is-studied` subtle green tint + green `.lec-number`; subtle accent highlight on hover / open)
  - `.lec-card-head` (`display: flex; align-items: center; gap: 10px; padding: 10px 12px;`)
  - `.lec-card-toggle` (button reset, `flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; text-align: start; cursor: pointer; background: transparent; border: 0; color: inherit; font: inherit;`)
  - `.lec-head-main` (`min-width: 0; display: flex; flex-direction: column; gap: 4px;`)
  - `.lec-slot-pills` (`display: flex; flex-wrap: wrap; gap: 5px;`) & `.lec-slot-pill` (compact muted pill with count `<b>`, muted `.is-empty` variant)
  - `.lec-head-end` (`display: flex; align-items: center; gap: 10px; flex: none;`)
  - `.lec-chevron-btn` (32×32 icon button, transparent hover surface, smooth `.lec-chevron` rotation when `.lec-card[data-open="true"]`)
  - `.lec-card-body` (`border-top: 1px solid color-mix(in srgb, var(--border) 75%, transparent); padding: 12px; background: color-mix(in srgb, var(--surface-2) 55%, var(--surface));`) and `.lec-card-body[hidden] { display: none; }`
  - `.lec-slots` (`display: grid; gap: 10px;`), `.lec-slots-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }`, `.lec-slots-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }`
  - `.lec-slot` (`min-width: 0; display: flex; flex-direction: column; gap: 6px; padding: 9px; border: 1px solid color-mix(in srgb, var(--border) 80%, transparent); border-radius: 10px; background: var(--surface);`)
  - `.lec-slot.is-empty` (subtle muted background, compact single-line `.cell-empty` padding `8px 6px`)
  - `.lec-slot-head` (`display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--text-soft);`) with `svg { width: 14px; height: 14px; color: var(--accent); }`
  - **Responsive breakpoints:**
    - `@media (max-width: 960px)`: `.lec-slots-4, .lec-slots-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }`
    - `@media (max-width: 620px)`:
      - `.lec-slots-4, .lec-slots-3 { grid-template-columns: 1fr; }`
      - `.lec-card-head { flex-wrap: wrap; gap: 8px; padding: 10px; }`
      - `.lec-head-end { width: 100%; justify-content: space-between; padding-top: 6px; border-top: 1px dashed color-mix(in srgb, var(--border) 70%, transparent); }` (keeps checkbox comfortably tappable on narrow 360px phones without squishing long titles!)
      - Hide empty `.lec-slot.is-empty`? **Better UX:** keep empty slots collapsed to a compact inline row (`flex-direction: row; justify-content: space-between; align-items: center; padding: 7px 9px;`) on mobile so the user still sees e.g. `الحل · غير متاح حالياً` in 1 crisp line without wasting vertical space!
- Support both Light & Dark theme cleanly using existing CSS variables (`--surface`, `--surface-2`, `--border`, `--text`, `--text-soft`, `--muted`, `--accent`, `--success`, `--success-soft`).
- Bump `?v=` cache-busting query strings on `assets/styles.css` and `assets/app.js` in `index.html` (e.g., `?v=20261119b`).

---

## Verification Checklist (Must All Pass Before Moving to Feature 03)

### Automated CLI Checks
```powershell
node --check assets/app.js
node scripts/build.mjs --check
```

### Browser Functional & Visual Checks
1. **Default state (fresh localStorage or clear `hub:lecOpen`):**
   - Open each of the 5 subjects → confirm **only 1 lecture/chapter** is expanded by default (the first unstudied one, or the latest if all studied), and all other lectures are cleanly collapsed.
2. **Collapse/Expand & Persistence:**
   - Click a collapsed lecture title/header → expands smoothly; chevron rotates 180°.
   - Refresh the page → exact expanded/collapsed cards are remembered.
3. **Checkbox Isolation:**
   - Click **`تمت المذاكرة`** on a **collapsed** lecture → card turns green (`.is-studied`), progress bar increments, and the card stays **collapsed** (does NOT accidentally toggle open!).
   - Click **`تمت المذاكرة`** on an **expanded** lecture → card stays **expanded**.
4. **Computer Networks Nested Accordions:**
   - Inside `#computer-networks`, expand `#sec-atwan` → verify closed chapter cards (`Ch2`, `Ch3`, …) have their `.lec-chevron` pointing **down** (NOT rotated upside down by `.section[data-open="true"]`!).
   - Verify `atwan-lec1-3` and `atwan-lec4-5` render cleanly without a study checkbox.
   - Collapse `#sec-atwan`, then click **`فتح كل المحاضرات`** → `#sec-atwan`, `#sec-mahfouz`, and all 11 unit cards open together!
5. **Bulk Toggle Button:**
   - Click `فتح كل المحاضرات` → all cards open and label switches to `طي كل المحاضرات`.
   - Manually close 1 card → label switches back to `فتح كل المحاضرات`.
6. **Classic View & Extra Section:**
   - Switch to `عرض كأقسام كلاسيكية` → bulk lecture button hides cleanly, Classic sections still collapse/expand normally.
   - In Matrix view, check `#sec-extra` ("مراجع وملفات إضافية") collapses/expands with its chevron working.
7. **Deep Links:**
   - Navigate to `#database-2/lec-4` → Lecture 4 expands automatically and scrolls into view.
   - Navigate to `#computer-networks/unit-mahfouz-ch2` → Mahfouz track + Ch2 expand and scroll into view.
8. **Mobile (375px) + Dark Mode:**
   - Confirm **zero horizontal page/container overflow** across all 5 subjects, readable Arabic/English filenames, easy checkbox tapping, and clean dark mode contrast.
