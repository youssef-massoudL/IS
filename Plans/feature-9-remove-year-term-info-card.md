# Feature 9 — Remove Year + Term Info Card

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Depends On:** None

---

## Goal
Delete the year + term info card (`.feature-hero.schedule-hero`) from the Schedule (`#schedule`) page.

---

## Implementation Plan

### 1. Remove Card Markup (`assets/app.js`)
- **`assets/app.js:2157-2165` (`renderSchedule()`):** Remove the entire `.feature-hero.schedule-hero` block:
  ```html
    <div class="feature-hero schedule-hero" style="--accent:#0f766e">
      <span class="eyebrow">${ICONS.calendar} الجدول الدراسي والميدترم</span>
      <h2>${withLtrYears(schedule.term)}</h2>
      <p class="feature-sub">${esc(schedule.faculty)} · ${esc(schedule.department)}</p>
      <div class="feature-meta">
        <span class="chip">${ICONS.calendar}<span>سكشنك: ${esc(state.section)}</span></span>
        <span class="chip">${ICONS.clock}<span>بداية الدراسة: ${esc(formatDateShort(schedule.studyStartDate))}</span></span>
      </div>
    </div>
  ```

### 2. CSS Cleanup (`assets/styles.css`)
- **`assets/styles.css:4457`:** Remove the `.schedule-hero` selector/rule if it is no longer used anywhere else.

---

## Rebuild & Verify
```powershell
node scripts/build.mjs --fix
node scripts/build.mjs --check
```
- Navigate to `#schedule` → confirm the year + term hero card no longer appears between `جدول الأسبوع` and `امتحانات الميدترم`.
