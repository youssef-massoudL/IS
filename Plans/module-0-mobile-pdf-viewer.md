# Module 0 — Mobile In-Site PDF Viewer (Android & iOS)

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Priority:** Patch 1 (Critical — Full Focus)

---

## Goal
When a user taps any PDF on **Android** or **iOS** (including Safari, Chrome, Samsung Internet, and Telegram/WhatsApp in-app browsers), **do not auto-download or jump out of the site**. Instead, open the existing `#modal` popup inside the site, render the PDF pages inline with smooth scrolling and zoom, and let the user choose **Download** (`#modal-download`) only if they want to save it.

---

## Why It Currently Fails on Mobile (`assets/app.js:2630-2670`)
1. `shouldOpenPdfInNewTab()` (`assets/app.js:2630-2632`) returns `true` whenever `isMobileView() || navigator.pdfViewerEnabled === false`.
2. `openPreview()` (`assets/app.js:2636-2646`) calls `window.open(file.path, "_blank")` on mobile, which causes Android Chrome and WebViews to immediately download the `.pdf` instead of displaying it.
3. Even inside `#modal`, `assets/app.js:2658-2667` falls back to a static link card instead of rendering the PDF.

---

## Implementation Plan

### 1. Bundle or Load PDF.js (`index.html` or `assets/pdfjs/`)
- Use **PDF.js v4.x** (ESM build `pdf.min.mjs` + `pdf.worker.min.mjs`).
- **Recommended:** Load lazily only when a mobile/fallback PDF is opened (so initial page load stays 0 KB heavier), either from `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.x/` or vendored into `assets/pdfjs/` (and copied in `.github/workflows/deploy.yml`, which already copies all of `assets/`).

### 2. Remove the Mobile Auto-Open/Download Bypass (`assets/app.js:2630-2646`)
- Remove the `window.open(file.path, "_blank")` early return in `openPreview(file, options)`.
- Clicking any PDF on **Android, iOS, or Desktop** must always open `#modal` (`index.html:106-124`) with `#modal-download` (`download` attribute) and `#modal-open` (`target="_blank"`) available in `.modal-actions`.

### 3. In-Site PDF.js Canvas Renderer (`assets/app.js`)
- Add a `usePdfJsViewer()` check: `isMobileView() || navigator.pdfViewerEnabled === false` (keep fast native `<iframe>` on Desktop browsers that support inline PDFs, and use PDF.js on Android/iOS/WebViews).
- When `ext === "pdf"` and `usePdfJsViewer()` is `true`, render a dedicated viewer inside `#modal-body`:
  1. **Toolbar (`.pdf-toolbar`):**
     - Page indicator: `صفحة <current> / <total>` (updated on scroll).
     - Zoom controls: `−` (`zoom-out`), `%` / `ملاءمة العرض` (`fit-width`), `+` (`zoom-in`).
     - Loading progress bar/text (`جارٍ تحميل الملف…`).
  2. **Scrollable Pages Container (`.pdf-pages`):**
     - Load the document via `pdfjsLib.getDocument(file.path).promise` (with an `AbortController` / cancellation flag so closing `#modal` mid-load aborts cleanly and prevents memory leaks).
     - Create placeholder `<div class="pdf-page-slot" data-page="N">` containers sized to each page's aspect ratio so scrollbar height is accurate immediately.
     - Use `IntersectionObserver` (`root: pagesContainer`, `rootMargin: "600px 0px"`) to **lazily render** only visible pages + nearby pages onto `<canvas>` at `Math.min(window.devicePixelRatio || 1, 2)` scale — preventing mobile RAM crashes on 80+ page PDFs.
     - On **Zoom change**, re-render currently visible pages at the new scale and clear stale canvases.
     - On **Close (`closePreview()`):** call `pdfDoc.destroy()` and disconnect the `IntersectionObserver` to free memory immediately.
  3. **Error Fallback:**
     - If `pdfjsLib.getDocument` fails (e.g., network drop or corrupted PDF), show the clean `.pdf-fallback` card with `فتح في تبويب جديد` and `تحميل الملف`.

### 4. Mobile-First Modal & Viewer Styles (`assets/styles.css`)
- On `@media (max-width: 860px)`:
  - Make `#modal .modal-card` full-screen (`width: 100vw; height: 100dvh; max-height: 100dvh; border-radius: 0;`) so students get maximum reading area on phones.
  - Ensure `.modal-head` stays compact and `flex-shrink: 0` with `#modal-download` clearly visible.
  - Style `.pdf-toolbar` as a sticky bar inside `#modal-body` and `.pdf-pages` with `-webkit-overflow-scrolling: touch`, `overscroll-behavior: contain`, centered `<canvas>` pages with subtle shadow/gap, and `touch-action: pan-x pan-y pinch-zoom`.

---

## Verification Checklist
1. **Desktop:** Click any PDF → opens `#modal` with `<iframe>`, Download button works.
2. **Android Chrome & iOS Safari (or DevTools Mobile Emulation):**
   - Tap a PDF → **does NOT auto-download**; opens full-screen `#modal` popup inside the site.
   - All pages scroll smoothly, page counter updates, `+`/`-` zoom works, and tapping **تحميل** downloads the PDF.
   - Closing `#modal` destroys the PDF.js instance cleanly (re-opening another PDF works without lag).
3. Run:
   ```powershell
   node --check assets/app.js
   node scripts/build.mjs --check
   ```
