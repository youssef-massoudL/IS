# HANDOFF — third-year first-semester study site

Last updated: 2026-11-13
Owner request: turn the local course folders into a simple tabbed website with previews,
single-file / per-subject / whole-archive downloads, per-lecture YouTube links, and a way
to add files in the future.

---

## TL;DR status

| Area | State |
|---|---|
| Static site (HTML/CSS/JS, Arabic RTL) | **Done and visually verified** |
| Data manifest from real folders | **Done** — 6 subjects, 110 entries, 100 unique files |
| Preview (PDF/JPG/TXT), search, deep links, light/dark | **Done, verified in headless Chrome** |
| ZIP generation (`all.zip` + per subject) | **Done, generated locally** |
| GitHub Actions → Pages deploy | **Written, not yet run** (no repo created) |
| YouTube links | **Empty placeholders** — user will supply links |
| Upload flow | GitHub drag-drop + manifest edit (tier 1). Admin page **not** built |
| Legal/public check | **Pending** — user must confirm before publishing |

Working directory: `D:\الكلية\سنة تالتة - الترم الأول`
Site root: `D:\الكلية\سنة تالتة - الترم الأول\site`

**The site folder is self-contained.** The original subject folders and `مراجعة الميد`
in the parent directory were *copied* (not moved) during import and are still intact.
They are now redundant; delete only after confirming the site works.

---

## What was built

```
site/
├─ index.html                     ← shell, modal, upload-help dialog
├─ README.md                      ← Arabic docs (run, add files, deploy)
├─ robots.txt                     ← Disallow: / (unlisted)
├─ .nojekyll                      ← keeps Pages from processing folders
├─ .gitignore                     ← ignores downloads/*.zip, _site/
├─ assets/
│  ├─ app.js                      ← ~500 lines, no dependencies, **classic script**
│  ├─ data.js                     ← generated embedded copy of the manifest
│  ├─ styles.css                  ← design tokens, RTL, responsive, dark mode
│  └─ favicon.svg
├─ data/subjects.json             ← single source of truth (110 entries)
├─ files/<subject>/<section>/…    ← 100 files, 193.2 MB
├─ downloads/                     ← 7 zips, 353.2 MB (git-ignored)
├─ scripts/
│  ├─ import.mjs                  ← one-off importer (re-runnable, destructive to files/)
│  ├─ build.mjs                   ← manifest validator; --check (CI) / --fix (sizes)
│  ├─ build-zips.ps1              ← ZIP builder, cross-platform pwsh
│  └─ add-file.mjs                ← CLI: copy a file in + append manifest entry
└─ .github/workflows/deploy.yml   ← validate → zip → assemble → Pages
```

### Data model (`data/subjects.json`)

```json
{
  "title": "سنة تالتة — الترم الأول",
  "subtitle": "نظم المعلومات · ملازم ومحاضرات ومراجعات",
  "updated": "2026-11-13",
  "subjects": [{
    "id": "computer-networks",
    "name": "Computer Networks",
    "nameAr": "شبكات الحاسب",
    "accent": "#2563eb",
    "icon": "lan",
    "youtube": "",
    "sections": [{
      "id": "lectures",
      "name": "المحاضرات",
      "nameEn": "Lectures",
      "files": [{
        "id": "computer-network-lecture-01",
        "title": "المحاضرة 01",
        "original": "Computer Network _Lecture 01.pdf",
        "path": "files/computer-networks/lectures/computer-network-lecture-01.pdf",
        "ext": "pdf",
        "size": 2504970,
        "youtube": ""
      }]
    }]
  }]
}
```

Subjects and their sections:

| id | Arabic | sections |
|---|---|---|
| `computer-networks` | شبكات الحاسب | lectures, questions, simplified-explanations, midterm-revision |
| `database-2` | قواعد البيانات | lectures, books, questions, midterm-revision |
| `information-theory` | نظرية المعلومات | lectures, original-pptx, midterm-revision |
| `research-methods` | مناهج البحث | lectures, books, summaries, midterm-revision |
| `system-analysis` | تحليل النظم | lectures, books, questions, midterm-revision |
| `midterm-revision` | مراجعة الميد | computer-networks, database, information-theory, research, system-analysis, general |

### How the UI works

- Hash routing: `#<subject>`, `#<subject>/<section>`, `#<subject>/<section>/<fileId>` (opens preview).
- `?theme=light|dark` forces a theme (also used for screenshots/testing).
- `/` focuses search; `Esc` closes modals; `Esc` in search clears it.
- Collapse state per section is persisted in `localStorage` (`section:<id>`).
- Search matches title, original filename, id, subject name (AR + EN) → grouped results.
- Downloads: row → single file; subject card → `downloads/<id>.zip`; header → `downloads/all.zip`.
- Preview: PDF in `<iframe>` (native viewer), images inline, `.txt` fetched into `<pre>`,
  anything else (pptx) shows a "no preview" note with download buttons.

---

## Verification performed

Local server + headless Chrome + CDP (`D:\C\opencode\capture.mjs`, `verify.mjs` are scratch
files outside the project and can be recreated):

```powershell
cd site
python -m http.server 8899
node scripts/build.mjs --check
```

Expected output of `build.mjs --check`:

```
subjects 6 · entries 110 · 201.1 MB
manifest is in sync with files/
```

Browser assertions that passed (no console errors):

- 6 tabs, active tab `computer-networks`, heading «شبكات الحاسب», eyebrow `Computer Networks`
- 4 sections, 20 file rows, subject download href `downloads/computer-networks.zip`
- search «محاضرة» → 64 files across 5 groups
- deep link `#system-analysis/questions/lecture-01-question-solved` → modal open, PDF iframe
- layout has no horizontal overflow at 390px (`scrollWidth === clientWidth`)

