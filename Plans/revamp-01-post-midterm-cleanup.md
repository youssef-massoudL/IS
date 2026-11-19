# Revamp Feature 01 — Post-Midterm Cleanup & Subject Page Restructure

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Depends On:** None (Foundation feature — must ship before Features 02–07)  
**Architect / Lead:** Antigravity

---

## Goal

Transition the site from a temporary **Midterm Revision** setup to a clean **long-term semester hub**:
1. Remove the red pinned **"مراجعة الميد"** tab (`midterm-revision` virtual subject) from the Lectures bar while keeping **100% of every review file inside its own subject**.
2. Move the **"المراجعات والملفات الشاملة"** block **below** the lectures table in every subject, and remove the `★ مهم` badge from it.
3. Update **معلومات المادة (`renderCourseInfo`)**: remove `درجة الميدترم` and `نطاق الميدترم` (and remove `"في الميدترم"` / `"مقرر بالامتحان"` badges on lectures), and show **الدرجات المتبقية** per subject out of **100 total marks**.
4. Remove **committee hall distribution files** (`committees` sections, `files/committees/`, `hallsFile`/`halls` in `schedule.json`) and remove the **"افتكر شوف مكان امتحانك"** (`#exam-news`) banner and expired midterm notifications.

---

## Critical Gotchas (مطبات حرجة — MUST Handle Explicitly)

1. **`renderMatrix()` currently pulls review files from the deleted `midterm-revision` subject (`assets/app.js:1748-1785`):**
   - Currently, `database-2`, `information-theory`, and `research-methods` populate `reviewFiles` by reading `subjectById("midterm-revision")` (`curatedFiles`).
   - If you delete the top-level `midterm-revision` subject without refactoring `renderMatrix()`, **all review files vanish** in those 3 subjects.
   - **Verified fact:** All 5 subjects already contain all their review files inside their own `section.id === "midterm-revision"` (with `docTag` and `info` intact).
   - **Required fix:** Refactor `renderMatrix()` to read `reviewFiles` directly from the subject's own `midterm-revision` section (`subject.sections.find(s => s.id === "midterm-revision")?.files || []`), deduped by `file.path` — matching how `renderNetworksHub()` already works!
2. **Don't lose unnumbered books / general question banks (`extraFiles` in `assets/app.js:1786-1796`):**
   - Previously `extraFiles` only checked `["computer-networks", "database-2", "information-theory"]`, silently skipping unnumbered books/banks in `research-methods` (`research-dr-hala-okasha`, general MCQs) and `system-analysis` (`system-analysis-book`).
   - **Required fix:** Compute `extraFiles` for **all** standard subjects in `renderMatrix()` as any file NOT in `reviewSet`, NOT numbered (`!Number.isInteger(file.lecture)` and no non-empty `file.lectureSpan`). Render them in the collapsible **"مراجع وملفات إضافية"** section below the review block (or below lectures).
3. **Ghost empty Lecture 7 row in `information-theory` (`assets/app.js:1386-1392`):**
   - `lectureTotal(subject)` currently merges `coursesMeta[subject.id].midtermLectures` with `maxLecture(subject)`. Once `midtermLectures` is removed, simplify `lectureTotal(subject)` to simply return `maxLecture(subject)` so no phantom empty lecture rows appear.
4. **`scripts/build.mjs` orphan/committee checks (`scripts/build.mjs:9, 300, 331-335`):**
   - `build.mjs` currently ignores `files/committees/` and validates `midterm.hallsFile`.
   - Delete `files/committees/` AND remove `COMMITTEES` + the `hallsFile` loop in `build.mjs`, then run `node scripts/build.mjs` so `assets/data.js` is regenerated cleanly and `node scripts/build.mjs --check` exits `0`.
5. **`downloads/midterm-revision.zip` & `.gitkeep`:**
   - Remove `downloads/midterm-revision.zip`. Note that `scripts/build-zips.ps1` deletes and recreates `downloads/`, so if you run it (or manually remove `midterm-revision.zip`), ensure `downloads/.gitkeep` remains preserved.
6. **Keep Telegram bot files synced and safe:**
   - Remove the dead top-level `midterm-revision` mirror block (`const midtermSubject = ...`) in **both** `bot/telegram-bot.mjs` and `scripts/telegram-bot.mjs` (keep them identical). Keep uploading to `${subject.id}/midterm-revision` intact so Hero/Review uploads still land inside each subject's review section!
