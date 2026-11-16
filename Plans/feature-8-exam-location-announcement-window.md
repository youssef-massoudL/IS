# Feature 8 — Time-Gated, Once-Per-Window Exam Location Announcement

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Depends On:** None

---

## Goal
Restrict the `"افتكر شوف مكان امتحانك"` announcement bar (`#exam-news`) so that:
1. It is only active from **8:00 PM (20:00) the night before an exam** until **the exam's start time** (`midterm.startTime` on `midterm.date`).
2. It appears **only once** per exam window when the user first visits the site during that scheduled window.

---

## Implementation Plan

### 1. Default Hidden in HTML (`index.html`)
- **`index.html:88`:** Add `hidden` to `#exam-news` so it never flashes before JS evaluates the schedule window:
  ```html
  <div class="exam-news" id="exam-news" role="status" aria-live="polite" hidden>
  ```

### 2. Window Check & One-Time Persistence (`assets/app.js`)
- Add storage key near `NOTIF_SEEN_KEY` (`assets/app.js:909`):
  ```js
  const EXAM_NEWS_SEEN_KEY = "hub:exam-news:seen";
  ```
- Add `activeExamNewsWindow(now = new Date())`:
  ```js
  function activeExamNewsWindow(now = new Date()) {
    for (const midterm of state.schedule?.midterms || []) {
      const examStart = parseDateTime(midterm.date, midterm.startTime);
      if (Number.isNaN(examStart.getTime())) continue;
      const windowStart = new Date(
        examStart.getFullYear(),
        examStart.getMonth(),
        examStart.getDate() - 1,
        20,
        0,
        0,
        0,
      );
      if (now >= windowStart && now <= examStart) {
        return { id: `${midterm.subjectId}-${midterm.date}`, midterm };
      }
    }
    return null;
  }
  ```
- Add `syncExamNewsVisibility()`:
  ```js
  function syncExamNewsVisibility() {
    if (!examNewsEl) return;
    const active = activeExamNewsWindow();
    if (!active) {
      examNewsEl.hidden = true;
      return;
    }
    const seen = new Set(store.getJson(EXAM_NEWS_SEEN_KEY, []));
    if (seen.has(active.id)) {
      examNewsEl.hidden = true;
      return;
    }
    examNewsEl.hidden = false;
    seen.add(active.id);
    store.setJson(EXAM_NEWS_SEEN_KEY, Array.from(seen).slice(-30));
  }
  ```
- **`assets/app.js:3433-3439` (`boot()`):** Call `syncExamNewsVisibility();` right after `state.schedule = window.__SITE_SCHEDULE__ || null;` and `route();`.

---

## Rebuild & Verify
```powershell
node scripts/build.mjs --fix
node scripts/build.mjs --check
```
- **Outside `[20:00 prev day, exam startTime]`:** `#exam-news` remains `hidden`.
- **Inside `[20:00 prev day, exam startTime]` (first visit):** `#exam-news` is visible; refreshing or revisiting the site keeps `#exam-news` hidden for that same exam window.
- **Next exam window:** `#exam-news` appears once again for the new `subjectId-date` window.
