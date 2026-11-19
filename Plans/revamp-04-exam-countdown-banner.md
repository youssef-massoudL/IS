# Revamp Feature 04 — Smart Auto-Switching Exam Countdown Banner (Practical/Oral → Finals)

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Depends On:** Feature 03 (`data/schedule.json` loaded fresh via `loadSchedule()`)  
**Architect / Lead:** Antigravity

---

## Goal

Add a slim, calm, **data-driven Exam Countdown Banner** that automatically tracks the semester exam phases from `data/schedule.json → calendar` with **zero manual code updates**:
1. **Now → before Dec 19, 2026:** Counts down to **الامتحانات العملية والشفوية** (`practical-oral`).
2. **During Dec 19 – Dec 31, 2026:** Shows **الامتحانات العملية والشفوية جارية الآن** + countdown to **امتحانات نص السنة (الفاينل)**.
3. **After Practical/Oral → before Jan 2, 2027:** Automatically switches to **امتحانات نهاية الفصل الدراسي الأول (نص السنة)** (`final-exams`).
4. **During Jan 2 – Jan 21, 2027:** Shows **امتحانات نص السنة جارية الآن** + days remaining until midyear break.
5. **After Jan 21, 2027:** Automatically hides itself completely.

---

## Critical Gotchas (مطبات حرجة — MUST Handle Explicitly)

1. **Per-Phase Dismissal — NEVER use a single global boolean!**
   - If a student clicks `×` to dismiss the banner during **Practical/Oral**, a global `"dismissed": true` flag would prevent the **Finals** countdown from ever appearing!
   - **Required fix:** Store dismissed phase keys as a JSON array in `localStorage` under `hub:countdownDismissed` (e.g. `["practical-upcoming"]`). Each transition (`practical-upcoming`, `practical-active`, `finals-upcoming`, `finals-active`) has its own key, so dismissing one phase still lets the next phase appear automatically!
2. **Layout Safety — Normal Flow, NOT `position: fixed/sticky`:**
   - Place `<div class="exam-countdown" id="exam-countdown" role="region" aria-label="العد التنازلي للامتحانات" hidden></div>` in `index.html` right **between** `</header>` and `<div class="app-shell">` (lines 95–97).
   - Keep it in normal document flow (NOT sticky/fixed) so it never shifts `--header-h`, never overlaps `.sidebar` or `.notif-panel`, and scrolls cleanly out of the way while studying.
   - Hide the banner whenever `searchActive() || state.filtersOpen` is true so search results stay uncluttered.
3. **No 1-Second Tick Churn:**
   - Update every **60 seconds** (`setInterval(renderExamCountdown, 60000)`) + on `document.addEventListener("visibilitychange", ...)` when returning to the tab (so a tab left open overnight updates its day count immediately in the morning!).
   - Avoid rebuilding innerHTML unnecessarily if the rendered signature (`phase.key + "|" + countdownText`) hasn't changed.
4. **Correct Arabic Pluralization:**
   - Use a dedicated helper `formatCountdownDaysAr(days)`:
     - `days <= 0` → `"اليوم"`
     - `days === 1` → `"غداً"`
     - `days === 2` → `"باقي يومان"`
     - `days <= 10` → `` `باقي ${days} أيام` ``
     - `days > 10` → `` `باقي ${days} يوم` ``
   - When `1 <= days <= 3` (upcoming phases), optionally include remaining hours (calculated to `09:00` local exam morning, e.g., `باقي يومان · 14 ساعة`) for extra clarity right before exams!
5. **Respect `status === "done"` in `schedule.calendar`:**
   - If the admin explicitly adds `"status": "done"` to `practical-oral` (or `final-exams`) in `data/schedule.json`, treat that phase as finished immediately even if its `endDate` hasn't passed yet.
6. **Built-in Safe Date Testing Hook (`?mockDate=YYYY-MM-DD`):**
   - Support an optional URL query parameter `?mockDate=YYYY-MM-DD` ONLY inside `resolveExamCountdownPhase(now)` (e.g., `getCountdownNow()` returns `parseDateParts(mock)` at `10:00` if `?mockDate=` matches `^\d{4}-\d{2}-\d{2}$`, otherwise `new Date()`).
   - This lets both DeepSeek v4 and the PO test all 5 phase transitions live in the browser in 10 seconds without touching the system clock!