7. **Old bookmarks / deep links & Search synonyms:**
   - If someone opens `#midterm-revision`, `route()` must gracefully fall back to `defaultSubjectId()` without errors (already happens once the subject is removed from `subjects.json`, verify no crash).
   - Keep `"ميدترم"` / `"midterm"` in `KIND_SYNONYMS` and `parseQuery()` so students searching `"ميدترم"` still find review files, while updating `KIND_LABELS.review` to `"مراجعة شاملة"` and the search facet chip label from `"مراجعة ميدترم"` to `"مراجعات شاملة"`.
   - Also keep `midtermScope()` safe (or simplify `parsed.midterm` in `fileMatchesFacetsAndQuery` / `questionMatchesFacetsAndQuery` to match `isReviewFile(file)` instead of relying on deleted `midtermLectures`!).

---

## Step-by-Step Implementation Plan

### 1. Data Manifest (`data/subjects.json`) & Files Cleanup
- **Delete the virtual top-level subject** `{ "id": "midterm-revision", ... }` from `manifest.subjects` (leaving the 5 real subjects: `computer-networks`, `database-2`, `information-theory`, `research-methods`, `system-analysis`).
- **Keep every subject's own `midterm-revision` section and all its files untouched** (verify file counts stay: `computer-networks: 5`, `database-2: 5`, `information-theory: 6`, `research-methods: 5`, `system-analysis: 5`).
  - Optional polish: rename each subject's `midterm-revision` section `name` to `"المراجعات والملفات الشاملة"` and `nameEn` to `"Comprehensive Reviews"` while keeping `"id": "midterm-revision"` so existing deep links (`#<subjectId>/midterm-revision`) and Telegram bot uploads never break!
- **Remove `"committees"` section** from `computer-networks`, `database-2`, and `information-theory` in `data/subjects.json`.
- **Delete** the directory `files/committees/` (3 PDFs) and delete `downloads/midterm-revision.zip`.

### 2. Schedule & Course Metadata (`data/schedule.json`)
- For each entry in `coursesMeta`, **remove**:
  - `midtermMarks`
  - `midtermLectures`
  - `midtermScopeText`
- For each entry in `coursesMeta`, **add**:
  - `totalMarks: 100`
  - `remainingMarks`: numeric value (`100 - midtermMarks`)
  - `remainingMarksText`: clear Arabic display string:
    - `system-analysis`: `"remainingMarks": 90`, `"remainingMarksText": "90 درجة متبقية من 100"`
    - `database-2`: `"remainingMarks": 90`, `"remainingMarksText": "90 درجة متبقية من 100"`
    - `computer-networks`: `"remainingMarks": 90`, `"remainingMarksText": "90 درجة متبقية من 100"`
    - `information-theory`: `"remainingMarks": 75`, `"remainingMarksText": "75 درجة متبقية من 100"`
    - `research-methods`: `"remainingMarks": 85`, `"remainingMarksText": "85 درجة متبقية من 100 (شاملة 10 درجات عرض البحث)"`
- In `schedule.midterms`: remove `hallsFile` and `halls` properties from all entries (NOTE: do **not** delete the `midterms` array itself yet if Feature 03 still cleans up `#sec-midterms`, or keep it minimal until Feature 03 removes `#sec-midterms` — just remove `hallsFile` and `halls` now so committee PDFs are completely gone).

### 3. Build Script (`scripts/build.mjs`)
- Remove `const COMMITTEES = path.join(FILES, "committees");` (line 9) and `if (path.resolve(full) === path.resolve(COMMITTEES)) continue;` (line 300).
- Remove the `hallsFile` validation loop (lines 331–335).
- Keep `sectionId === "midterm-revision"` in `isReviewItem()` (line 85) so files inside each subject's `midterm-revision` section continue to be classified as `kind: "review"`.
- Run `node scripts/build.mjs` to regenerate `assets/data.js`.

### 4. HTML (`index.html`)
- **Remove** the entire `#exam-news` block (lines 97–107, `"افتكر شوف مكان امتحانك"`).
- **Keep** `<div id="midterm-pin" class="midterm-pin"></div>` empty for now (CSS already has `.midterm-pin:empty { display: none; }` — we will repurpose this slot for the pinned `#home` tab in Feature 06), OR remove it cleanly if preferred (keeping the empty container avoids touching `.tabs-bar` CSS twice).
- Bump cache-busting query strings on `assets/styles.css?v=...`, `assets/data.js?v=...`, and `assets/app.js?v=...` (e.g., `?v=20261119a`).

### 5. Frontend Logic (`assets/app.js`)
Make the following exact, targeted changes:

