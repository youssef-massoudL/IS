# Feature 5 — Bookmarks (`المفضلة`) & Study Checklist (`تمت المذاكرة ✅`) Sync

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Files:** `assets/app.js`, `assets/quiz.js`, `assets/styles.css`

---

## Current State
- **Study Checklist (`hub:studied`):** Already implemented in `assets/app.js` (`getStudied()` at line 1505, `updateStudyProgress(subjectId)` at line 1510) for Matrix View, and `hub:studied` is already included in `assets/quiz.js` export/import/QR sync.
- **Missing:**
  1. **Bookmarks (`المفضلة`):** No bookmark storage, toggle button on file cards, or quick bookmarks strip/view.
  2. **Classic View Study Progress:** Progress bar & per-lecture `تمت المذاكرة ✅` toggle are currently only rendered in Matrix View (`renderMatrix`), not in Classic View (`renderClassicSections`).

---

## Implementation Plan

### 1. Bookmarks Storage & Helpers (`assets/app.js`)
- Standardize `BOOKMARKS_KEY = "hub:bookmarks"` in `localStorage` as `{ "<file.path>": true }`.
- Add helpers:
  - `getBookmarks()` → returns object map from `store.getJson(BOOKMARKS_KEY, {})`.
  - `isBookmarked(filePath)` → returns `Boolean(getBookmarks()[filePath])`.
  - `toggleBookmark(filePath)` → flips state in `hub:bookmarks`, saves to `localStorage`, and re-renders the bookmark strip & button state.

### 2. Bookmark Toggle on Every File Card (`assets/app.js`, `assets/styles.css`)
- In `fileRow(file, subject, sectionId, variant, options)`:
  - Check `const bookmarked = isBookmarked(file.path);`.
  - Inside `.file-actions`, add a compact bookmark button:
    ```html
    <button class="act bookmark${bookmarked ? " is-bookmarked" : ""}" type="button"
      data-bookmark-toggle="${esc(file.path)}"
      aria-pressed="${bookmarked ? "true" : "false"}"
      title="${bookmarked ? "إزالة من المحفوظات" : "حفظ في المفضلة"}"
      aria-label="حفظ في المفضلة">★</button>
    ```
  - *(Stop click propagation so clicking the bookmark button does not trigger `downloadRow` or `openPreview`.)*

### 3. Quick Bookmarks Strip (`المحفوظات السريعة`) (`assets/app.js`, `assets/styles.css`)
- In `renderSubject(subject)`:
  - Collect all files in `subject` where `isBookmarked(file.path)` is `true` (deduplicated by `file.path`).
  - When `bookmarkedFiles.length > 0`, render a compact collapsible **`المحفوظات السريعة (N)`** strip right above the Matrix/Classic sections listing those files via `fileRow(..., "file-compact")` for one-click access.
- Optional: add a **"المحفوظات"** filter chip in `#search-facets` (or a dedicated section in `#sidebar`) to view all bookmarked files across all subjects.

### 4. Study Checklist in Classic View (`assets/app.js`)
- In `renderClassicSections(subject)`:
  - Render the same `[data-progress="<subject.id>"]` progress bar (`تمت مذاكرة X من Y محاضرة — Z%`) at the top of Classic View, and show the `تمت المذاكرة` checkbox on lecture rows that have a `file.lecture` number so `updateStudyProgress(subject.id)` works in both Matrix and Classic views.

### 5. Cross-Device QR & JSON Sync (`assets/quiz.js`)
- In `assets/quiz.js` export/import & QR sync payload:
  - Include `bookmarks: JSON.parse(localStorage.getItem("hub:bookmarks") || "{}")` alongside `studied` (`hub:studied`) and `mistakes` (`hub:mistakes`).
  - Restore `hub:bookmarks` on import and dispatch a custom event (e.g. `hub:bookmarks-updated`) so `assets/app.js` re-renders.

---

## Verification Checklist
1. Click the bookmark button on a summary/question bank → confirm it highlights, appears in **`المحفوظات السريعة`** at the top of the subject, and persists after page reload.
2. Click the bookmark button again → confirm it removes from **`المحفوظات السريعة`**.
3. Export/Import JSON or QR Sync → confirm both `hub:studied` and `hub:bookmarks` transfer cleanly.
4. Run:
   ```powershell
   node --check assets/app.js
   node --check assets/quiz.js
   node scripts/build.mjs --check
   ```