7. **Smooth Jump to Timeline (`#sec-calendar`):**
   - Clicking the banner's `"الخريطة الزمنية"` action navigates to `#schedule` and smoothly scrolls to `#sec-calendar` (via a tiny `pendingCalendarScroll` boolean reset right after `renderSchedule()` runs!).

---

## Step-by-Step Implementation Plan

### 1. HTML (`index.html`)
- Insert the banner mount container directly between `</header>` (line 95) and `<div class="app-shell">` (line 97):
  ```html
  <div class="exam-countdown" id="exam-countdown" role="region" aria-label="العد التنازلي للامتحانات" hidden></div>
  ```
- Bump cache-busting `?v=` query strings on `assets/styles.css` and `assets/app.js` (e.g., `?v=20261119d`).

### 2. Countdown Phase Resolver & Renderer (`assets/app.js`)
Add DOM reference near lines 80–95:
- `const examCountdownEl = $("#exam-countdown");`
- `const COUNTDOWN_DISMISSED_KEY = "hub:countdownDismissed";`
- `let pendingCalendarScroll = false;`
- `let lastCountdownSignature = "";`

Add clean, pure helper functions:
1. **`getCountdownNow()`:**
   - Checks `new URLSearchParams(location.search).get("mockDate")`.
   - If valid `YYYY-MM-DD` (via `parseDateParts`), returns a `Date` at `10:00:00` local time on that date; otherwise returns `new Date()`.
2. **`formatCountdownDaysAr(days)`:**
   - Returns exact Arabic grammar (`اليوم`, `غداً`, `باقي يومان`, `باقي X أيام` for `3..10`, `باقي X يوم` for `11+`).
3. **`daysBetweenDates(fromDate, toDate)`:**
   - Normalizes both dates to local midnight (`new Date(y, m, d)`) and returns `Math.round((toMid - fromMid) / 86400000)`.
4. **`isCountdownDismissed(phaseKey)` & `dismissCountdownPhase(phaseKey)`:**
   - Reads/writes JSON array in `store.getJson(COUNTDOWN_DISMISSED_KEY, [])` (capped to last 12 keys).
5. **`resolveExamCountdownPhase(now = getCountdownNow())`:**
   - Reads `calendar = state.schedule?.calendar || []`.
   - Finds `practical = calendar.find((c) => c.id === "practical-oral")` and `finals = calendar.find((c) => c.id === "final-exams")`.
   - Computes `todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate())`.
   - Helper `isDone = (item) => !item || item.status === "done" || todayMid > parseDateParts(item.endDate || item.startDate)`.
   - **Check in order:**
     1. If `practical && !isDone(practical)`:
        - `pStart = parseDateParts(practical.startDate)`, `pEnd = parseDateParts(practical.endDate || practical.startDate)`.
        - If `todayMid < pStart`:
          - `days = daysBetweenDates(todayMid, pStart)`
          - `finalsDays = finals ? daysBetweenDates(todayMid, parseDateParts(finals.startDate)) : null`
          - Return:
            ```js
            {
              key: "practical-upcoming",
              tone: "practical",
              badge: "المرحلة القادمة",
              title: "الامتحانات العملية والشفوية",
              pill: formatCountdownDaysAr(days),
              meta: formatRange(practical.startDate, practical.endDate),
              sub: finalsDays && finalsDays > 0 ? `تليها امتحانات نص السنة (${formatCountdownDaysAr(finalsDays)})` : "",
            }
            ```
        - Else (`todayMid >= pStart && todayMid <= pEnd`):
          - `finalsDays = finals && !isDone(finals) ? daysBetweenDates(todayMid, parseDateParts(finals.startDate)) : null`
          - Return:
            ```js
            {
              key: "practical-active",
              tone: "live",
              badge: "جارية الآن",
              title: "الامتحانات العملية والشفوية",
              pill: finalsDays && finalsDays > 0 ? `نص السنة: ${formatCountdownDaysAr(finalsDays)}` : "بالتوفيق!",
              meta: `حتى ${formatDateShort(practical.endDate)}`,
              sub: finals ? `بداية الفاينل: ${formatDateShort(finals.startDate)}` : "",
            }
            ```
     2. If `finals && !isDone(finals)`:
        - `fStart = parseDateParts(finals.startDate)`, `fEnd = parseDateParts(finals.endDate || finals.startDate)`.
        - If `todayMid < fStart`:
          - `days = daysBetweenDates(todayMid, fStart)`
          - Return:
            ```js
            {
              key: "finals-upcoming",
              tone: "finals",
              badge: "امتحانات نص السنة",
              title: "امتحانات نهاية الفصل الدراسي الأول (النظري)",
              pill: formatCountdownDaysAr(days),
              meta: formatRange(finals.startDate, finals.endDate),
              sub: "استعد بمراجعة المحاضرات وبنك الأسئلة",
            }
            ```
        - Else (`todayMid >= fStart && todayMid <= fEnd`):
          - `daysLeft = Math.max(0, daysBetweenDates(todayMid, fEnd))`
          - Return:
            ```js
            {
              key: "finals-active",
              tone: "finals-live",
              badge: "جارية الآن",
              title: "امتحانات نص السنة — بالتوفيق!",
              pill: daysLeft === 0 ? "آخر يوم امتحانات!" : `متبقي ${daysLeft} ${daysLeft === 1 ? "يوم" : daysLeft === 2 ? "يومان" : daysLeft <= 10 ? "أيام" : "يوم"}`,
              meta: `حتى ${formatDateShort(finals.endDate)}`,
              sub: "",
            }
            ```
     3. Otherwise return `null` (auto-hidden!).

