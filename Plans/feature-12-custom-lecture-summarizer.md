# Feature 12 — Custom Lecture Summarizer (`$0` Runtime, Gemini Flash Pre-Generation)

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Depends On:** None (uses existing `GEMINI_API_KEY` / `GEMINI_MODEL` setup from `bot/telegram-bot.mjs` for one-time generation)

---

## Goal
Allow students to pick any combination of lectures in a subject (e.g., Lecture 2 + 4 + 5) and view a **single, merged, printable / Save-as-PDF summary page** — at **\$0 runtime cost** (zero live API calls, zero server).

---

## Architecture (`$0` Runtime)
1. **Static Markdown Store (`data/summaries/<subjectId>/lec-XX.md`):**
   - Each lecture summary is generated **once** (via a CLI batch script or automatically on Telegram bot upload) using Gemini Flash (`GEMINI_MODEL`, defaulting to `gemini-2.5-flash`) and committed as plain `.md` files.
   - Add a lightweight index file `data/summaries/index.json` (or `hasSummary` flag / lecture map in `data/subjects.json` via `scripts/build.mjs`) so the UI knows which lectures have ready summaries without extra 404 requests.
2. **Browser Merger & Print View (`assets/app.js`, `assets/styles.css`):**
   - In `renderSubject(subject)` (`assets/app.js:1875`), add a **`ملخص مخصص` (Custom Summary)** panel/button when the subject has ≥1 generated lecture summary.
   - Students check the lectures they want (plus quick presets: `تحديد الكل`, `أول N محاضرات`, `المحددة في الميدترم`).
   - Clicking **عرض الملخص المدمج** fetches the selected `data/summaries/<subjectId>/lec-XX.md` files in parallel (`Promise.all`), renders them into clean HTML inside `#modal` (or a dedicated `#summary-reader` view) using a tiny, dependency-free Markdown-to-HTML renderer (~40 lines supporting headings, lists, bold/italic, code blocks, and tables), and provides a **`طباعة / حفظ PDF`** (`window.print()`) button with `@media print` CSS.

---

## Implementation Plan

### 1. One-Time Batch Generator (`scripts/generate-summaries.mjs`)
- Create `scripts/generate-summaries.mjs` (Node.js ESM, zero extra npm dependencies, using built-in `fetch` + `GEMINI_API_KEY` + `GEMINI_MODEL` matching `bot/telegram-bot.mjs:44-45`):
  - Reads `data/subjects.json`, finds lecture files (`section.id === "lectures"` with `Number.isInteger(file.lecture)`).
  - Skips lectures that already have `data/summaries/<subjectId>/lec-XX.md` unless `--force` is passed.
  - Sends the lecture PDF/text to Gemini `generateContent` with a structured Arabic+English study-summary prompt (key concepts, definitions, formulas/diagrams in text, exam bullet points).
  - Writes `data/summaries/<subjectId>/lec-<NN>.md` and updates `data/summaries/index.json` (`{ "<subjectId>": [1, 2, ...] }`).
  - Supports `--subject <id>` and `--dry-run` flags so you can stay well within Gemini Flash free-tier rate limits.

### 2. Auto-Generate on Telegram Bot Upload (`bot/telegram-bot.mjs` & `scripts/telegram-bot.mjs`)
- Mirror the existing `updateQuestionBankFromUpload()` pattern (`bot/telegram-bot.mjs:390+`):
  - When a file is uploaded to `lectures` with a lecture number, optionally generate `data/summaries/<subjectId>/lec-<NN>.md` and update `data/summaries/index.json` in the same commit (non-fatal if `GEMINI_API_KEY` is missing or quota is hit).
  - Keep `scripts/telegram-bot.mjs` and `bot/telegram-bot.mjs` identical.

### 3. Manifest / Build Integration (`scripts/build.mjs` & `.github/workflows/deploy.yml`)
- Ensure `data/summaries/` is included in the deployed static bundle (`.github/workflows/deploy.yml` already copies `data/` if `data/` is copied, verify `data/summaries/` is included).
- Update `scripts/build.mjs` to preserve or rebuild `data/summaries/index.json` if needed.

### 4. Frontend Custom Summarizer UI (`assets/app.js`, `assets/styles.css`)
- **Subject Trigger (`assets/app.js:1875`, `renderSubject`):**
  - Load `data/summaries/index.json` on boot (alongside `subjects.json` / `schedule.json`).
  - If `summariesIndex[subject.id]?.length > 0`, render a compact **`تلخيص مخصص للمحاضرات`** card/trigger in the subject header or above the sections.
- **Selector & Reader (`assets/app.js`):**
  - Checkbox list of available lectures (`المحاضرة 1`, `المحاضرة 2`, …) with `تحديد الكل` / `إلغاء التحديد`.
  - `renderMarkdownBasic(md)` helper (escapes HTML first, then converts `#`/`##`/`###`, `-`/`*` lists, `**bold**`, `` `code` ``, and Markdown tables).
  - Opens the merged document inside `#modal` (with a `طباعة / حفظ PDF` button calling `window.print()`).
- **Print Styles (`assets/styles.css`):**
  - Add `@media print` rules that hide `.topbar`, `.sidebar`, `.tabs-bar`, `.modal-head`, and print only `#modal-body` cleanly on white background with dark text and page-break-friendly headings (`break-after: avoid`).

---

## Verification Checklist
1. Run `node scripts/generate-summaries.mjs --subject database-2` with `GEMINI_API_KEY` set → confirm `data/summaries/database-2/lec-01.md`.. and `data/summaries/index.json` are created.
2. Open `#database-2` in the browser → select Lectures 1 + 3 → click **عرض الملخص المدمج** → confirm both summaries render cleanly with zero network calls to any AI API.
3. Click **طباعة / حفظ PDF** → confirm print preview shows only the merged summary cleanly formatted.
4. Run:
   ```powershell
   node --check assets/app.js
   node --check scripts/generate-summaries.mjs
   node scripts/build.mjs --check
   ```
