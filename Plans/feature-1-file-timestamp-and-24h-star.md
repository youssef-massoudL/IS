# Feature 1 — File Timestamping (`addedAt`) & 24-Hour `★ جديد` Star Label

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Depends On:** None (Prerequisite for Feature 3's new-file notifications)

---

## Goal
Automatically stamp newly added or replaced files with an ISO 8601 `addedAt` timestamp in `data/subjects.json`, and display a gold `★ جديد` star badge on any file added within the last 24 hours across all views (matrix, classic sections, hero review, kanban, and search).

---

## Implementation Plan

### 1. Manifest Schema (`data/subjects.json` & `scripts/build.mjs`)
- Add `"addedAt": "YYYY-MM-DDTHH:mm:ss.sssZ"` to newly added or replaced file entries in `data/subjects.json`.
- Ensure `scripts/build.mjs` preserves `addedAt` during `--fix` and `--check` (do not strip custom fields).

### 2. Stamp `addedAt` in CLI Helper (`scripts/add-file.mjs`)
- Inside `section.files.push({ ... })`, include:
  ```js
  addedAt: new Date().toISOString(),
  ```

### 3. Stamp `addedAt` in Telegram Bot (`scripts/telegram-bot.mjs` & `bot/telegram-bot.mjs`)
- In `publishUpload(job)`:
  - Capture `const nowIso = new Date().toISOString();`
  - Include `addedAt: nowIso` on `baseEntry` for new uploads and on updated entries when replacing an existing file.
  - Keep `scripts/telegram-bot.mjs` and `bot/telegram-bot.mjs` identical.

### 4. Frontend 24-Hour Helper & Rendering (`assets/app.js`)
- Add `RECENT_FILE_WINDOW_MS = 24 * 60 * 60 * 1000`.
- Add `isRecentFile(file)`:
  - Parses `file?.addedAt`. Returns `true` if valid and `-60000 <= Date.now() - addedMs <= RECENT_FILE_WINDOW_MS`.
- In `renderMatrix(subject)` when mapping `curatedFiles` from `midterm-revision`, preserve `addedAt: file.addedAt || curated.addedAt`.
- In `fileRow(file, subject, sectionId, variant, options)`:
  - Compute `const recent = isRecentFile(file);`.
  - Add `is-recent` to `.file` class when `recent` is `true`.
  - Render `<span class="new-file-star" title="تمت إضافته خلال آخر 24 ساعة">★ جديد</span>` next to `.file-title` / `.doc-tag`.

### 5. Styles (`assets/styles.css`)
- Style `.new-file-star` as an inline pill (`#fef9c3` background, `#facc15` border, `#a16207` text in light mode; translucent amber/gold in `[data-theme="dark"]`).
- Style `.file.is-recent` with a subtle amber border accent.

---

## Verification Checklist
1. Add a test file with `addedAt` set to the current ISO timestamp → confirm `★ جديد` appears in matrix, classic, review, kanban, and search views.
2. Set `addedAt` to 25 hours ago → confirm `★ جديد` disappears automatically.
3. Run:
   ```powershell
   node scripts/build.mjs --fix
   node scripts/build.mjs --check
   node --check assets/app.js
   node --check scripts/add-file.mjs
   ```