6. **`renderExamCountdown()`:**
   - If `!examCountdownEl || !state.schedule || searchActive() || state.filtersOpen`: hide and clear signature, return.
   - `const phase = resolveExamCountdownPhase();`
   - If `!phase || isCountdownDismissed(phase.key)`: hide and clear signature, return.
   - Compute `signature = `${phase.key}|${phase.pill}|${phase.sub}``. If `signature === lastCountdownSignature && !examCountdownEl.hidden`, return (no unnecessary DOM churn!).
   - Set `lastCountdownSignature = signature`, `examCountdownEl.dataset.tone = phase.tone`, `examCountdownEl.hidden = false`, and render compact inner markup:
     ```html
     <div class="ec-inner">
       <div class="ec-main">
         <span class="ec-badge">
           ${phase.tone.includes("live") ? '<span class="ec-pulse" aria-hidden="true"></span>' : ICONS.clock}
           <span>${esc(phase.badge)}</span>
         </span>
         <div class="ec-copy">
           <strong class="ec-title">${esc(phase.title)}</strong>
           <span class="ec-meta">${esc(phase.meta)}${phase.sub ? `<span class="ec-sub"> · ${esc(phase.sub)}</span>` : ""}</span>
         </div>
       </div>
       <div class="ec-end">
         <span class="ec-pill">${esc(phase.pill)}</span>
         <button class="ec-link" type="button" data-ec-calendar="1">${ICONS.calendar}<span>الخريطة الزمنية</span></button>
         <button class="ec-close" type="button" data-ec-dismiss="${esc(phase.key)}" aria-label="إخفاء الشريط" title="إخفاء لهذه المرحلة">
           <svg viewBox="0 0 24 24" fill="none"><path d="m7 7 10 10M17 7 7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
         </button>
       </div>
     </div>
     ```

7. **Wire Up Events & Lifecycle (`assets/app.js`):**
   - Call `renderExamCountdown()` inside `render()` (right after `renderModeSwitcher()`).
   - In `render()` under `if (state.feature === "schedule")`: after `setupScrollSpy()`, if `pendingCalendarScroll` is true, reset it to `false` and smoothly scroll `#sec-calendar` into view (`document.getElementById("sec-calendar")?.scrollIntoView({ behavior: "smooth", block: "start" })`).
   - Add click listener on `examCountdownEl`:
     - `[data-ec-dismiss]`: calls `dismissCountdownPhase(btn.dataset.ecDismiss)`, resets `lastCountdownSignature = ""`, hides `examCountdownEl`.
     - `[data-ec-calendar]`: sets `pendingCalendarScroll = true`, calls `navigate("schedule")` (if already on `#schedule`, scroll immediately!).
   - In `boot()`: start `window.setInterval(renderExamCountdown, 60_000)` and add `document.addEventListener("visibilitychange", () => { if (!document.hidden) renderExamCountdown(); })`.

