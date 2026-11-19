# Revamp Feature 03 — Schedule Revamp, Weekly Tasks System & Research File Cleanup

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Depends On:** Feature 01 & Feature 02 (completed & verified)  
**Prepares For:** Feature 03.5 (Telegram `/task` command) & Feature 06 (Personalized Landing Page)  
**Architect / Lead:** Antigravity

---

## Goal

1. **Remove 4 redundant/old Research Methods files** from both `data/subjects.json` and disk (`files/research-methods/`), clean up the resulting empty `questions` section, and refresh `assets/data.js` & `downloads/research-methods.zip`.
2. **Introduce the `weeklyTasks` system** in `data/schedule.json` (designed cleanly so Telegram `/task` in Feature 03.5 and the Landing Page in Feature 06 plug directly into it without schema changes).
3. **Revamp the `#schedule` page:**
   - Replace the **"أقرب ميدترم"** card in `#smart-strip` with **"أخبار ومطلوب الأسبوع"** (assignments, quizzes, presentations, projects, and doctor/TA announcements — filtered automatically to the student's selected section with local "تم" checkboxes).
   - Remove the **"امتحانات الميدترم"** (`#sec-midterms`) section completely.
   - Mark **"امتحانات الميدترم"** in the **الخريطة الزمنية (`calendar`)** explicitly as **`انتهى`**.
4. **Prevent stale task caching:** Fetch `data/schedule.json` with `{ cache: "no-store" }` (matching `loadData()`), falling back to `window.__SITE_SCHEDULE__` on `file://`.

---

## Critical Gotchas (مطبات حرجة — MUST Handle Explicitly)

1. **Deleting the 4 `research-methods` files MUST delete BOTH JSON entries AND physical PDFs on disk:**
   - If you remove them from `data/subjects.json` without deleting the physical files from `files/`, `node scripts/build.mjs --check` will **FAIL** with `not in manifest`.
   - Exact 4 files to remove:
     1. `files/research-methods/summaries/research-1-to-4-study-guide-byamr-hesmam.pdf` (`id: "research-1-to-4-study-guide-byamr-hesmam"`)
     2. `files/research-methods/questions/mcq-research-methods.pdf` (`id: "mcq-research-methods"`)
     3. `files/research-methods/questions/research-method-mcq.pdf` (`id: "research-method-mcq"`)
     4. `files/research-methods/questions/research-methods-med-q.pdf` (`id: "research-methods-med-q"`)
   - **Empty section gotcha:** Removing items 2, 3, and 4 empties `research-methods`'s `questions` section (`files: []`). Remove that empty `questions` section object from `data/subjects.json` (and delete the empty `files/research-methods/questions/` folder; both `scripts/add-file.mjs` and `bot/telegram-bot.mjs` automatically recreate it if new files are uploaded later). Also guard `renderClassicSections()` (`assets/app.js`) to `.filter((section) => section.files?.length > 0)` so empty sections never render blank cards.
   - **Keep untouched:** Do NOT touch `research-methods/books/research-dr-hala-okasha.pdf` or any of the 5 files inside `research-methods/midterm-revision`.
   - **ZIP hygiene:** After editing `data/subjects.json`, refresh ZIP archives (`powershell -ExecutionPolicy Bypass -File scripts/build-zips.ps1`) and ensure `downloads/.gitkeep` exists (recreate empty `downloads/.gitkeep` if `build-zips.ps1` clears it).
2. **`#smart-strip` is a SIBLING of `#view`, NOT inside `#view` (`index.html:126-128`):**
   - Any checkbox (`[data-task-done]`) rendered inside `#smart-strip` will **NOT** trigger `viewEl.addEventListener(...)`!
   - **Required fix:** Attach the `[data-task-done]` `change` listener to a shared handler bound to **both** `smartStripEl` and `viewEl` (so it works in `#schedule` today AND inside `#home` in Feature 06!).
3. **Fresh `data/schedule.json` loading (`assets/app.js:3744-3775`):**
   - Currently `state.schedule = window.__SITE_SCHEDULE__ || null;` relies solely on cached `assets/data.js`. When Feature 03.5 adds a task via Telegram `/task`, students with cached `assets/data.js` wouldn't see the new task!
   - **Required fix:** Add `loadSchedule()` fetching `data/schedule.json` with `{ cache: "no-store" }` (falling back to `window.__SITE_SCHEDULE__`), and run `const [data, schedule] = await Promise.all([loadData(), loadSchedule()]);` in `boot()`.
4. **Ship `weeklyTasks: []` — NO fake/invented deadlines in production data:**
   - Never commit invented quizzes or deadlines that might confuse real students. Ship `"weeklyTasks": []` in `data/schedule.json` so the live empty state is clean and truthful. (Test populated rendering during verification via DevTools / temporary check, then ensure `data/schedule.json` is committed with `[]`).
5. **Explicit `"status": "done"` on `midterm-week` in `calendar` (`data/schedule.json` + `assets/app.js:2201-2228`):**
   - Check `item.status === "done"` **before** date range checks in `renderSchedule()` so `امتحانات الميدترم (الأسبوع التاسع)` ALWAYS renders as `is-past` / `"انتهى"` regardless of date or timezone.
6. **Zero dangling references to deleted `midterms`:**
   - Verified across the entire repo: nothing in `quiz.js`, `build.mjs`, or `telegram-bot.mjs` reads `schedule.midterms`.
   - Remove `"midterms": [...]` from `data/schedule.json`, remove `nextMidterm()` (`assets/app.js:811`) and `midtermStatus()` (`assets/app.js:838`), and remove `#sec-midterms` + `midtermRows` from `renderSchedule()`.
   - **Keep `countdownLabel(date)`** (`assets/app.js:828`) and refine it for Arabic plurals (`اليوم`, `غداً`, `بعد يومين`, `بعد 3 أيام`, `بعد 11 يوم`, plus `منذ يوم` / `متأخر X أيام` for overdue tasks).

---

## Data Contract: `weeklyTasks` Schema (`data/schedule.json`)

This exact schema will be written by Telegram `/task` (Feature 03.5) and read by both `#schedule` (Feature 03) and `#home` (Feature 06):

```json
"weeklyTasks": []
```

Each task object follows this contract:
```json
{
  "id": "task-20261120-db2-quiz",
  "subjectId": "database-2",
  "kind": "quiz",
  "title": "كويز في السكشن على المحاضرات 5 و 6",
  "details": "إحضار اللاب توب — مدة الكويز 15 دقيقة.",
  "authorRole": "ta",
  "authorName": "م/ محمد البربير",
  "sections": [1, 2],
  "dueDate": "2026-11-24",
  "expiresAt": null,
  "createdAt": "2026-11-20T18:00:00.000Z"
}
```
- `subjectId`: one of the 5 subject IDs OR `"general"` (for department-wide announcements).
- `kind`: `"assignment"` (`تسليم`), `"quiz"` (`كويز`), `"presentation"` (`عرض`), `"project"` (`مشروع`), or `"news"` (`خبر`).
- `authorRole`: `"doctor"` (`دكتور`), `"ta"` (`معيد`), or `"admin"` (`إدارة`).
- `sections`: `"all"` (applies to every section 1–11) OR array of section numbers e.g. `[1, 2, 3]`.
- `dueDate`: optional `"YYYY-MM-DD"`.
- `expiresAt`: optional `"YYYY-MM-DD"` (mainly for `kind: "news"` without a `dueDate`).
- **Auto-expiry rule (keeps the UI fresh automatically):**
  - If `expiresAt` is set: hide once `todayMid > parseDateParts(expiresAt)`.
  - Else if `dueDate` is set: keep visible until **2 days after `dueDate`** (so a student who missed yesterday's deadline still sees it briefly as overdue), then auto-hide.
  - Else (no `dueDate` and no `expiresAt`): if `createdAt` is set, auto-hide after **14 days**; otherwise show.

---

## Step-by-Step Implementation Plan

### 1. Research Methods File Cleanup (`data/subjects.json`, `files/`, `downloads/`)
- In `data/subjects.json` under `research-methods`:
  - Remove `research-1-to-4-study-guide-byamr-hesmam` from `summaries.files`.
  - Remove the entire `questions` section (which contained only `mcq-research-methods`, `research-method-mcq`, and `research-methods-med-q`).
- Delete the 4 physical PDFs from disk:
  - `files/research-methods/summaries/research-1-to-4-study-guide-byamr-hesmam.pdf`
  - `files/research-methods/questions/mcq-research-methods.pdf`
  - `files/research-methods/questions/research-method-mcq.pdf`
  - `files/research-methods/questions/research-methods-med-q.pdf`
  - Remove the empty directory `files/research-methods/questions/`.
- In `renderClassicSections()` (`assets/app.js`), filter `subject.sections.filter((section) => section.files?.length)` so empty sections never render.
- Refresh ZIP archives (`powershell -ExecutionPolicy Bypass -File scripts/build-zips.ps1`) and ensure `downloads/.gitkeep` exists (recreate empty `downloads/.gitkeep` if `build-zips.ps1` clears it).

### 2. Update `data/schedule.json` & Rebuild `assets/data.js`
- Remove the `"midterms": [...]` property from `data/schedule.json`.
- Add `"weeklyTasks": []` at the top level of `data/schedule.json` (right after `calendar` or `periods`).
- In `calendar`, add `"status": "done"` to the `"id": "midterm-week"` entry:
  ```json
  {
    "id": "midterm-week",
    "title": "امتحانات الميدترم (الأسبوع التاسع)",
    "startDate": "2026-11-14",
    "endDate": "2026-11-19",
    "status": "done",
    "note": "تستمر الدراسة بالتوازي مع الاختبارات"
  }
  ```
- Run `node scripts/build.mjs` so `assets/data.js` is regenerated cleanly.

### 3. Update `index.html`
- Line 126: change `<section class="smart-strip" id="smart-strip" aria-label="اليوم وأقرب ميدترم"></section>` → `aria-label="جدولك اليوم وأخبار ومطلوب الأسبوع"`.
- Bump cache-busting `?v=` query strings on `assets/styles.css`, `assets/data.js`, and `assets/app.js` (e.g. `?v=20261119c`).

### 4. Weekly Tasks Engine & Helpers (`assets/app.js`)
Add clean, reusable helpers (so Feature 06 Landing Page can call them directly!):
- Constants:
  ```js
  const TASKS_DONE_KEY = "hub:tasksDone";
  const TASK_KIND_META = {
    assignment: { label: "تسليم", tone: "warn" },
    quiz: { label: "كويز", tone: "danger" },
    presentation: { label: "عرض", tone: "info" },
    project: { label: "مشروع", tone: "accent" },
    news: { label: "خبر", tone: "neutral" },
  };
  const TASK_ROLE_LABELS = { doctor: "دكتور", ta: "معيد", admin: "إدارة" };
  ```
- `getTasksDone()` / `toggleTaskDone(taskId)`: reads/writes `{ [taskId]: true }` in `localStorage` (`hub:tasksDone`).
- `taskMatchesSection(task, section)`: returns `true` if `!task.sections || task.sections === "all"` OR `(Array.isArray(task.sections) && task.sections.map(Number).includes(Number(section)))`.
- `isTaskActive(task, todayMid)`: applies the auto-expiry rule above.
- `getActiveWeeklyTasks({ section = state.section, subjectIds = null } = {})`:
  - Filters `state.schedule?.weeklyTasks || []` by `taskMatchesSection`, `isTaskActive`, and optional `subjectIds` (`Set` or array).
  - Sorts: **incomplete tasks first**, then by **earliest `dueDate`** (tasks without `dueDate` after dated ones), then by newest `createdAt`.
- `formatTaskDueBadge(task)`: returns `{ label, urgent }` using `countdownLabel()` (e.g. `"اليوم"` / `"غداً"` with `urgent: true`, `"بعد 3 أيام"`, or `"متأخر"` with `urgent: true`), or `null` if no `dueDate`.
- `renderWeeklyTaskItem(task, doneMap)`:
  - Compact, scannable row showing:
    - Subject accent dot + subject Arabic name (or `"عام — القسم"` if `subjectId === "general"`), clickable link `#<subjectId>` if it's a real subject.
    - Kind pill (`تسليم` / `كويز` / `عرض` / `مشروع` / `خبر`) with subtle semantic color.
    - Due date pill (if `dueDate` exists) + section scope pill (`سكشنك` if specific sections).
    - Title (`<strong>`), optional `details` (`<p>`), and author attribution (`دكتور: ...` / `معيد: ...` if provided).
    - For actionable tasks (`kind !== "news"`): clean local checkbox `<label class="task-check"><input type="checkbox" data-task-done="${esc(task.id)}"${isDone ? " checked" : ""}><span>تم</span></label>`.
- `renderWeeklyTasksCard({ section = state.section, subjectIds = null, kicker = "أخبار ومطلوب الأسبوع", heading = null } = {})`:
  - Renders the complete `<div class="smart-card tasks-card">` (reusable in `#schedule` smart-strip AND in Feature 06 Landing Page!).
  - Shows active remaining count pill in the header (e.g., `3 مطلوب` or `لا توجد متطلبات`).
  - Clean, encouraging empty state when 0 tasks match the student's section:
    - `"لا توجد تسليمات أو متطلبات مسجلة لسكشن X هذا الأسبوع."`
    - Subtle sub-note: `"أي كويز أو تسليم أو تنبيه جديد من الدكاترة والمعيدين هيظهر هنا تلقائياً."`

### 5. Update `renderSmartStrip()`, `renderSchedule()`, `buildNotifications()`, and `boot()` (`assets/app.js`)
- **Remove** dead `nextMidterm()` (line 811) and `midtermStatus()` (line 838).
- **Refine `countdownLabel(date)`** (line 828) to handle:
  - `days < 0`: `days === -1 ? "منذ يوم" : days === -2 ? "منذ يومين" : days >= -10 ? \`متأخر ${Math.abs(days)} أيام\` : \`متأخر ${Math.abs(days)} يوم\``
  - `days === 0`: `"اليوم"`
  - `days === 1`: `"غداً"`
  - `days === 2`: `"بعد يومين"`
  - `days <= 10`: `` `بعد ${days} أيام` ``
  - `days > 10`: `` `بعد ${days} يوم` ``
- **In `renderSmartStrip()` (`assets/app.js:1003-1066`):**
  - Replace `midtermCard` with `renderWeeklyTasksCard({ section: state.section, kicker: "أخبار ومطلوب الأسبوع", heading: \`متطلبات الدكاترة والمعيدين · سكشن ${state.section}\` })`.
- **In `renderSchedule()` (`assets/app.js:2127-2275`):**
  - Remove `midtermRows` and the entire `<section class="schedule-block" id="sec-midterms" ...>...</section>` block.
  - In the `calendar` mapping (line 2201): check `item.status === "done"` **first**:
    ```js
    if (item.status === "done" || (!Number.isNaN(end.getTime()) && end < todayMid)) {
      statusClass = "is-past";
      statusLabel = "انتهى";
    } else if (item.status === "current" || (...)) {
      statusClass = "is-current";
      statusLabel = "الآن";
    }
    ```
- **Task checkbox listener (BOTH `#smart-strip` and `#view`):**
  - Create `handleTaskDoneChange(event)`: if `event.target.closest("[data-task-done]")`, call `toggleTaskDone(checkbox.dataset.taskDone)` and re-render `renderSmartStrip()` (and update `.task-item.is-done` / re-render if inside `#view`!).
  - Bind `smartStripEl?.addEventListener("change", handleTaskDoneChange)` AND `viewEl.addEventListener("change", handleTaskDoneChange)`.
- **In `buildNotifications()` (`assets/app.js`):**
  - Include active `weeklyTasks` for `state.section` that are either due within 3 days OR created within the last 48 hours (and not marked done in `hub:tasksDone`), linking to `#schedule` with `ctaLabel: "التفاصيل"`.
- **In `boot()` (`assets/app.js:3744-3785`):**
  - Add `loadSchedule()` with `fetch("data/schedule.json", { cache: "no-store" })` and fallback to `window.__SITE_SCHEDULE__`.
  - Load both manifests in parallel: `const [data, schedule] = await Promise.all([loadData(), loadSchedule()]);`.

### 6. Styles (`assets/styles.css`)
- Remove dead `.midterm-card`, `.midterm-subject`, `.midterm-facts` rules (verify unused before deleting!).
- Add cohesive, light+dark-mode styles for `.tasks-card`, `.tasks-list`, `.task-item`, `.task-item.is-done`, `.task-head`, `.task-kind` (`is-warn`, `is-danger`, `is-info`, `is-accent`, `is-neutral`), `.task-due` (`is-urgent`), `.task-title`, `.task-details`, `.task-foot`, `.task-author`, `.task-check`, and `.tasks-empty`:
  - Keep `.tasks-card` visually balanced with `.today-card` inside `.smart-strip` (`max-height: 320px; overflow-y: auto` on `.tasks-list` if >4 tasks so `#smart-strip` never pushes the weekly timetable off-screen!).
  - Crisp mobile layout (`max-width: 620px`) with zero horizontal overflow.

---

## Verification Checklist (Must All Pass Before Moving to Feature 03.5 / 04)

### Automated CLI Checks
```powershell
node --check assets/app.js
node --check scripts/build.mjs
node scripts/build.mjs --check
```
- Confirm `node scripts/build.mjs --check` exits `0` with **0 problems** and reports **`entries 127`** (down from 131 after removing the 4 `research-methods` files).
- Confirm all 4 deleted PDFs no longer exist in `files/research-methods/` and `downloads/.gitkeep` still exists.

### Browser Functional & Visual Checks
1. **Research Methods (`#research-methods`):**
   - Confirm the 4 removed files (`Study Guide by Amr Hesmam`, `MCQ Research Methods`, `Research Method MCQ`, `Research Methods Med Questions`) are gone in BOTH Matrix view ("مراجع وملفات إضافية" shows ONLY `Research Dr.Hala Okasha`) and Classic view (no empty `questions` section!).
   - Confirm all 4 lectures, 4 lecture summaries, 1 book, and 5 `midterm-revision` review files are still intact.
2. **Schedule Page (`#schedule`):**
   - **Smart Strip:** Second card is now **"أخبار ومطلوب الأسبوع"** (no "أقرب ميدترم"), showing the clean empty state for the chosen section.
   - **Midterms Table Removed:** `#sec-midterms` ("امتحانات الميدترم") is completely gone from the page AND from the sidebar TOC!
   - **Timeline (`الخريطة الزمنية للترم`):** **"امتحانات الميدترم (الأسبوع التاسع)"** explicitly displays badge **`انتهى`** with muted `.is-past` styling, while **"الامتحانات العملية والشفوية"** displays **`قادم`**.
3. **Interactive Weekly Tasks Test (temporary DevTools / local check before reverting to `[]`):**
   - Inject 3 sample tasks (1 for `sections: "all"`, 1 for `sections: [2]` only, 1 with `dueDate` 5 days ago):
     - Switch topbar section picker between Section 1 and Section 2 → confirm section filtering updates instantly!
     - Confirm expired task (>2 days past `dueDate`) auto-hides.
     - Tick **`تم`** checkbox inside `#smart-strip` → confirm task dims/checks and persists across page refresh (`hub:tasksDone`)!
     - Open notification bell → confirm upcoming/new task appears in notifications!
   - Ensure final committed `data/schedule.json` has `"weeklyTasks": []` (no fake deadlines left behind!).
4. **Network check:** Open DevTools Network tab → confirm `data/schedule.json` is fetched fresh on load (and if offline/`file://`, falls back cleanly to `window.__SITE_SCHEDULE__`).
5. **Mobile (375px) + Dark Mode:** Verify `#schedule` smart-strip, task cards, and timeline look crisp in both Light and Dark themes with zero overflow.
