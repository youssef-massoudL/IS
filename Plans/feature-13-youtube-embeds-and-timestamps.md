# Feature 13 — Subject Info Card YouTube Links, Lightweight Embeds & Timestamps

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Depends On:** None (ready for YouTube links to be populated later)

---

## Goal
Place the subject's YouTube video/playlist links directly inside the **Subject Info Card** (`.course-info#sec-course-info` rendered by `renderCourseInfo(subject)` in `assets/app.js:1552-1563`, which displays `الدكتور`, `معيد سكشنك`, `درجة الميدترم`, and `نطاق الميدترم`), with:
1. Direct **YouTube** link(s) (`مشاهدة الشرح`) as the primary lightweight action.
2. Optional **click-to-load inline/modal embed** (`youtube-nocookie.com/embed/...`) that loads **only** when clicked (0 KB overhead on page load).
3. Optional **timestamped topic chips** (`?t=5m20s`) when provided.

---

## Implementation Plan

### 1. Data Schema (`data/schedule.json` → `coursesMeta` or `data/subjects.json`)
- Support YouTube links on `meta = state.schedule?.coursesMeta?.[subject.id]` (or fallback to `subject.youtube` in `data/subjects.json`):
  - Single link: `"youtube": "https://www.youtube.com/playlist?list=..."` (or video URL).
  - Or multiple videos/chapters under `"youtubeLinks"`:
    ```json
    "youtubeLinks": [
      {
        "title": "شرح المحاضرة 1 – 3",
        "url": "https://www.youtube.com/watch?v=VIDEO_ID",
        "chapters": [
          { "label": "مقدمة", "t": "0m00s" },
          { "label": "حل مثال 1", "t": "5m20s" }
        ]
      }
    ]
    ```
- Ensure `scripts/build.mjs` preserves these fields during `--fix` and `--check`.

### 2. URL & Embed Helpers (`assets/app.js`)
- Add `parseYouTubeUrl(url)`:
  - Extracts `videoId` from `youtube.com/watch?v=...`, `youtu.be/...`, or `youtube.com/shorts/...` (returns `null` for playlists so playlists open directly on YouTube).
  - Parses optional `t` query param (`5m20s` or `320`) into integer `startSeconds`.
- Add `buildYouTubeTimestampUrl(baseUrl, t)` and `buildYouTubeEmbedUrl(videoId, startSeconds)` using `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`.

### 3. Subject Info Card UI (`assets/app.js:1552-1563`, `assets/styles.css`)
- In `renderCourseInfo(subject)`:
  - Collect links from `meta.youtubeLinks` (and/or `meta.youtube || subject.youtube`).
  - When at least one link exists, render a dedicated `.ci-item.ci-youtube` block inside `.course-info`:
    - Label: `شروحات يوتيوب`
    - For each link:
      - Direct `<a class="btn btn-sm yt-btn" href="..." target="_blank" rel="noopener">` (`مشاهدة على يوتيوب`).
      - If `parseYouTubeUrl(url)` returns a `videoId`, a compact **`تشغيل هنا`** button (`data-yt-embed="..."`) that opens a lightweight `#modal` 16:9 `youtube-nocookie.com/embed/...` iframe on click.
      - If `chapters` is present, a `.yt-chapters` row of timestamp chips (`▶ 5:20 · حل مثال 1`) linking to `buildYouTubeTimestampUrl(url, ch.t)`.
- *(Optional)* Keep or remove the duplicate `subject.youtube` button in `.subject-actions` (`assets/app.js:1792`) so `.course-info` is the single clean home for the subject's YouTube links.
- Style `.ci-youtube`, `.yt-chapters`, `.yt-chapter-chip`, and `.yt-embed-frame` (`aspect-ratio: 16 / 9; width: 100%; border: 0; border-radius: 12px;`) in `assets/styles.css`.

---

## Populating Links Later
- Once you provide the YouTube URLs, add them to `coursesMeta.<subjectId>` in `data/schedule.json` (or `subject.youtube` in `data/subjects.json`) and run `node scripts/build.mjs --fix`.

---

## Verification Checklist
1. Open any subject with YouTube links configured → confirm they appear inside the **معلومات المادة** (`.course-info`) card alongside `الدكتور` and `معيد سكشنك`.
2. Direct link opens YouTube in a new tab; timestamp chips jump to `?t=...`; **`تشغيل هنا`** lazy-loads the embed only on click.
3. Run:
   ```powershell
   node --check assets/app.js
   node scripts/build.mjs --check
   ```
