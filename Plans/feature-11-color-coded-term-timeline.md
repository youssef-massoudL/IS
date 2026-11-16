# Feature 11 — Color-Coded Term Timeline (Past / Current / Upcoming)

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Depends On:** None

---

## Goal
Style the `الخريطة الزمنية للترم` (`.calendar-grid` / `.cal-card`) in `#schedule` with 3 distinct visual states based on the current date:
1. **Past (`endDate < today`):** Calm, muted, low-emphasis tone.
2. **Current (`startDate <= today <= endDate`):** Highlighted active color.
3. **Upcoming (`startDate > today`):** Distinct future/upcoming color.

---

## Implementation Plan

### 1. Status Classification (`assets/app.js:2122-2130`)
- In `renderSchedule()`:
  - Compute `today` at local midnight:
    ```js
    const now = new Date();
    const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    ```
  - For each `item` in `schedule.calendar || []`:
    ```js
    const start = parseLocalDate(item.startDate);
    const end = parseLocalDate(item.endDate || item.startDate);
    let statusClass = "is-upcoming";
    let statusLabel = "قادم";
    if (!Number.isNaN(end.getTime()) && end < todayMid) {
      statusClass = "is-past";
      statusLabel = "انتهى";
    } else if (!Number.isNaN(start.getTime()) && start <= todayMid && todayMid <= end) {
      statusClass = "is-current";
      statusLabel = "الآن";
    }
    ```
  - Render `.cal-card` with `${statusClass}` and a small status badge:
    ```html
    <div class="cal-card ${statusClass}">
      <div class="cal-card-top">
        <strong>${esc(item.title)}</strong>
        <span class="cal-status">${statusLabel}</span>
      </div>
      <span class="cal-dates">${esc(formatRange(item.startDate, item.endDate))}</span>
      ${item.note ? `<span class="cal-note">${esc(item.note)}</span>` : ""}
    </div>
    ```

### 2. Three-State Styling (`assets/styles.css:2780-2801`)
- Add `.cal-card-top` (`display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;`) and `.cal-status` pill styling.
- **Past (`.cal-card.is-past`):** Calm, subdued look:
  ```css
  .cal-card.is-past {
    opacity: 0.68;
    background: var(--surface-2);
    border-color: var(--border);
  }
  .cal-card.is-past .cal-note {
    color: var(--muted);
  }
  .cal-card.is-past .cal-status {
    color: var(--muted);
    background: var(--surface);
  }
  ```
- **Current (`.cal-card.is-current`):** Active highlight (teal/emerald):
  ```css
  .cal-card.is-current {
    border-color: color-mix(in srgb, #10b981 55%, var(--border));
    background: color-mix(in srgb, #10b981 10%, var(--surface-2));
  }
  .cal-card.is-current .cal-status {
    color: #047857;
    background: color-mix(in srgb, #10b981 18%, transparent);
  }
  ```
- **Upcoming (`.cal-card.is-upcoming`):** Distinct upcoming color (blue/accent):
  ```css
  .cal-card.is-upcoming {
    border-color: color-mix(in srgb, #3b82f6 40%, var(--border));
    background: color-mix(in srgb, #3b82f6 6%, var(--surface-2));
  }
  .cal-card.is-upcoming .cal-status {
    color: #1d4ed8;
    background: color-mix(in srgb, #3b82f6 14%, transparent);
  }
  ```
- Add `[data-theme="dark"]` overrides for `.cal-card.is-current .cal-status` (`color: #34d399`) and `.cal-card.is-upcoming .cal-status` (`color: #60a5fa`) so contrast stays sharp in dark mode.

---

## Rebuild & Verify
```powershell
node scripts/build.mjs --fix
node scripts/build.mjs --check
```
- Open `#schedule` → `الخريطة الزمنية للترم` and verify in both light and dark themes:
  - Past events (`بداية الدراسة`) have a calm muted style (`انتهى`).
  - Current period (`امتحانات الميدترم`, Nov 14–19 on 2026-11-16) has the active green/teal highlight (`الآن`).
  - Upcoming events (`الامتحانات العملية والشفوية`, `امتحانات نهاية الفصل`, `إجازة نصف العام`) have the distinct upcoming blue style (`قادم`).
