# Revamp Feature 03.5 — Telegram Bot `/task` Command (Weekly Tasks & Announcements Manager)

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Depends On:** Feature 03 (`Plans/revamp-03-schedule-and-weekly-tasks.md` — `data/schedule.json` now has `"weeklyTasks": []` and frontend fetches `data/schedule.json` with `cache: "no-store"`)  
**Architect / Lead:** Antigravity

---

## Goal

Add a fast, mobile-friendly **`/task`** command to the Telegram bot (`bot/telegram-bot.mjs` + `scripts/telegram-bot.mjs`) so the admin can publish, view, delete, and clean up **weekly tasks & doctor/TA announcements** (`data/schedule.json → weeklyTasks`) straight from Telegram — with automatic `build.mjs` sync and `git push`!

---

## Critical Gotchas (مطبات حرجة — MUST Handle Explicitly)

1. **Keep `bot/telegram-bot.mjs` and `scripts/telegram-bot.mjs` byte-for-byte identical:**
   - Railway/Docker runs `bot/telegram-bot.mjs`, local CLI runs `scripts/telegram-bot.mjs`. After finishing edits in `bot/telegram-bot.mjs`, copy it cleanly to `scripts/telegram-bot.mjs` and verify both pass `node --check` and are identical.
2. **Telegram `callback_data` 64-byte UTF-8 hard limit:**
   - NEVER embed Arabic titles or long task IDs in `callback_data` — Telegram rejects messages with `400 BUTTON_DATA_INVALID`.
   - **Required pattern:** Store `job.subjects`, `job.currentTasks`, `job.suggestedAuthors` inside the `pending` session map and pass short ASCII callback tokens only:
     - `task:menu:add`, `task:menu:list`, `task:menu:prune`
     - `task:subj:${idx}`, `task:subj:general`
     - `task:kind:assignment|quiz|presentation|project|news`
     - `task:sec:all`, `task:sec:custom`
     - `task:role:doctor|ta|admin`
     - `task:author:pick:${idx}`, `task:author:skip`
     - `task:details:skip`
     - `task:due:today`, `task:due:tomorrow`, `task:due:3d`, `task:due:7d`, `task:due:skip`
     - `task:confirm:save`
     - `task:del:${idx}`, `task:del_confirm:${idx}`
3. **Cairo Timezone (`Africa/Cairo`) for Quick Date Buttons (`اليوم` / `غداً` / `+3 أيام` / `+7 أيام`):**
   - Railway containers run in `UTC`. Between `00:00` and `02:00` Cairo time, `new Date().toISOString().slice(0, 10)` is **yesterday**!
   - **Required fix:** Use a dedicated helper `cairoDateStr(offsetDays = 0)` with `Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" })` (which outputs `YYYY-MM-DD` directly) applied to `new Date(Date.now() + offsetDays * 86400000)`.
4. **Arabic-Indic digits & flexible input parsing:**
   - Normalize `٠-٩` and `۰-۹` → ASCII `0-9` before parsing section numbers or `YYYY-MM-DD` dates.
   - For custom sections: accept formats like `1, 2, 3`, `1 2 3`, `١،٢،٣`, `1-3` (optional range support is nice!), deduplicate, sort ascending, and reject anything outside integers `1..11` with a clear retry prompt (keeping the session active!).
   - For custom dates: validate strict `YYYY-MM-DD` AND real calendar validity (e.g., reject `2026-02-30` by comparing parsed `getUTCFullYear/Month/Date` back to the input).
5. **Safe Delete by `task.id` (NOT array index) after `ensureRepo()`:**
   - Capture `const targetId = job.currentTasks[idx].id` from the session, then call `ensureRepo()` to pull the latest repo state, re-read `data/schedule.json`, and remove the entry matching `t.id === targetId`. Never trust an old array index across git pulls!
6. **Match the Exact Feature 03 `weeklyTasks` Schema:**
   ```json
   {
     "id": "task-20261120-a1b2c3",
     "subjectId": "database-2",
     "kind": "quiz",
     "title": "كويز في السكشن على المحاضرات 5 و 6",
     "details": "إحضار اللاب توب — مدة الكويز 15 دقيقة.",
     "authorRole": "ta",
     "authorName": "م/ محمد البربير",
     "sections": "all",
     "dueDate": "2026-11-24",
     "expiresAt": null,
     "createdAt": "2026-11-20T18:00:00.000Z"
   }
   ```
   - Generate collision-proof ASCII IDs: `task-${cairoDateStr(0).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8)}`.
   - Use `details: ""` (or omit/null cleanly — empty string `""` matches the frontend `esc()` check safely), `authorName: ""` if skipped, `dueDate: null` if skipped, `expiresAt: null`.
   - `commitAndPush(repoDir, manifest, commitMsg)` (`bot/telegram-bot.mjs:324`) ALREADY runs `build.mjs --fix`, `build.mjs --check`, `git add -A`, `git commit`, and `git push`! Reuse it directly (just like `addSubjectLinkInRepo` at line 754 does!).
