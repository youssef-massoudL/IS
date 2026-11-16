# Feature 7 — Replace PC Search with Per-Exam Committee Distribution PDFs

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Depends On:** None

---

## Goal
Remove the `"رقم جهازك (مثلاً 940)"` PC-number search input from the nearest-midterm card (`#smart-strip`), bundle the 3 exam committee distribution PDFs into the repo, and open the current/nearest exam's PDF directly in the site's built-in PDF viewer (`openPreview`) right from `.midterm-halls-head`.

---

## Implementation Plan

### 1. Copy the 3 Committee PDFs into the Repo
Copy from `D:\الكلية\Website project\plans\Place feature\` to `files/committees/`:

1. **Information Theory (`information-theory`, Monday):**
   - Source: `D:\الكلية\Website project\plans\Place feature\الاثنين - نظم معلومات - نظرية المعلومات.pdf` (`1,487,470` bytes)
   - Destination: `files/committees/information-theory-committees.pdf`
2. **Database 2 (`database-2`, Tuesday):**
   - Source: `D:\الكلية\Website project\plans\Place feature\الثلاثاء - نظم معلومات - قواعد البيانات 2.pdf` (`1,539,657` bytes)
   - Destination: `files/committees/database-2-committees.pdf`
3. **Computer Networks (`computer-networks`, Wednesday):**
   - Source: `D:\الكلية\Website project\plans\Place feature\الاربعاء- نظم المعلومات - شبكات.pdf` (`1,485,429` bytes)
   - Destination: `files/committees/computer-networks-committees.pdf`

### 2. Data Schema (`data/schedule.json`)
In `data/schedule.json` (`midterms` array, lines `21-98`), add `"hallsFile"` to each corresponding midterm object:
- `subjectId: "information-theory"` → `"hallsFile": "files/committees/information-theory-committees.pdf"`
- `subjectId: "database-2"` → `"hallsFile": "files/committees/database-2-committees.pdf"`
- `subjectId: "computer-networks"` → `"hallsFile": "files/committees/computer-networks-committees.pdf"`

### 3. UI & In-Site PDF Preview (`assets/app.js`)
- **`assets/app.js:1218-1239` (`renderSmartStrip`):**
  - Remove `<input class="pc-lookup-input" ...>` and `<div class="midterm-halls-status" ...></div>`.
  - Resolve `const hallsFile = midterm?.hallsFile || "";`.
  - Render `.midterm-halls` whenever `midterm?.halls?.length || hallsFile` is truthy, placing a button in `.midterm-halls-head` to open the PDF in `#modal`:
    ```js
    const hallsGuide = midterm?.halls?.length || hallsFile
      ? `<div class="midterm-halls">
          <div class="midterm-halls-head">
            <span class="midterm-halls-title">${ICONS.pin} دليل اللجان والأجهزة</span>
            ${hallsFile
              ? `<button class="btn btn-sm halls-file-btn" type="button" data-halls-pdf="${esc(hallsFile)}" data-halls-title="${esc(`توزيع لجان ${midterm.subjectName}`)}">${ICONS.file}<span>ملف توزيع اللجان (PDF)</span></button>`
              : ""}
          </div>
          ${midterm.halls?.length
            ? `<div class="midterm-halls-list">
                ${midterm.halls
                  .map(
                    (hall) => `<div class="midterm-hall-item">
                      <div class="hall-info">
                        <strong class="hall-name">${esc(hall.name)}</strong>
                        <span class="hall-loc">${esc(hall.location)}</span>
                      </div>
                      <span class="hall-range" dir="ltr">PC ${hall.pcFrom} – ${hall.pcTo}</span>
                    </div>`,
                  )
                  .join("")}
              </div>`
            : ""}
        </div>`
      : "";
    ```
- **`assets/app.js:1279-1320`:**
  - Remove the `smartStripEl.addEventListener("input", ...)` handler for `.pc-lookup-input`.
  - Replace it with a `click` listener on `smartStripEl` that opens the PDF in `#modal` via `openPreview`:
    ```js
    if (smartStripEl) {
      smartStripEl.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-halls-pdf]");
        if (!btn) return;
        const path = btn.dataset.hallsPdf;
        if (!path) return;
        const title = btn.dataset.hallsTitle || "توزيع اللجان";
        openPreview({ title, ext: "pdf", path });
      });
    }
    ```

### 4. CSS Cleanup & Button Styling (`assets/styles.css`)
- **`assets/styles.css:1881-1915`:** Remove `.pc-lookup-input`, `.pc-lookup-input:focus`, `.midterm-halls-status`, and `.midterm-halls-status.is-error`.
- Add `.halls-file-btn` styling if needed so it aligns cleanly on the opposite side of `.midterm-halls-title` inside `.midterm-halls-head`.

---

## Rebuild & Verify
```powershell
node scripts/build.mjs --fix
node scripts/build.mjs --check
```
- Confirm all 3 PDFs exist under `files/committees/` and `build.mjs --check` passes.
- Confirm `#smart-strip` no longer renders any PC search input.
- Click `ملف توزيع اللجان (PDF)` in `.midterm-halls-head` → confirm the nearest exam's committee PDF opens directly inside `#modal` (with Download and Open-in-Tab actions).
