# Feature 10 — Collapsible Midterm Revisions Kanban (Default: Today's Subject)

**Workspace Root:** `d:\الكلية\Website project\site`  
**Target Builder:** DeepSeek v4  
**Depends On:** None

---

## Goal
Make each subject column in the Midterm Revisions Kanban view (`#midterm-revision`) collapsible and expandable, with **today's exam subject** expanded by default (and all other columns collapsed by default).

---

## Implementation Plan

### 1. Default Expanded Subject Helper (`assets/app.js`)
- Reuse `SUBJECT_TO_MIDTERM_SEC` (`assets/app.js:665`):
  ```js
  function defaultMidtermKanbanSectionId() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const todayIso = `${yyyy}-${mm}-${dd}`;

    const todayExam = (state.schedule?.midterms || []).find((m) => m.date === todayIso);
    const targetSubjectId = todayExam?.subjectId || nextMidterm()?.subjectId;
    return SUBJECT_TO_MIDTERM_SEC[targetSubjectId] || null;
  }
  ```
- Store `kanbanExpanded: null` on `state` (`assets/app.js`, initialized lazily as a `Set` containing `[defaultMidtermKanbanSectionId()]` when non-null, or the first column's `id` as fallback).

### 2. Collapsible Column Markup (`assets/app.js:1841-1873`)
- In `renderMidtermKanban(subject)`:
  - Ensure `state.kanbanExpanded` is initialized:
    ```js
    if (!(state.kanbanExpanded instanceof Set)) {
      const defId = defaultMidtermKanbanSectionId() || columns[0]?.id;
      state.kanbanExpanded = new Set(defId ? [defId] : []);
    }
    ```
  - For each `section`:
    - `const isOpen = state.kanbanExpanded.has(section.id);`
    - Add `is-collapsed` class to `<section class="kanban-col${isOpen ? "" : " is-collapsed"}" ...>`.
    - In `.kanban-col-head`, wrap the dot, title, file count, and a chevron SVG in a `<button class="kanban-col-toggle" type="button" data-kanban-toggle="${esc(section.id)}" aria-expanded="${isOpen}" aria-controls="kanban-body-${esc(section.id)}">`.
    - Keep `<a class="kanban-col-link" href="#${esc(targetId)}">المادة ↗</a>` outside the toggle button so clicking the link navigates to the subject without toggling collapse.
    - Add `id="kanban-body-${esc(section.id)}"` and `${isOpen ? "" : " hidden"}` to `.kanban-col-body`.

### 3. Toggle Interaction (`assets/app.js`)
- Add delegated click listener on `viewEl`:
  ```js
  viewEl.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-kanban-toggle]");
    if (!toggle) return;
    const secId = toggle.dataset.kanbanToggle;
    if (!(state.kanbanExpanded instanceof Set)) state.kanbanExpanded = new Set();
    const isOpen = !state.kanbanExpanded.has(secId);
    if (isOpen) state.kanbanExpanded.add(secId);
    else state.kanbanExpanded.delete(secId);
    const col = toggle.closest(".kanban-col");
    const body = col?.querySelector(".kanban-col-body");
    col?.classList.toggle("is-collapsed", !isOpen);
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (body) body.hidden = !isOpen;
  });
  ```

### 4. Styling (`assets/styles.css:5222-5293`)
- Style `.kanban-col-toggle` as a clean, borderless flex button (`display: flex; align-items: center; gap: 7px; flex: 1; min-width: 0; background: transparent; border: 0; padding: 0; color: inherit; cursor: pointer; text-align: inherit;`).
- Style `.kanban-col-chevron` with `transition: transform 0.18s ease;` and rotate `180deg` when `aria-expanded="true"`.
- Add `.kanban-col.is-collapsed .kanban-col-head { border-bottom: 0; }` and `.kanban-col-body[hidden] { display: none; }`.

---

## Rebuild & Verify
```powershell
node scripts/build.mjs --fix
node scripts/build.mjs --check
```
- Open `#midterm-revision` → confirm only today's exam subject column (or next upcoming exam if none today) is expanded by default, and all other columns are collapsed.
- Click any column header to expand/collapse it independently; confirm `المادة ↗` link still navigates normally.
