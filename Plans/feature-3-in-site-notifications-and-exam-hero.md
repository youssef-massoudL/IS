# Feature 3 — In-Site Notifications System & Exam-Day Hero Pointer

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Depends On:** Feature 1 (`file.addedAt` for new-file notifications)

---

## Goal
Add an in-site notifications system (topbar bell + unread badge + dropdown panel + exam-day banner) that:
1. Notifies students when new files are added.
2. Notifies students about upcoming and same-day exam times, with a direct link pointing to the **Hero Revision section** (`.review-block` via `#<subjectId>/midterm-revision`) of each exam on its day.

---

## Implementation Plan

### 1. HTML Structure (`index.html`)
- Inside `.top-actions`:
  - Add `.notif-wrap#notif-wrap` containing:
    - `#notif-toggle` bell button + `<span class="notif-badge" id="notif-badge" hidden>0</span>`
    - `<div class="notif-panel" id="notif-panel" role="dialog" aria-label="الإشعارات" hidden></div>`
- Inside `.main-col` right above `#smart-strip`:
  - Add `<div class="notif-banner" id="notif-banner" hidden></div>`.

### 2. Notification Builder (`buildNotifications()` in `assets/app.js`)
1. **Exam Time Notifications (from `state.schedule.midterms`):**
   - Compute calendar-day difference between `today` and `midterm.date`:
     - **Same day (`days === 0` and `endAt >= now`):** `kind: "exam-today"`, priority `1`, title `"اليوم امتحان <subjectName>"` (or `"امتحان <subjectName> جارٍ الآن"` if `now` is between `startTime` and `endTime`), meta `"<startTime>–<endTime> · <venue>"`, `href: "#<subjectId>/midterm-revision"`, `ctaLabel: "مراجعة الميدترم ★"`.
     - **Tomorrow (`days === 1`):** `kind: "exam-soon"`, priority `2`, title `"غداً امتحان <subjectName>"`, `href: "#<subjectId>/midterm-revision"`.
     - **Upcoming (`2 <= days <= 7`):** `kind: "exam-soon"`, priority `3`, title `"بعد <days> أيام: امتحان <subjectName>"`, `href: "#<subjectId>/midterm-revision"`.
   - `#<subjectId>/midterm-revision` is handled by `route()` in `assets/app.js` to navigate to the subject and scroll directly to `.review-block` (the hero revision section).
2. **New File Notifications (from `state.data.subjects`):**
   - Collect all files with `addedAt` within the last 7 days (`NOTIF_FILE_WINDOW_MS`), deduplicated by `file.path` (preferring the subject's primary section over `midterm-revision`), sorted newest first.
   - Each item has `href: "#<subjectId>/<sectionId>/<fileId>"`, `recent24h: isRecentFile(file)`, and relative Arabic time (`formatRelativeTimeAr(file.addedAt)`).

### 3. UI, Read State & Browser Notifications (`assets/app.js`)
- **Read/Dismiss State (`localStorage`):**
  - `hub:notif:seen`: array of seen notification IDs (`markNotifSeen`, `markAllNotifsSeen`).
  - `hub:notif:banner-dismissed`: array of dismissed banner IDs.
  - `hub:notif:browser`: `"1"` when user opts into native `Notification` API alerts.
- **Bell & Dropdown (`renderNotifications()`):**
  - Updates `#notif-badge` with unread count (hidden when `0`).
  - Renders header (`تحديد الكل كمقروء` + optional `تفعيل إشعارات المتصفح`) and clickable `.notif-item` rows.
- **Exam-Day & New-File Banner (`renderNotifBanner()`):**
  - Shows a high-visibility banner above `#smart-strip` when there is an undismissed `exam-today` item (pointing directly to `#<subjectId>/midterm-revision` with `مراجعة الميدترم ★`) or an unseen `recent24h` file.
- Call `renderNotifBanner()` and `renderNotifications()` inside `render()`, and `maybeSendBrowserNotifications()` inside `boot()`.

### 4. Styles (`assets/styles.css`)
- Style `.notif-wrap`, `.notif-badge`, `.notif-panel`, `.notif-item`, `.notif-tag` (`.is-exam`, `.is-soon`, `.is-star`), and `.notif-banner` (with mobile `@media (max-width: 720px)` adjustments and `[data-theme="dark"]` variants).

---

## Verification Checklist
1. On an exam's day, confirm `#notif-banner` appears with the exam time and clicking **`مراجعة الميدترم ★`** navigates to that subject and scrolls to `.review-block`.
2. Open the bell dropdown → confirm exam notifications and newly added files appear, unread count updates, and `تحديد الكل كمقروء` clears the badge.
3. Run:
   ```powershell
   node --check assets/app.js
   node scripts/build.mjs --check
   ```
