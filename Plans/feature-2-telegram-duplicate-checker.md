# Feature 2 — Telegram Bot Duplicate / Existence Checker

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Files:** `scripts/telegram-bot.mjs`, `bot/telegram-bot.mjs` (keep both identical)

---

## Goal
When a document is sent or forwarded to the Telegram bot, check whether a matching or similar file already exists in `data/subjects.json`. If a match is found, show the existing file details and let the admin decide whether to **Replace** the existing file, **Add as New File Anyway**, or **Cancel**.

---

## Implementation Plan

### 1. Matching Engine (`findExistingMatches(manifest, fileName, fileSize)`)
- Add helpers `normalizeCompare(value)` (lowercase, collapse spaces/dashes/underscores) and `formatBytes(bytes)`.
- When `msg.document` is received in `handleMessage(msg)`, before asking for the subject:
  - Compute:
    - `ext = path.extname(fileName).toLowerCase() || ".pdf"`
    - `slug = slugify(path.basename(fileName, ext))`
    - `defaultTitle = cleanTitleFromFilename(fileName)`
    - `normOriginal = normalizeCompare(fileName)`
    - `normTitle = normalizeCompare(defaultTitle)`
  - Scan all `manifest.subjects` → `sections` → `files` and collect match reasons:
    1. `same filename`: `normalizeCompare(file.original) === normOriginal`
    2. `same file ID/slug`: `file.id === slug` or `path.basename(file.path, ext) === slug`
    3. `same title`: `normalizeCompare(file.title) === normTitle`
    4. `same size & type`: `fileSize > 0 && file.size === fileSize` and extension matches `ext`
  - Deduplicate candidates by `file.path` (preferring non-`midterm-revision` entries), sort by match score descending, and return top 5.

### 2. Interactive Decision Flow (`handleMessage` & `handleCallback`)
- If `matches.length > 0`:
  - Store `pending.set(chatId, { step: "duplicate", fileId, fileName, fileSize, defaultTitle, title: defaultTitle, subjects: manifest.subjects, matches })`.
  - Send a warning listing each match (title, subject, section, original filename, size, and match reasons) with `duplicateKeyboard(matches)`:
    - `🔄 Replace #<n>: <title> (<subject>)` → `callback_data: "dup:replace:<idx>"`
    - `➕ Add as New File Anyway` → `callback_data: "dup:add_new"`
    - `❌ Cancel` → `callback_data: "cancel"`
- **On `dup:add_new`:**
  - Set `job.step = "subject"` and show `subjectKeyboard(job.subjects)` (normal flow; `publishUpload` appends `-2`, `-3`, etc. if path collides).
- **On `dup:replace:<idx>`:**
  - Set `job.mode = "replace"`, `job.replaceTarget = matches[idx]`, `job.subjectId`, `job.sectionId`, `job.step = "replace_title"`.
  - Show `replaceTitleKeyboard(existingTitle, defaultTitle)` with:
    - `✅ Keep "<existingTitle>"` (`title:keep`)
    - `📝 Use "<defaultTitle>"` (`title:default`)
    - `❌ Cancel` (`cancel`)
    - Or accept a custom text message while `job.step === "replace_title"`.

### 3. Replace Mode in `publishUpload(job)`
- When `job.mode === "replace"`:
  - Download the new file directly over `job.replaceTarget.file.path`.
  - Update `title`, `original`, `size`, `ext`, and `addedAt: new Date().toISOString()` on every manifest entry sharing that `path` (e.g., both the subject section and `midterm-revision`).
  - Run `scripts/build.mjs --fix` and `--check`, commit (`Update <title> (<subjectId>)`), and push.

---

## Verification Checklist
1. Send a file that matches an existing file by name or size → confirm bot lists the match(es) and shows `Replace`, `Add as New File Anyway`, and `Cancel`.
2. Test `Replace` → confirm existing file is overwritten without creating `-2` duplicates and `addedAt` is refreshed.
3. Test `Add as New File Anyway` → confirm normal subject/section flow runs.
4. Run:
   ```powershell
   node --check scripts/telegram-bot.mjs
   node --check bot/telegram-bot.mjs
   ```