7. **Auto-suggest Doctor / TA Names from `data/schedule.json`:**
   - When the admin selects `authorRole === "doctor"` for a real subject (`subjectId !== "general"`), read `schedule.coursesMeta?.[subjectId]?.doctors || []` and offer 1-tap inline buttons for each doctor!
   - When `authorRole === "ta"` for a real subject, read unique instructors from `schedule.sectionsTimetable` matching `subjectId` (filtered to the chosen `sections` if custom, or all unique TAs for that subject if `"all"`, capped at 6 buttons) so the admin can pick the TA in 1 tap — while ALWAYS allowing typing any custom name OR tapping `⏭ تخطي`!

---

## Step-by-Step Implementation Plan

### 1. Helper Constants & Pure Utilities (`bot/telegram-bot.mjs`)
Add clean, self-contained helpers near the `addSubjectLinkInRepo` / `removeSubjectLinkInRepo` section (around line 820):
- Constants:
  ```js
  const TASK_KINDS = [
    { key: "assignment", label: "📝 تسليم (Assignment)" },
    { key: "quiz", label: "⚡ كويز (Quiz)" },
    { key: "presentation", label: "🎤 عرض (Presentation)" },
    { key: "project", label: "🛠 مشروع (Project)" },
    { key: "news", label: "📢 خبر / تنبيه (News)" },
  ];
  const TASK_ROLES = [
    { key: "doctor", label: "👨‍🏫 دكتور" },
    { key: "ta", label: "🧑‍💻 معيد" },
    { key: "admin", label: "🏛 إدارة / عام" },
  ];
  ```
- `normalizeDigits(str)`: converts Arabic-Indic (`٠-٩`) and Extended Arabic-Indic (`۰-۹`) to ASCII `0-9`.
- `cairoDateStr(offsetDays = 0)`: returns `"YYYY-MM-DD"` in `Africa/Cairo` timezone.
- `isValidIsoDate(str)`: validates strict `^\d{4}-\d{2}-\d{2}$` and real calendar date (month `1..12`, valid day for month/leap-year).
- `parseSectionsInput(raw)`: normalizes digits, splits on `[\s,،]+`, supports optional ranges like `1-3` or single numbers `1..11`, returns sorted unique integer array `number[]` or `null` if empty/invalid.
- `isWeeklyTaskExpired(task, todayIso = cairoDateStr(0))`: mirrors Feature 03's frontend auto-expiry rule:
  - If `task.expiresAt && isValidIsoDate(task.expiresAt)`: expired if `todayIso > task.expiresAt`.
  - Else if `task.dueDate && isValidIsoDate(task.dueDate)`: expired if `todayIso > addDaysIso(task.dueDate, 2)` (2 days grace period after due date).
  - Else if `task.createdAt`: expired if older than 14 days.
  - Otherwise `false`.
- `suggestTaskAuthors(schedule, subjectId, role, sections)`:
  - If `subjectId === "general"` or `role === "admin"`: return `[]`.
  - If `role === "doctor"`: return `(schedule?.coursesMeta?.[subjectId]?.doctors || []).filter(Boolean)`.
  - If `role === "ta"`: scan `schedule?.sectionsTimetable || {}` for chosen `sections` (all `"1".."11"` if `sections === "all"`, or specific section keys), collect unique `entry.instructor` where `entry.subjectId === subjectId`, capped to first 6.
- `formatTaskPreviewHtml(task, subjectName)`: formats a crisp HTML summary block for confirmation & list messages (escaped with `escapeHtml()`!).

### 2. Repo Mutation Functions (`bot/telegram-bot.mjs`)
Mirror the clean `addSubjectLinkInRepo` pattern (`lines 754–819`):
- `getWeeklyTasksFromRepo(repoDir)`: reads `data/schedule.json`, returns `Array.isArray(schedule.weeklyTasks) ? schedule.weeklyTasks : []`.
- `addWeeklyTaskInRepo(taskData)`:
  1. `const repoDir = ensureRepo();`
  2. `const manifest = readManifest(repoDir);`
  3. Read `data/schedule.json`, ensure `Array.isArray(schedule.weeklyTasks)` (init `[]` if missing).
  4. Build final task object with generated `id` and `createdAt: new Date().toISOString()`.
  5. Unshift or push to `schedule.weeklyTasks`, write `data/schedule.json` with `JSON.stringify(schedule, null, 2) + "\n"`.
  6. Call `commitAndPush(repoDir, manifest, \`Add weekly task: ${task.title.slice(0, 50)}\`)`.
  7. Return `{ task, total: schedule.weeklyTasks.length, commit }`.