ZIP totals produced locally:

```
all.zip 173.5 MB · computer-networks 57.7 · database-2 32.0 · information-theory 15.3
midterm-revision 7.0 · research-methods 22.0 · system-analysis 45.6  → 353.2 MB
```

---

## Decisions and why

1. **No framework, no build step.** Plain ES modules + JSON. Zero deps, trivial to host,
   easy for a non-developer to keep alive.
2. **Manifest is the source of truth**, not a runtime scan — a static host cannot list folders.
3. **Deduped `مراجعة الميد`.** 10 byte-identical PDFs (MD5-verified) were imported once;
   the revision tab *references* the canonical paths in the subject folders. That is why
   `midterm-revision` entries point to `files/computer-networks/...` etc.
4. **URL-safe slugs everywhere.** Arabic filenames were mapped to ASCII slugs
   (`شرح مبسط` → `simplified`, `درجات الميد` → `midterm-grades`, …); the original name is
   preserved in `original` and shown on hover. Slugs avoid percent-encoding issues on Pages.
5. **ZIPs are generated at build time, not committed** (`.gitignore`). Keeps git history
   ~193MB instead of ~546MB and avoids re-compressing in every commit.
6. **Only `all.zip` + per-subject zips.** Section zips were dropped because they would push
   the published site toward the 1GB Pages limit. Per-file download is a direct link.
7. **`Antigravity-x64.exe` (165.8MB) excluded.** Not course material, over the 100MB
   per-file GitHub limit, and Git LFS is not served by Pages.

---

## Gotchas for the next session

- **Windows PowerShell 5.1 `Join-Path` takes only two arguments.** `build-zips.ps1` was
  written to work on both PS 5.1 and pwsh 7 (CI). Do not reintroduce `-AdditionalChildPath`.
- **`import.mjs` deletes and rewrites `files/`.** It re-reads the *parent* folders. If those
  are deleted, the importer is no longer usable — `build.mjs` is the tool to use from then on.
- **Zips are git-ignored.** After editing the manifest locally you must rerun
  `powershell -ExecutionPolicy Bypass -File scripts/build-zips.ps1`, otherwise the download
  buttons 404 locally (CI builds them automatically).
- **GitHub Pages free plan requires a public repo.** The user explicitly wanted to check
  whether publishing these copyrighted lecture PDFs publicly is acceptable. Do not create
  or push a public repo until they confirm.
- **Published site ≈ 546MB** (193MB files + 353MB zips). Pages limit is 1GB and the soft
  bandwidth limit is 100GB/month.
- **`midterm-revision` tab depends on files owned by other subjects.** Deleting a subject
  folder breaks those revision entries — `build.mjs` will report them as missing.
- **Fonts come from Google Fonts.** Offline there is a system-font fallback; no layout break.
- **PPTX has no in-browser preview** (by design — 4 files in `information-theory`).
- **Tab auto-scroll into view** happens only when the subject changes (`state.renderedSubject`).
- **Manifest is fetched with `cache: "no-store"`.** Without it, a user can see a stale list
  after a redeploy (Python's `http.server` plus a restored file mtime reproduced this during
  testing). Keep it — the JSON is ~30KB.
- **`file://` support is load-bearing for the owner.** They open `index.html` by double-click,
  so: `app.js` must stay a **classic script** (ES modules are blocked by CORS on `file://`),
  `assets/data.js` must exist and be loaded before `app.js`, and `build.mjs` regenerates it on
  every run. `app.js` skips fetch when `location.protocol === "file:"` and uses
  `window.__SITE_DATA__`. Test both modes after any change.
- **Clicking a file row downloads it** (synthetic `<a download>`), not preview. Preview is the
  eye button. This was an explicit user request; keep the tip bar and the «اضغط للتحميل» hint.

---

## Remaining work, in priority order

1. **Legal/visibility decision.** If public is acceptable: create a public repo, `git init`
   inside `site/`, push to `main`, set `Settings → Pages → Source: GitHub Actions`.
   If not: move to Cloudflare Pages (private repo) and add protection; the site itself needs
   no changes.
2. **Fill YouTube links.** Add `youtube` to each lecture file and/or the subject.
   These are the only fields that make the play button appear (already implemented).
3. **First CI run.** Confirm `actions/upload-pages-artifact` accepts a ~546MB artifact and the
   deploy succeeds. Watch for the `du -sh _site` output in the build log.
4. **Optional:** PPTX → PDF conversion for the 4 slides (no LibreOffice installed locally;
   would need `soffice` or a converter).
5. **Optional:** `admin.html` — drag-and-drop upload with a fine-grained GitHub PAT kept in
   `sessionStorage`, committing via the Contents API. Estimated 3–4h. Not required for tier 1.
6. **Optional:** per-section zips if the user insists, accepting the size increase.
7. **Optional polish:** a per-subject description line in the hero (hero has spare space),
   highlight search matches, "continue reading" recent files.

---

## Quick command reference

```powershell
cd "D:\الكلية\سنة تالتة - الترم الأول\site"

# local preview
python -m http.server 8080

# integrity / sizes
node scripts/build.mjs --check     # fail on drift
node scripts/build.mjs --fix       # update size/ext from disk

# regenerate zips after any manifest edit
powershell -ExecutionPolicy Bypass -File scripts/build-zips.ps1

# add one file
node scripts/add-file.mjs --subject <id> --section <id> --file "<path>" --title "<title>" [--youtube URL] [--slug name]

# full re-import from the original parent folders (destructive to site/files)
node scripts/import.mjs
```