1. **Remove deleted DOM refs & state:**
   - Remove `kanbanExpanded` from `state` (line 65).
   - Remove `examNewsEl`, `examNewsLinkEl`, `examNewsCloseEl` (lines 92–94), `EXAM_NEWS_SEEN_KEY` (line 918), `hideExamNews`, `activeExamNewsWindow`, `syncExamNewsVisibility`, `navigateToMidterm`, `pendingMidtermHighlight`, `midtermHighlightTimer`, `highlightNearestMidterm`, and all `examNews*` event listeners (lines 2631–2646, 2668–2671, 2764–2766, 3875–3944, 3981).
   - Remove `MIDTERM_TO_SUBJECT_ID`, `SUBJECT_TO_MIDTERM_SEC` (lines 660–674), `defaultMidtermKanbanSectionId` (lines 860–862), `renderMidtermKanban` (lines 1918–1959), and the `[data-kanban-toggle]` click listener (lines 3769–3782).
   - Remove `committees: "pin"` from `SECTION_ICONS` (line 39).
   - Remove `"midterm-revision"` entry from `SUBJECT_SYNONYMS` (line 206).

2. **Tabs & Routing (`renderTabs`, `renderSubject`, `defaultSubjectId`, `lectureTotal`):**
   - In `renderTabs()` (lines 1211–1298): no longer render a button inside `midtermPinEl` (ensure `midtermPinEl.innerHTML = ""` if present). `regularSubjects` is simply `state.data.subjects`.
   - In `renderSubject(subject)` (lines 2112–2147): remove the `subject.id === "midterm-revision"` branch; all subjects support Matrix/Classic view.
   - In `lectureTotal(subject)` (lines 1386–1392): simplify to `return maxLecture(subject);`.
   - In `defaultSubjectId()` (lines 864–888): simplify to return `subjectById("system-analysis")?.id || state.data?.subjects?.[0]?.id || null;` (since midterms have ended).

3. **Course Info (`renderCourseInfo`, lines 1686–1704):**
   - Replace the two midterm `.ci-item` blocks (`درجة الميدترم` and `نطاق الميدترم`) with a single clean item:
     ```html
     <div class="ci-item">
       <span class="ci-label">الدرجات المتبقية</span>
       <strong>${esc(meta.remainingMarksText || (meta.remainingMarks != null ? `${meta.remainingMarks} درجة من ${meta.totalMarks || 100}` : "غير محدد"))}</strong>
     </div>
     ```

4. **Review Block (`renderReviewBlock`, lines 1706–1730):**
   - Remove `<span class="important-badge">★ مهم</span>` from the heading!
   - Update heading text to `المراجعات والملفات الشاملة` and `data-spy-label="المراجعات والملفات الشاملة"`.
   - Default `open` state: keep collapsible (`const open = store.get("section:review") !== "closed";` or default closed? Wait — keep `store.get("section:review") !== "closed"` so existing behavior stays familiar, and students can collapse it anytime).

5. **Move Review Block BELOW Lectures & Remove Committees/Midterm Badges:**
   - **In `renderMatrix(subject)` (lines 1739–1872):**
     - Remove `midtermLectures` and `<span class="midterm-badge">في الميدترم</span>` (line 1818).
     - Remove `committeesSection` and `committeesMarkup` (lines 1745–1747, 1857–1865).
     - Build `reviewFiles` directly from `midtermSection?.files || []` (deduped by `path`).
     - Build `extraFiles` for **all** subjects as unnumbered files not in `reviewSet` (`!reviewSet.has(file.path) && !Number.isInteger(file.lecture) && !(Array.isArray(file.lectureSpan) && file.lectureSpan.length)`).
     - Return order — **Lectures FIRST, Review Block BELOW**:
       ```js
       return `${studyProgressMarkup(subject, studiedCount)}
         ${table}
         ${renderReviewBlock(subject, reviewFiles)}
         ${extraSection}`;
       ```
   - **In `renderNetworksHub(subject)` (lines 2014–2110):**
     - Remove `committeesSec` and `committeesMarkup` (lines 2020, 2024–2030, 2073).
     - Remove `inExam` badges (`<span class="midterm-badge">مقرر بالامتحان</span>` at line 1988, and `<span class="net-scope-pill is-included">...</span>` midterm scope pills at lines 2082 & 2103 — or replace with neutral count/subtitle if needed, no `"مقرر بالامتحان"`).
     - Return order — **Progress + Atwan + Mahfouz FIRST, Review Block BELOW**:
       ```js
       return `${studyProgressMarkup(subject, studiedCount, 9)}
         <section class="section net-track" id="sec-atwan" ...>...</section>
         <section class="section net-track" id="sec-mahfouz" ...>...</section>
         ${renderReviewBlock(subject, reviewFiles)}`;
       ```
   - **In `renderSmartStrip()` (lines 1135–1160):**
     - Remove `hallsFile`, `hallsGuide`, and the `[data-halls-pdf]` click listener (lines 1200–1209) so no dead committee PDF buttons exist even before Feature 03 replaces the midterm smart card.