- `removeWeeklyTaskInRepo(taskId)`:
  1. `const repoDir = ensureRepo();`
  2. `const manifest = readManifest(repoDir);`
  3. Read `data/schedule.json`, find by `t.id === taskId` (throw clear error if not found), remove it, write `data/schedule.json`.
  4. Call `commitAndPush(repoDir, manifest, \`Remove weekly task: ${removed.title.slice(0, 50)}\`)`.
  5. Return `{ removed, remaining: schedule.weeklyTasks.length, commit }`.
- `pruneExpiredTasksInRepo()`:
  1. `const repoDir = ensureRepo();`
  2. `const manifest = readManifest(repoDir);`
  3. Read `data/schedule.json`, filter out entries where `isWeeklyTaskExpired(t)` is `true`.
  4. If nothing removed, return `{ removedCount: 0, remaining: list.length, commit: "no-changes" }`.
  5. Write `data/schedule.json`, call `commitAndPush(repoDir, manifest, \`Prune ${removedCount} expired weekly task(s)\`)`.
  6. Return `{ removedCount, remaining: kept.length, commit }`.

### 3. `/task` Command Entry & Help / Menu Registration (`bot/telegram-bot.mjs`)
- **In `setMyCommands` (lines 2343–2358):** Add `{ command: "task", description: "Add or manage weekly tasks & news" }` right below `youtube` (or near the top of management commands).
- **In `/start` & `/help` text (lines 1400–1416):** Add `/task — Add, view, or delete weekly tasks & news`.
- **In `handleText()` (right after `parsed?.cmd === "youtube"` around line 1504):**
  - Handle `if (parsed?.cmd === "task")`:
    - Call `ensureRepo()`, read `manifest` & `schedule`, count active vs. expired tasks.
    - Store session in `pending.set(chatId, { flow: "task", step: "task_menu", subjects: manifest.subjects || [], currentTasks: tasks })`.
    - Send main menu inline keyboard:
      - `➕ إضافة مهمة / خبر جديد` (`task:menu:add`)
      - `📋 عرض / حذف المهام (${tasks.length})` (`task:menu:list`) — if `tasks.length > 0`
      - `🧹 تنظيف المهام المنتهية (${expiredCount})` (`task:menu:prune`) — if `expiredCount > 0`
      - `❌ Cancel` (`cancel`)

### 4. Interactive Wizard Steps (`handleCallback` + `handleText` in `bot/telegram-bot.mjs`)

**Add Task Flow (8 fast steps, mostly 1-tap buttons):**
1. **Pick Subject (`task:menu:add` → `task:subj:*`):**
   - Inline buttons for all 5 subjects (`task:subj:${idx}`) + **`🏛 عام — القسم كله`** (`task:subj:general`) + `❌ Cancel`.
2. **Pick Kind (`task:kind:*`):**
   - 5 inline buttons from `TASK_KINDS` (`assignment`, `quiz`, `presentation`, `project`, `news`) + `❌ Cancel`.
3. **Pick Sections (`task:sec:*` + text step `task_sections`):**
   - Buttons: `👥 كل السكاشن (1–11)` (`task:sec:all`) | `🎯 سكاشن معينة` (`task:sec:custom`) | `❌ Cancel`.
   - If `custom`: set `job.step = "task_sections"`, ask admin to type section numbers (e.g. `1, 2, 3` or `4-6`). Validate with `parseSectionsInput()`; if invalid, reply with format hint and stay on `task_sections`.
4. **Pick Author Role (`task:role:*`):**
   - Buttons: `👨‍🏫 دكتور` (`task:role:doctor`) | `🧑‍💻 معيد` (`task:role:ta`) | `🏛 إدارة / عام` (`task:role:admin`) | `❌ Cancel`.
5. **Author Name (1-tap suggestions OR type OR skip — `task:author:*` + text step `task_author`):**
   - Look up `suggestTaskAuthors(schedule, job.draft.subjectId, role, job.draft.sections)`.
   - Save on `job.suggestedAuthors`.
   - Show 1-tap buttons for each suggested name (`task:author:pick:${idx}`) + `⏭ تخطي الاسم` (`task:author:skip`) + `❌ Cancel`, and instruct: *"اختر من الأزرار أو اكتب الاسم بنفسك:"*.
