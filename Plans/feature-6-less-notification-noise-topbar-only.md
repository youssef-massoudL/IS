# Feature 6 — Less Notification Noise & Topbar-Only Notifications

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Depends On:** Feature 3 (`Plans/feature-3-in-site-notifications-and-exam-hero.md`)

---

## Goal
1. Keep notifications strictly in the topbar bell (`#notif-toggle`, `#notif-badge`, `#notif-panel`) so they do **not** appear inside the page body (`#notif-banner`) when a user enters the site.
2. Reduce notification noise in `buildNotifications()` and browser notifications so only genuinely urgent/fresh items appear.

---

## Implementation Plan

### 1. Remove Inline Page Banner (`index.html`, `assets/app.js`)
- **`index.html:117`:** Keep `<div class="notif-banner" id="notif-banner" hidden></div>` hidden (or remove it), and never unhide it.
- **`assets/app.js:1118-1165` (`renderNotifBanner`):**
  - Replace the body with:
    ```js
    function renderNotifBanner() {
      if (!notifBannerEl) return;
      notifBannerEl.hidden = true;
      notifBannerEl.innerHTML = "";
    }
    ```
  - *(Optional cleanup)* Remove the `notifBannerEl` click handler (`assets/app.js:3344-3362`) and unused `.notif-banner*` CSS rules (`assets/styles.css:6179-6278`) if `#notif-banner` is removed from `index.html`.
- Keep `#notif-wrap`, `#notif-toggle`, `#notif-badge`, and `#notif-panel` (`index.html:36-42`) untouched as the sole notification UI at the top of the page.

### 2. Reduce Notification Noise (`assets/app.js`)
- **`assets/app.js:908`:** Change `NOTIF_FILE_WINDOW_MS` from `7 * 24 * 60 * 60 * 1000` (7 days) to `24 * 60 * 60 * 1000` (24 hours, matching `RECENT_FILE_WINDOW_MS`).
- **`assets/app.js:996-1008` (`buildNotifications`):**
  - Remove the `else if (days >= 2 && days <= 7)` block so `exam-soon` notifications only appear for **tomorrow** (`days === 1`) and **today** (`days === 0`).
- **`assets/app.js:1037-1051` (`buildNotifications`):**
  - Cap `recentFiles` to the 5 newest files:
    ```js
    const recentFiles = Array.from(fileCandidates.values())
      .sort((a, b) => b.addedMs - a.addedMs)
      .slice(0, 5);
    ```
- **`assets/app.js:1174` (`maybeSendBrowserNotifications`):**
  - Change condition to `if (item.kind !== "exam-today") continue;` so browser push notifications only fire for same-day exams, not every new file.

---

## Rebuild & Verify
```powershell
node scripts/build.mjs --fix
node scripts/build.mjs --check
```
- Open the site → confirm **no** notification banner appears inside `.main-col` / page body.
- Click `#notif-toggle` in the topbar → confirm only today/tomorrow exams and up to 5 files from the last 24h appear.