6. **Notifications & Search Cleanup:**
   - In `buildNotifications()` (lines 961–1018): remove the midterm exam notification loop (`for (const midterm of state.schedule?.midterms || []) ...`) so expired midterm notifications are gone. (Keep the notification panel shell intact for future announcements/weekly tasks!)
   - In `KIND_LABELS` (line 157): change `review: "مراجعة ميدترم"` → `review: "مراجعة شاملة"`.
   - In `renderFacets()` (line 631): change `{ value: "review", label: "مراجعة ميدترم" }` → `{ value: "review", label: "مراجعات شاملة" }`.
   - In `fileMatchesFacetsAndQuery()` (lines 511–514): change `if (parsed.midterm) { if (!isReviewFile(file)) return false; }` (no dependency on deleted `midtermLectures`).
   - In `questionMatchesFacetsAndQuery()` (lines 538–541): remove the `midtermScope` check (if `parsed.midterm`, don't filter out questions by deleted `midtermLectures`).

### 6. Styles Cleanup (`assets/styles.css`)
- Remove dead `.exam-news*` rules (lines 6720–6840) and `.midterm-halls*` / `.halls-file-btn` rules if unused.
- Ensure `.review-block` looks clean when positioned **below** `.matrix-wrap` / `.net-track` (check top margin spacing so it doesn't collide visually with the bottom of the matrix table).

### 7. Telegram Bot Sync (`bot/telegram-bot.mjs` & `scripts/telegram-bot.mjs`)
- In `bot/telegram-bot.mjs` around lines 646–652, remove the block that tries to mirror uploads into the deleted top-level `midterm-revision` subject:
  ```js
  // Remove:
  const midtermSubject = manifest.subjects.find((s) => s.id === "midterm-revision");
  ...
  ```
- Keep lines 637–644 (`${subject.id}/midterm-revision`) working so Hero/Review uploads still go directly into each subject's own review section.
- Copy the updated `bot/telegram-bot.mjs` to `scripts/telegram-bot.mjs` so both remain byte-for-byte identical.

---

## Verification Checklist (Must All Pass Before Moving to Feature 02)

### Automated CLI Checks
```powershell
node --check assets/app.js
node --check assets/quiz.js
node --check scripts/build.mjs
node --check bot/telegram-bot.mjs
node --check scripts/telegram-bot.mjs
node scripts/build.mjs --check
```
- Confirm `node scripts/build.mjs --check` outputs **0 problems** and reports **`subjects 5`** (down from 6).
- Confirm `files/committees/` and `downloads/midterm-revision.zip` do not exist, while `downloads/.gitkeep` still exists.

### Browser Functional & Visual Checks
1. **Tabs bar:** Red pinned "مراجعة الميد" tab is completely gone; only the 5 subjects (+ "كل المواد" collector) appear cleanly without layout glitches.
2. **All 5 Subjects (Desktop + Mobile viewport):**
   - Open `system-analysis`, `database-2`, `information-theory`, `research-methods`, and `computer-networks`.
   - Confirm **"المراجعات والملفات الشاملة"** appears **BELOW** the lectures table (and below Atwan/Mahfouz in `computer-networks`), has **NO** `★ مهم` badge, and still shows **all** review files (CN: 5, DB2: 5, IT: 6, RM: 5, SA: 5).
   - Confirm books & unnumbered banks (e.g., `database-system-ii`, `research-dr-hala-okasha`, `system-analysis-book`) still appear in **"مراجع وملفات إضافية"** — nothing lost!
   - Confirm **NO** `committees` section appears in any subject.
   - Confirm **NO** `"في الميدترم"` or `"مقرر بالامتحان"` badges appear on lecture rows.
   - Confirm `information-theory` shows 6 real lectures (no empty Lecture 7).
3. **Course Info (`معلومات المادة`):**
   - Expand in all 5 subjects → confirms `درجة الميدترم` and `نطاق الميدترم` are gone, and **`الدرجات المتبقية`** shows `90 / 90 / 90 / 75 / 85 من 100` accurately.
4. **Exam News Banner:** Confirm `#exam-news` ("افتكر شوف مكان امتحانك") is completely gone from DOM.
5. **Old URL safety:** Visit `#midterm-revision` → cleanly redirects/renders default subject with zero console errors.
6. **Search:** Type `"مراجعة"` or `"ميدترم"` → review files across all 5 subjects still appear cleanly.
