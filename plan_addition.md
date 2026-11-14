# Implementation Plan Addition — `تصحيح` UI Tweaks & Research Methods Question Bank

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  

---

## 1. Remove `"تم نقل السؤال إلى تبويب تصحيح."` Notice (`assets/quiz.js`)

- **Current State:** In `assets/quiz.js` line `1090`, after a correct single-question retry (`answerSingleRetry`), `ui.message = moved ? "تم نقل السؤال إلى تبويب تصحيح." : "";` sets a banner message rendered in `<div class="quiz-note">`.
- **Change:**
  - Set `ui.message = "";` at `assets/quiz.js:1090` so the `"تم نقل السؤال إلى تبويب تصحيح."` banner line is no longer displayed.
  - *(Keep the live count update on `تصحيح (N)` / `أخطائي (N)` tabs and `hub:mistakes-updated` badge sync intact.)*

---

## 2. Move Import / Export Above Exam-Type Box on the Left in `تصحيح` (`assets/quiz.js`, `assets/styles.css`)

- **Current State:** In `renderMistakes()` (`assets/quiz.js:931-965`), `filters` (`.mistakes-filters`, containing the `"نوع الاختبار"` and `"المحاضرة"` filter box) is rendered at line `946` **above** `.mistakes-actions` / `.quiz-tools` (lines `947-965`, containing `تصدير` and `استيراد`).
- **Change (`assets/quiz.js`):**
  - When `ui.mistakesView === "corrected"` (or inside `.mistakes-toolbar`), render the `.quiz-tools` row (`نقل تقدمي للموبايل`, `تصدير`, `استيراد`) **above** `.mistakes-filters` (`نوع الاختبار`), aligned to the **left** side of the RTL container.
  - Keep `.mistakes-actions` (with `امتحن في أخطاء التبويب الحالي` + `.quiz-tools`) clean when `ui.mistakesView === "active"`, or place `.mistakes-tools-top` directly above `.mistakes-filters` when `ui.mistakesView === "corrected"` so `تصدير` and `استيراد` sit right above the `"نوع الاختبار"` box on the left.
- **Change (`assets/styles.css`):**
  - Ensure the tools bar above `.mistakes-filters` uses:
    ```css
    .mistakes-tools-top {
      display: flex;
      justify-content: flex-end; /* Left side in RTL */
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      width: 100%;
    }
    ```
  - Verify mobile responsiveness (`@media (max-width: 720px)`) so buttons wrap cleanly without overflow.

---

## 3. Add Translated Research Methods Question Bank to Both Research Hero & Midterm Revision

- **Source File:**  
  `D:\الكلية\Website project\Research Methods\Midterm Revision\Most important to add\بنك أسئلة البحث العلمي مترجم ومشروح (المحاضرات 1 - 4) (2).pdf` (`1,028,402` bytes)
- **Destination File:**  
  `files/research-methods/midterm-revision/research-methods-question-bank-translated-explained-1-to-4.pdf`
- **Manifest Updates (`data/subjects.json`):**
  Add this entry (with `"docTag": "أسئلة"`) to **both** sections:
  1. `subjects[id="midterm-revision"]` → `sections[id="research"]` → `files`
  2. `subjects[id="research-methods"]` → `sections[id="midterm-revision"]` → `files`

  ```json
  {
    "id": "research-methods-question-bank-translated-explained-1-to-4",
    "title": "بنك أسئلة البحث العلمي مترجم ومشروح (المحاضرات 1 - 4)",
    "original": "بنك أسئلة البحث العلمي مترجم ومشروح (المحاضرات 1 - 4) (2).pdf",
    "path": "files/research-methods/midterm-revision/research-methods-question-bank-translated-explained-1-to-4.pdf",
    "ext": "pdf",
    "size": 1028402,
    "youtube": "",
    "docTag": "أسئلة"
  }
  ```
  - *Note on Hero Box sync:* Because `renderMatrix()` in `assets/app.js` derives Research Methods' Hero Revision files directly from `midterm-revision → research`, adding it to both sections ensures it appears **both** in the **Research Methods Hero Revision box** and under **مناهج البحث (Research)** in the **Midterm Revision Kanban page**, labeled with the `أسئلة` badge (5 curated files total for Research).

---

## 4. Rebuild & Verify

```powershell
node scripts/build.mjs --fix
node scripts/build.mjs --check
./scripts/build-zips.ps1 -Quiet
```

- Confirm `node scripts/build.mjs --check` exits `0` (`manifest is in sync with files/, schedule and embedded data`).
- In browser:
  1. Solve a single mistake in `أخطائي` → confirm `"تم نقل السؤال إلى تبويب تصحيح."` no longer appears.
  2. Switch to `تصحيح` → confirm `استيراد` and `تصدير` sit **above** the `نوع الاختبار` filter box on the **left**.
  3. Check `#research-methods` Hero Revision box and `#midterm-revision` → Research Kanban column → confirm `بنك أسئلة البحث العلمي مترجم ومشروح (المحاضرات 1 - 4)` appears in both with the `أسئلة` badge and opens/downloads cleanly.
