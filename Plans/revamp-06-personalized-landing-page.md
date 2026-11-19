# Revamp Feature 06 — Personalized Section- & Day-Aware Landing Page (`#home`)

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Depends On:** Features 01–05 (all completed & verified — uses Feature 02 `#subject/lec-N` deep links, Feature 03 `renderWeeklyTasksCard()`, Feature 04 `getCountdownNow()`, and Feature 05 `window.HubQuiz.getSummary()`)  
**Prepares For:** Feature 07 (Built-In Pomodoro Timer quick-launch button inside `.home-hero-actions`)  
**Architect / Lead:** Antigravity

---

## Goal

Replace the removed red "مراجعة الميد" pinned tab with a **personalized, section- & day-aware Landing Page (`#home`)** that becomes the default entry page of the site:
1. **First-Visit Section Onboarding (`hub:sectionPicked`):** First-time visitors (or students who haven't explicitly picked their section yet) see a crisp 1-tap Section Picker (سكشن 1–11) right on `#home`, remembered permanently in `localStorage` and editable anytime.
2. **Today & Tomorrow Schedule for the Student's Section:** Shows today's classes (with live "الآن" / "القادم" / "انتهى" status) + tomorrow's classes (with smart fallback to the next study day on weekends/free days), linking straight to each subject.
3. **This Week's & Latest Lectures for Today/Tomorrow's Subjects:** Shows recently uploaded files (`addedAt` ≤ 7 days, tagged `جديد`) AND automatically falls back to the **latest lecture/chapter** of each subject appearing in Today/Tomorrow's schedule — with 1-click **PDF Preview (`#modal`)** and **Open Lecture (`#subject/lec-N`)**!
4. **This Week's Doctor/TA Requirements (`weeklyTasks`):** Reuses Feature 03's `renderWeeklyTasksCard()`, filtered to the student's section, with interactive `تم` completion checkboxes and highlighting for Today/Tomorrow's subjects.
5. **Quiz Performance Summary (`ملخص أدائك في امتحني`):** Powered by Feature 05's `window.HubQuiz.getSummary()` — displays average score, attempts, active/mastered mistakes, weakest subject focus tip, resumable in-progress quiz button, and quick CTAs (`راجع أخطائك` / `اختبار سريع`).

---

## Critical Gotchas (مطبات حرجة — MUST Handle Explicitly)

1. **`hub:mySection` is ALREADY set to `"1"` for existing visitors (`assets/app.js:673-684`):**
   - Previously `initSection()` wrote `"1"` into `hub:mySection` even when the user never chose a section!
   - **Required fix:** Track explicit selection with a separate key `const SECTION_PICKED_KEY = "hub:sectionPicked";` (`"1"` when explicitly chosen).
   - Set `hub:sectionPicked = "1"` whenever:
     - `?sec=1..11` is passed in the URL, OR
     - User picks a section on the `#home` onboarding card, OR
     - User changes `#section-picker` in the topbar.
   - **NEVER block deep links!** If a user opens `#database-2/lec-3`, `#schedule`, or `#practice`, render that page directly without interrupting them with onboarding. Show the Section Onboarding card ONLY on `#home` when `!state.sectionPicked`.
2. **Keep `.tabs-bar` visible & Pinned `الرئيسية` tab properly highlighted (`assets/app.js:1434-1495, 2791-2807`):**
   - Repurpose `#midterm-pin` (`midtermPinEl` in `index.html:102`) to render the pinned **`الرئيسية`** tab (`data-route="home"`, neutral/brand accent `--tab-accent: #4e8d9c`, `ICONS.home` — NOT alarm-red!).
   - Keep `activeTopMode()` returning `"lectures"` when `state.feature === "home"` so `#tabs-bar` stays visible on the Landing Page (allowing 1-tap jumps to all 5 subjects right beside `الرئيسية`!).
   - In `renderTabs()`:
     - On `isInitialMount`, render the pinned `الرئيسية` button inside `midtermPinEl`.
     - On every `renderTabs()` call, update `pinnedBtn.setAttribute("aria-selected", !searching && state.feature === "home" ? "true" : "false")`.
     - Notice `featureActive` is `true` when `state.feature === "home"`, so `collapsed` is `false` — all 5 subject tabs stay cleanly expanded alongside `الرئيسية`!
   - Make `.brand` in the topbar clickable (`href="#home"` or click listener navigating to `"home"` with `cursor: pointer`) so tapping the site logo always takes you Home!
3. **Smart Fallback for "محاضرات الأسبوع ده" (Only ~6 of 127 files have `addedAt`!):**
   - Never rely ONLY on `file.addedAt` within 7 days — otherwise the card will look empty most weeks!
   - **Required 2-tier strategy:**
     1. Collect any file across the 5 subjects with `addedAt` within the last **7 days** (prioritizing `focusSubjectIds`, tagged `جديد`).
     2. For each subject in `focusSubjectIds` (Today + Tomorrow's unique subjects; or all 5 subjects if none) that does NOT already have a new-this-week lecture in Tier 1, include its **latest lecture/unit**:
        - For standard subjects: highest `lecture` number (`maxLecture(subject)`), picking its primary `kind === "lecture"` PDF (fallback: first file of that lecture) and linking to `#${subject.id}/lec-${latestLec}`!
        - For `computer-networks`: latest chapter/unit with files (checking Mahfouz & Atwan units in reverse order, preferring `mahfouz-ch2`, `atwan-ch7`, etc., or highest `atwan-ch*` / `mahfouz-ch*` unit), picking its primary `slot === "book"` PDF and linking to `#computer-networks/unit-${unitId}`!
   - Cap list cleanly at **6 items** so the card stays scannable and calm.
4. **Weekend / Free-Day Handling in Today & Tomorrow Schedule:**
   - Use `getCountdownNow()` (from Feature 04, which respects `?mockDate=YYYY-MM-DD`!) so you can test weekdays, Thursdays, Fridays, and free days cleanly!
   - Always resolve **Today** (`offset = 0`) AND **Tomorrow** (`offset = 1`).
   - If **BOTH** Today and Tomorrow have 0 classes (e.g., a student's section has free Tuesday + Wednesday, or Friday when Saturday is free), ALSO compute `nextStudyDay` (`offset = 2..7`) so the student sees `"أقرب يوم دراسي: <dayName>"` instead of two blank boxes, and `focusSubjectIds` is populated from `nextStudyDay`!
   - Live period status on Today's entries (using real `new Date()` time when not mocked): mark an entry `is-now` if `nowMinutes >= startMin && nowMinutes <= endMin`, `is-next` for the first entry with `startMin > nowMinutes`, and `is-done` if `nowMinutes > endMin`.
5. **Reactivity When Checking Tasks or Updating Quiz Progress on `#home` (`assets/app.js:1201-1209`):**
   - Currently `handleTaskDoneChange()` re-renders `smartStripEl` when inside `#smart-strip`, but does NOT refresh the header count badge (`.tasks-count`) or sort order when ticked inside `#view` on `#home`!
   - **Required fix:** Inside `handleTaskDoneChange()`, if `state.feature === "home"` and `#view` contains `[data-home-tasks-slot]`, re-render just that `[data-home-tasks-slot]` container (fast, zero scroll jump!).
   - Also bind `hub:quiz-updated` and `hub:mistakes-updated` listeners to refresh `[data-home-quiz-slot]` if `state.feature === "home"`.
6. **Keep `#home` Calm, Fast, and Mobile-Friendly (NOT Overwhelming!):**
   - Strictly **4 focused cards** arranged in a balanced **2×2 grid on desktop (`≥ 900px`)** and **clean 1-column stack on mobile**:
     1. **جدولك (اليوم وبكرا)**
     2. **أخبار ومطلوب الأسبوع**
     3. **آخر المحاضرات لموادك**
     4. **ملخص أدائك في امتحني**
   - Plus a slim greeting header (`.home-hero`) at the top with date, section badge + inline quick section switcher, and an overall semester study progress pill (`studied / total`).
7. **Old `#midterm-revision` / Empty Hash Routing Safety:**
   - Empty hash (`""` or `#`) and `#home` both route to `state.feature = "home"`.
   - Unknown hashes (like old bookmarks to `#midterm-revision`) should also cleanly route to `state.feature = "home"`!
   - Keep `modeSwitcherEl`'s `"محاضرات"` button (`assets/app.js:3133`) routing to `state.lastSubject || "home"` (or `"home"` if already on a subject? Better: if on `#schedule` or `#practice`, go to `state.lastSubject || "home"`, so returning to your last subject still feels effortless while `الرئيسية` tab is always pinned at the start of the bar!).

---

## Step-by-Step Implementation Plan

### 1. Icon & State Setup (`assets/app.js`)
- Add `home` icon to `ICONS` (`assets/app.js:1-30`):
  ```js
  home: '<svg viewBox="0 0 24 24" fill="none"><path d="M3.5 10.8 12 4l8.5 6.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 9.8V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V9.8" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.8 20.5v-5.3a1.2 1.2 0 0 1 1.2-1.2h2a1.2 1.2 0 0 1 1.2 1.2v5.3" stroke="currentColor" stroke-width="1.6"/></svg>',
  ```
- Add to `state`:
  - `sectionPicked: false`
  - `homeSectionDrawerOpen: false` (for inline quick section switching on `#home`)
- Add constant `const SECTION_PICKED_KEY = "hub:sectionPicked";`.
- Update `initSection()` (`assets/app.js:673-684`):
  - If `querySection` is present: set `state.section = querySection`, `state.sectionPicked = true`, save both `hub:mySection` and `hub:sectionPicked = "1"`.
  - Else: `state.section = savedSection || "1"`, `state.sectionPicked = store.get(SECTION_PICKED_KEY) === "1"`. (Do NOT force-set `hub:sectionPicked` to `"1"` on default!)
- Update `sectionPickerEl` `change` listener: set `state.sectionPicked = true; store.set(SECTION_PICKED_KEY, "1"); state.homeSectionDrawerOpen = false;` before `render()`.

### 2. Pinned `الرئيسية` Tab & Routing (`assets/app.js`)
- **In `renderTabs()` (`assets/app.js:1434-1495`):**
  - On `isInitialMount`, render inside `midtermPinEl`:
    ```html
    <button class="tab tab-pinned tab-home" type="button" role="tab"
      aria-selected="false" data-route="home" style="--tab-accent:#4e8d9c">
      <span class="dot"></span>
      <span class="pinned-icon">${ICONS.home}</span>
      <span>الرئيسية</span>
    </button>
    ```
  - On every call, sync `aria-selected` on `.tab-home`: `const homeActive = !searching && state.feature === "home"; pinnedBtn.setAttribute("aria-selected", homeActive ? "true" : "false");`.
- **In `route()` (`assets/app.js:2892-2960`):**
  - When `!parsed` OR `parsed.subjectId === "home"`:
    ```js
    state.feature = "home";
    state.tabsExpanded = false;
    clearSearch();
    if (!modalEl.hidden) closePreview(false);
    render();
    if (parsed?.subjectId === "home") window.scrollTo({ top: 0, behavior: "smooth" });
    return;
    ```
  - When `parsed.subjectId` is not found in `state.data.subjects` (e.g. old `#midterm-revision` bookmark): fall back to `state.feature = "home"; render(); return;`.
- **In `render()` (`assets/app.js:2809-2869`):**
  - Add branch right before `state.feature === "schedule"`:
    ```js
    if (state.feature === "home") {
      renderTabs();
      renderHome();
      document.title = `الرئيسية — ${state.data.title}`;
      renderSidebar();
      setupScrollSpy();
      return;
    }
    ```
- **In `renderSidebar()` (`assets/app.js:2732`):**
  - Add `state.feature === "home" ? "الصفحة الرئيسية" : ...` to `contextLabel`.
- **Clickable Brand Logo:** Make `.brand` navigate to `#home` on click (and add `role="link"` or wrap/cursor pointer cleanly).

### 3. Home Data Resolvers (`assets/app.js`)
Write clean, modular helper functions right above `renderHome()`:
1. **`getTimeGreeting(now)`:** Returns `"صباح الخير"` (`5 <= h < 12`), `"مساء الخير"` otherwise.
2. **`resolveHomeSchedule(section, now = getCountdownNow())`:**
   - Computes `todayDate = new Date(now)`, `todayName = AR_DAYS[todayDate.getDay()]`, `todayEntries = getDayEntries(todayName, section)`.
   - Computes `tomorrowDate = new Date(now); tomorrowDate.setDate(tomorrowDate.getDate() + 1);`, `tomorrowName = AR_DAYS[tomorrowDate.getDay()]`, `tomorrowEntries = getDayEntries(tomorrowName, section)`.
   - Annotates `todayEntries` with live status (`"now"`, `"next"`, `"done"`, or `""`) by comparing current minutes (`now.getHours() * 60 + now.getMinutes()`) against `eventPeriodRange(entry)`.
   - If `!todayEntries.length && !tomorrowEntries.length`, scans `offset = 2..7` to find `nextDay = { dayName, date, entries }` (the next non-empty day for this section).
   - Builds ordered unique `focusSubjectIds` from `[...todayEntries, ...tomorrowEntries]` (or `nextDay.entries` if both are empty).
   - Returns `{ today: { dayName: todayName, date: todayDate, entries: todayEntries }, tomorrow: { dayName: tomorrowName, date: tomorrowDate, entries: tomorrowEntries }, nextDay, focusSubjectIds }`.
3. **`getSemesterStudySummary()`:**
   - Computes overall studied vs. total tracked units across all 5 subjects (for standard subjects: `lectureTotal(s)` & `studiedMap["${s.id}:${i}"]`; for `computer-networks`: the 9 tracked units `atwan-ch1..7`, `mahfouz-ch1..2`) → returns `{ studied, total, percent }`.
4. **`collectHomeLectures(focusSubjectIds, now = getCountdownNow())`:**
   - `WEEK_MS = 7 * 24 * 60 * 60 * 1000`.
   - `studiedMap = getStudied()`.
   - **Tier 1 (Uploaded in last 7 days):** Scan all 5 subjects for files with valid `addedAt` within `WEEK_MS` of `now.getTime()` (excluding books unless no other recent files, prioritizing `focusSubjectIds` first, sorted newest-first). For each, build item `{ kind: "new", subject, file, label, timeLabel: formatRelativeTimeAr(file.addedAt), href, studied }`.
   - **Tier 2 (Latest lecture/chapter per focus subject):** Target subjects = `focusSubjectIds.length ? focusSubjectIds : state.data.subjects.map(s => s.id)`. For each `subjectId` not already represented in Tier 1 (or up to 1 latest lecture card per focus subject, deduped by `file.path`):
     - If `subjectId === "computer-networks"`: check tracked units in reverse (`["mahfouz-ch2", "mahfouz-ch1", "atwan-ch7", "atwan-ch6", "atwan-ch5", "atwan-ch4", "atwan-ch3", "atwan-ch2", "atwan-ch1"]`), pick the first unit that has files (preferring `slot === "book"`, else first file), `href = "#computer-networks/unit-" + unitId`, `studied = Boolean(studiedMap["computer-networks:" + unitId])`.
     - Else: `latest = maxLecture(subject)`, find files where `fileAppliesToLecture(f, latest)`, prefer `f.kind === "lecture"` else `f.kind === "summary"` else first file, `href = "#" + subject.id + "/lec-" + latest`, `studied = Boolean(studiedMap[subject.id + ":" + latest])`.
   - Return combined list capped at **6 items**.

### 4. Home Page Renderers (`assets/app.js`)
1. **`renderSectionOnboarding()`:**
   - Clean, welcoming centered card inside `.home-page` when `!state.sectionPicked`:
     - Brand mark / icon + Heading: **`اختار سكشنك عشان نظبطلك يومك`**
     - Subtext: **`الصفحة الرئيسية هتفتكر سكشنك وتعرضلك جدول النهاردة وبكرا، وآخر المحاضرات، والمطلوب من الدكاترة والمعيدين تلقائياً.`**
     - Responsive grid of 11 buttons (`1` → `11`, `data-pick-section="${n}"`), each showing `سكشن ${n}`.
     - Subtle secondary button: `"متابعة مؤقتاً بسكشن 1"` (`data-pick-section="1"`).
2. **`renderHomeScheduleCard(sched)`:**
   - Section `<section class="home-card home-schedule-card" id="sec-home-schedule" data-spy-section="home-schedule" data-spy-label="جدول اليوم وبكرا">`.
   - Header: kicker `"جدولك الدراسي"` · heading `"اليوم وبكرا · سكشن ${state.section}"` · link `"الجدول الكامل ↗"` (`#schedule`).
   - Renders **اليوم (${sched.today.dayName})** list (with live status pill `الآن` / `التالي` / `انتهى` and clickable subject link `#<subjectId>`) + **غداً (${sched.tomorrow.dayName})** list (or if both are empty, renders `sched.nextDay` with a friendly `"اليوم وبكرا إجازة — أقرب يوم دراسي: ${sched.nextDay.dayName}"`!).
3. **`renderHomeTasksSlot(focusSubjectIds)`:**
   - Wraps `renderWeeklyTasksCard({ section: state.section, kicker: "المطلوب الأسبوع ده", heading: "متطلبات الدكاترة والمعيدين" })` inside `<div class="home-tasks-slot" data-home-tasks-slot id="sec-home-tasks" data-spy-section="home-tasks" data-spy-label="المطلوب الأسبوع ده">...</div>`.
   - Optional polish: add a small `"مادة قريبة"` badge on tasks whose `subjectId` is in `focusSubjectIds` (or pass `highlightSubjectIds: new Set(focusSubjectIds)` into `renderWeeklyTasksCard()` so tasks for today/tomorrow's subjects get a subtle accent border & float right below urgent deadlines!).
4. **`renderHomeLecturesCard(items, focusSubjectIds)`:**
   - Section `<section class="home-card home-lectures-card" id="sec-home-lectures" data-spy-section="home-lectures" data-spy-label="آخر المحاضرات">`.
   - Header: kicker `"محاضرات الأسبوع"` · heading `focusSubjectIds.length ? "آخر المحاضرات لمواد اليوم وبكرا" : "أحدث المحاضرات المتاحة"`.
   - Compact scannable list of up to 6 items, each showing:
     - Subject dot + Arabic name + badge (`جديد` if Tier 1, or `محاضرة N` / `Ch N`) + `✓ متذاكرة` badge if `item.studied`.
     - File title (clamped to 1–2 lines) + subtle meta (size or relative time).
     - Two compact actions: **`معاينة`** (`data-home-preview`, `data-subject`, `data-file` → opens `#modal`!) + **`فتح`** (`<a href="${esc(item.href)}">`).
5. **`renderHomeQuizCard()`:**
   - Wrapped in `<div class="home-quiz-slot" data-home-quiz-slot id="sec-home-quiz" data-spy-section="home-quiz" data-spy-label="ملخص أدائك في امتحني">`.
   - Reads `const summary = window.HubQuiz?.getSummary?.() || null;`.
   - Renders State A (metrics: `متوسط الدرجات`, `اختبارات مكتملة`, `أخطاء للمراجعة` + `hasInProgress` resume banner + `lastAttempt` line + `weakestSubject` focus tip + buttons `راجع أخطائك` / `اختبار سريع`) OR State B (encouraging first-time CTA to `#practice`).
6. **`renderHome()`:**
   - If `!state.sectionPicked`: renders `renderSectionOnboarding()` into `viewEl` and returns.
   - Otherwise renders `.home-page`:
     - `.home-hero`: Greeting + Arabic date + `سكشن ${state.section}` chip with `تغيير` button (`data-home-change-section`) + overall semester study progress pill (`تمت مذاكرة X من Y`) + `.home-hero-actions` slot (ready for Feature 07 Pomodoro button!) + optional collapsible inline 1–11 section grid when `state.homeSectionDrawerOpen` is true.
     - `.home-grid`:
       - `renderHomeScheduleCard(sched)`
       - `renderHomeTasksSlot(sched.focusSubjectIds)`
       - `renderHomeLecturesCard(homeLectures, sched.focusSubjectIds)`
       - `renderHomeQuizCard()`

### 5. Event Listeners (`assets/app.js`)
- In `viewEl.addEventListener("click", ...)`:
  - `[data-pick-section]`: validates `1..11`, sets `state.section`, `state.sectionPicked = true`, `state.homeSectionDrawerOpen = false`, writes `hub:mySection` + `hub:sectionPicked = "1"`, syncs `sectionPickerEl.value = state.section`, calls `render()`, scrolls smoothly to top.
  - `[data-home-change-section]`: toggles `state.homeSectionDrawerOpen`, calls `renderHome()` (or toggles the inline section drawer directly).
  - `[data-home-preview]`: finds `subject` & `file` by `dataset.subject` and `dataset.file`, calls `openPreview(file)` directly!
- In `handleTaskDoneChange(event)` (`assets/app.js:1201`):
  - If `state.feature === "home"` and `viewEl.contains(checkbox)`, refresh `[data-home-tasks-slot]` cleanly in place so the remaining counter & sort stay in sync without losing scroll position!
- On `window`:
  - Listen to `"hub:quiz-updated"` and `"hub:mistakes-updated"`: if `state.feature === "home"`, refresh `[data-home-quiz-slot]` in place!
- On `.brand`: click navigates to `#home`.

### 6. Styles (`assets/styles.css`) & Cache Bust (`index.html`)
- Add clean, cohesive light + dark mode styles matching existing design tokens (`--surface`, `--surface-2`, `--border`, `--radius`, `--shadow-sm`, `--accent`, `--success`):
  - `.tab-pinned.tab-home` (clean brand-tinted pinned tab — NOT red; active state clearly distinguished from subject tabs).
  - `.home-onboard` (centered card, max-width 560px, crisp 4-col/3-col grid of `.onboard-sec-btn` 1–11 buttons with strong hover/focus states).
  - `.home-page` (`display: grid; gap: 14px;`).
  - `.home-hero` (clean header bar with greeting, date, section pill + inline `.home-sec-drawer`, semester progress pill, and `.home-hero-actions` flex container).
  - `.home-grid` (`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: start;`).
  - `.home-card` (matches `.smart-card` aesthetic with generous breathing room, `min-width: 0`).
  - `.home-day-group`, `.home-day-label`, `.home-event` (with `.is-now` live green highlight, `.is-next` accent border, `.is-done` subtle fade).
  - `.home-lec-list`, `.home-lec-item`, `.home-lec-actions`, `.home-new-badge`, `.home-studied-badge`.
  - `.home-quiz-stats` (3-column compact stat tiles), `.home-quiz-resume`, `.home-quiz-note`, `.home-quiz-actions`.
  - **Responsive (`@media (max-width: 900px)`):** `.home-grid { grid-template-columns: 1fr; }`.
  - **Mobile (`@media (max-width: 620px)`):** compact padding, `.home-hero` stacks cleanly, `.home-quiz-stats` stays 3 compact columns (or 2+1 on `< 360px`), zero horizontal overflow!
- Bump `?v=` on `assets/styles.css` and `assets/app.js` in `index.html` (e.g., `?v=20261119f`).

---

## Verification Checklist (Must All Pass Before Moving to Feature 07)

### Automated CLI Checks
```powershell
node --check assets/app.js
node --check assets/quiz.js
node scripts/build.mjs --check
```

### Browser Functional & Visual Checks
1. **First-Visit Onboarding (`localStorage.removeItem("hub:sectionPicked")` + open root URL with no hash):**
   - Lands on `#home` showing the clean 1-tap Section 1–11 onboarding card (NOT Section 1's schedule blindly).
   - Tap `سكشن 4` → immediately saves `hub:mySection = "4"` & `hub:sectionPicked = "1"`, updates topbar `#section-picker` to `سكشن 4`, and renders Section 4's personalized dashboard!
   - Refresh page → remembers Section 4 directly (onboarding does NOT reappear!).
2. **Deep-Link Non-Blocking Check:**
   - Clear `hub:sectionPicked`, open `#database-2/lec-3` directly → opens Database 2 Lecture 3 immediately with zero onboarding popup!
3. **Pinned `الرئيسية` Tab & Navigation:**
   - Pinned `الرئيسية` tab sits cleanly in `#midterm-pin` (brand color, NOT red), marked active on `#home` and inactive on subject pages.
   - All 5 subject tabs stay visible right beside it on `#home`.
   - Clicking `.brand` logo from `#schedule` or `#database-2` returns to `#home`.
   - Visiting old `#midterm-revision` redirects cleanly to `#home` with zero console errors.
4. **Section & Day Personalization (Test via `?mockDate=`):**
   - Switch between Section 1 and Section 4 on `?mockDate=2026-11-22` (Sunday) → Today & Tomorrow's schedule, focus subjects, and latest lectures update dynamically!
   - Test weekend/free-day fallback (e.g., `?mockDate=2026-11-20` Friday for a section without Saturday classes, like Section 3) → cleanly shows `"أقرب يوم دراسي"` instead of empty boxes!
5. **Lectures Card Actions:**
   - Click `معاينة` on a lecture item → opens PDF cleanly inside `#modal`; closing `#modal` stays on `#home`!
   - Click `فتح` on a lecture item → navigates straight to `#<subjectId>/lec-<N>` (or `#computer-networks/unit-<id>`) with that exact lecture card auto-expanded!
6. **Weekly Tasks Integration:**
   - Inject a test task in `state.schedule.weeklyTasks` (or via `/task`) → appears on `#home`, ticking `تم` updates the count badge in place without page jump, and persists on `#schedule` too!
7. **Quiz Summary Integration:**
   - Verify both empty state (0 attempts) and populated state (after completing a 5-question quiz): average score, attempts, mistakes count, last attempt, weakest subject tip, and resumable quiz CTA all render accurately!
8. **Mobile (375px) + Dark Mode:**
   - Verify onboarding grid, 4 dashboard cards, and topbar/tabs bar have crisp contrast and **zero horizontal overflow**.