6. **Title (text step `task_title` — required):**
   - Prompt: *"✏️ اكتب عنوان المهمة أو الخبر (مثال: كويز على المحاضرة 5 و 6):"* + Cancel button.
   - Reject empty text; trim and save `job.draft.title`.
7. **Details (optional — text step `task_details` + `task:details:skip`):**
   - Prompt: *"📄 اكتب تفاصيل إضافية (القاعة، المطلوب تسليمه، رابط...) أو اضغط تخطي:"* + `⏭ تخطي التفاصيل` (`task:details:skip`) + Cancel button.
8. **Due Date (`task:due:*` + text step `task_due`):**
   - Prompt with Cairo dates clearly shown on buttons:
     - `📌 اليوم (${cairoDateStr(0)})` (`task:due:today`)
     - `📅 غداً (${cairoDateStr(1)})` (`task:due:tomorrow`)
     - `🗓 بعد 3 أيام (${cairoDateStr(3)})` (`task:due:3d`)
     - `🗓 بعد أسبوع (${cairoDateStr(7)})` (`task:due:7d`)
     - `⏭ بدون تاريخ محدد` (`task:due:skip`)
     - `❌ Cancel` (`cancel`)
   - Also allow typing any `YYYY-MM-DD` directly while on `job.step = "task_due"`! Validate with `isValidIsoDate()` (after `normalizeDigits()`).
9. **Confirm & Publish (`task:confirm:save`):**
   - Show `formatTaskPreviewHtml(job.draft, subjectName)` with buttons:
     - `✅ نشر على الموقع` (`task:confirm:save`)
     - `❌ إلغاء` (`cancel`)
   - On confirm: `pending.delete(chatId)`, send `"⏳ جاري النشر على الموقع..."`, call `addWeeklyTaskInRepo(job.draft)`, reply with success message + commit hash + `START_KEYBOARD`.

**List & Delete Flow (`task:menu:list` → `task:del:${idx}` → `task:del_confirm:${idx}`):**
- List all current tasks in `schedule.weeklyTasks` (showing `[منتهي]` tag if `isWeeklyTaskExpired(t)`), with a delete button per task (`🗑 ${shortTitle}` → `task:del:${idx}`, truncated to ≤ 38 chars so button labels stay tidy!).
- Tapping a task asks for quick confirmation (`✅ تأكيد الحذف` → `task:del_confirm:${idx}` | `❌ إلغاء` → `cancel`) before calling `removeWeeklyTaskInRepo(targetTask.id)`.

**Prune Flow (`task:menu:prune`):**
- Calls `pruneExpiredTasksInRepo()`, replies with count of pruned tasks + commit hash.

### 5. Sync `scripts/telegram-bot.mjs`
- Copy `bot/telegram-bot.mjs` → `scripts/telegram-bot.mjs` so both files are 100% identical.

---

## Verification Checklist (Must All Pass Before Moving to Feature 04)

### Automated CLI & Unit-Logic Checks
```powershell
node --check bot/telegram-bot.mjs
node --check scripts/telegram-bot.mjs
node scripts/build.mjs --check
```
- Verify byte-for-byte identity between `bot/telegram-bot.mjs` and `scripts/telegram-bot.mjs`:
  ```powershell
  node -e "const fs=require('fs'); console.log('identical:', fs.readFileSync('bot/telegram-bot.mjs').equals(fs.readFileSync('scripts/telegram-bot.mjs')))"
  ```
  Must print `identical: true`.
- Verify all `callback_data` literals/templates used in the `/task` flow are strictly `< 64` UTF-8 bytes.
- Sanity-test pure parsing helpers in Node (or via code inspection):
  - `parseSectionsInput("١، ٢، 3-5")` → `[1, 2, 3, 4, 5]`
  - `parseSectionsInput("0, 12")` → `null`
  - `isValidIsoDate("2026-02-30")` → `false`, `isValidIsoDate("2026-11-25")` → `true`
  - `cairoDateStr(0)` returns `YYYY-MM-DD` in Cairo timezone.

### Manual Telegram Bot Smoke Test (Admin)
1. Send `/start` → verify `/task` appears in the help text and Telegram `/` command menu.
2. Send `/task` → tap **➕ إضافة مهمة / خبر جديد** → complete all steps (verify doctor/TA suggestion buttons appear!) → confirm preview card → verify commit is pushed and `data/schedule.json` + `assets/data.js` update cleanly.
3. Open `#schedule` on the site (normal reload, no hard refresh!) → confirm the newly added task appears immediately under **"أخبار ومطلوب الأسبوع"** for the right section(s).
4. Send `/task` → tap **📋 عرض / حذف المهام** → delete the test task → verify it disappears from `#schedule` on next reload.