### 3. Styles (`assets/styles.css`)
Add sleek, minimal, light + dark mode styles for `.exam-countdown`:
- Slim rounded banner (`margin: 10px 0 4px; padding: 9px 14px; border-radius: var(--radius); border: 1px solid ...; box-shadow: var(--shadow-sm);`).
- Subtle tone accents (clean, NOT loud or spammy — keeps the UI calm!):
  - `[data-tone="practical"]`: subtle indigo/teal tint (`var(--accent)` / `#4e8d9c`)
  - `[data-tone="live"]`: subtle emerald green tint (`#10b981`) with gentle pulsing `.ec-pulse` dot (`@media (prefers-reduced-motion: reduce)` disables pulse!)
  - `[data-tone="finals"]` & `[data-tone="finals-live"]`: subtle warm amber tint (`#d97706` / `#f59e0b`)
- `.ec-inner`: `display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;`
- `.ec-pill`: crisp bold pill (`font-weight: 800; padding: 4px 11px; border-radius: 999px; white-space: nowrap;`)
- `.ec-link`: compact ghost button matching site buttons (`font-size: 12px; padding: 4px 10px;`)
- `.ec-close`: compact 28×28 transparent icon button
- **Mobile (`@media (max-width: 680px)`):**
  - Hide `.ec-sub` on very small screens (`max-width: 520px`) so the banner stays crisp and compact (max 2 lines!).
  - Keep `.ec-end` neatly aligned (`width: 100%; justify-content: space-between;` on `max-width: 520px`) with zero horizontal overflow.

---

## Verification Checklist (Must All Pass Before Moving to Feature 05)

### Automated CLI Checks
```powershell
node --check assets/app.js
node scripts/build.mjs --check
```

### Browser Functional & Visual Checks (All 5 Phases via `?mockDate=`)
1. **Current Date (no mockDate — Nov 19, 2026):**
   - Banner displays **`الامتحانات العملية والشفوية`**, badge `المرحلة القادمة`, pill **`باقي 30 يوم`**, dates `19 ديسمبر — 31 ديسمبر 2026`.
2. **Practical Active (`?mockDate=2026-12-22`):**
   - Banner automatically switches to green live state: `جارية الآن` · `الامتحانات العملية والشفوية` · pill `نص السنة: باقي 11 يوم`.
3. **Finals Upcoming (`?mockDate=2027-01-01`):**
   - Banner automatically switches to warm amber Finals state: `امتحانات نص السنة` · `امتحانات نهاية الفصل الدراسي الأول (النظري)` · pill `غداً`.
4. **Finals Active (`?mockDate=2027-01-10`):**
   - Banner shows `جارية الآن` · `امتحانات نص السنة — بالتوفيق!` · `متبقي 11 يوم`.
5. **After Finals (`?mockDate=2027-01-25`):**
   - Banner is **completely hidden** (`#exam-countdown` has `hidden`).
6. **Per-Phase Dismiss Check:**
   - On normal date, click `×` → banner hides and stays hidden on reload.
   - Then open `?mockDate=2027-01-01` → **Finals banner still appears** because dismissal is scoped per phase! (Clear `hub:countdownDismissed` afterwards in DevTools to restore.)
7. **CTA & Search Interaction:**
   - Click `الخريطة الزمنية` from any subject page → navigates to `#schedule` and smoothly scrolls to `#sec-calendar`.
   - Open Search and type a query → banner hides cleanly while searching, returns when search clears.
8. **Mobile (375px) + Dark Mode:**
   - Verify crisp readability, compact height, no sidebar/topbar overlap, and zero horizontal overflow.
