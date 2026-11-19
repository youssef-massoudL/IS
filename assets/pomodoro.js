(function () {
  "use strict";

  const STATE_KEY = "hub:pomoState";
  const LOG_KEY = "hub:focusLog";
  const MUTE_KEY = "hub:pomoMuted";
  const DEFAULT_DURATION = 25;
  const DURATIONS = [15, 25, 45, 50];

  const ICON = {
    play: '<svg viewBox="0 0 24 24" fill="none"><path d="M8 5.5v13l10-6.5-10-6.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="none"><path d="M9 5.5v13M15 5.5v13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    expand: '<svg viewBox="0 0 24 24" fill="none"><path d="M8 14l4-4 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 19h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none"><path d="m7 7 10 10M17 7 7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 10v4h3l4 3.5v-11L8 10H5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M16 9.2a4 4 0 0 1 0 5.6M18.5 6.8a7.3 7.3 0 0 1 0 10.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    muted: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 10v4h3l4 3.5v-11L8 10H5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m16 9 5 5M21 9l-5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  };

  let config = {
    subjects: [],
    getCurrentSubjectId: () => null,
    getStudyItems: () => [],
    onStudyChanged: () => {},
    topbarBtnEl: null,
  };
  let state = defaultState();
  let root = null;
  let panelOpen = false;
  let panelTab = "timer";
  let clearConfirm = false;
  let postSave = null;
  let ticker = null;
  let audioCtx = null;

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char];
    });
  }

  function todayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      return;
    }
  }

  function readText(key, fallback = null) {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeText(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      return;
    }
  }

  function defaultState() {
    return {
      status: "idle",
      mode: "focus",
      subjectId: null,
      durationMin: DEFAULT_DURATION,
      focusDurationMin: DEFAULT_DURATION,
      endAt: null,
      remainingMs: DEFAULT_DURATION * 60000,
      startedAt: null,
      completedPending: null,
    };
  }

  function subjectById(subjectId) {
    return (config.subjects || []).find((subject) => subject.id === subjectId) || null;
  }

  function normalizeState(raw) {
    const base = defaultState();
    const next = { ...base, ...(raw && typeof raw === "object" ? raw : {}) };
    const statuses = ["idle", "running", "paused", "completed"];
    next.status = statuses.includes(next.status) ? next.status : "idle";
    next.mode = next.mode === "break" ? "break" : "focus";
    const firstSubjectId = config.subjects?.[0]?.id || null;
    next.subjectId = subjectById(next.subjectId) ? next.subjectId : firstSubjectId;
    next.focusDurationMin = clamp(
      Number(next.focusDurationMin) || Number(next.durationMin) || DEFAULT_DURATION,
      5,
      120,
    );
    next.durationMin = clamp(
      Number(next.durationMin) || next.focusDurationMin || DEFAULT_DURATION,
      1,
      120,
    );
    next.remainingMs = Math.max(0, Number(next.remainingMs) || next.durationMin * 60000);
    next.endAt = Number(next.endAt) || null;
    next.startedAt = typeof next.startedAt === "string" ? next.startedAt : null;
    if (next.status === "running" && !next.endAt) {
      next.status = "paused";
    }
    if (next.status === "completed") {
      const pending = next.completedPending;
      if (!pending || typeof pending !== "object") {
        next.status = "idle";
        next.completedPending = null;
      } else {
        next.completedPending = {
          subjectId: subjectById(pending.subjectId) ? pending.subjectId : next.subjectId,
          minutes: Math.max(1, Math.round(Number(pending.minutes) || 1)),
          finishedAt:
            typeof pending.finishedAt === "string" ? pending.finishedAt : new Date().toISOString(),
          mode: pending.mode === "break" ? "break" : "focus",
        };
      }
    } else {
      next.completedPending = null;
    }
    return next;
  }

  function saveState() {
    writeJson(STATE_KEY, state);
  }

  function readLog() {
    const raw = readJson(LOG_KEY, {});
    const log =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? raw
        : { totalMinutes: 0, todayDate: todayKey(), todayMinutes: 0, sessionsCount: 0, bySubject: {} };
    log.totalMinutes = Math.max(0, Number(log.totalMinutes) || 0);
    log.sessionsCount = Math.max(0, Number(log.sessionsCount) || 0);
    log.bySubject =
      log.bySubject && typeof log.bySubject === "object" && !Array.isArray(log.bySubject)
        ? log.bySubject
        : {};
    const today = todayKey();
    if (log.todayDate !== today) {
      log.todayDate = today;
      log.todayMinutes = 0;
      writeJson(LOG_KEY, log);
    }
    log.todayMinutes = Math.max(0, Number(log.todayMinutes) || 0);
    return log;
  }

  function addFocusLog(minutes, subjectId) {
    const log = readLog();
    const amount = Math.max(0, Math.round(Number(minutes) || 0));
    log.totalMinutes += amount;
    log.todayMinutes += amount;
    log.sessionsCount += 1;
    if (subjectId) {
      log.bySubject[subjectId] = Math.max(0, Number(log.bySubject[subjectId]) || 0) + amount;
    }
    writeJson(LOG_KEY, log);
    return log;
  }

  function clearFocusLog() {
    const empty = {
      totalMinutes: 0,
      todayDate: todayKey(),
      todayMinutes: 0,
      sessionsCount: 0,
      bySubject: {},
    };
    writeJson(LOG_KEY, empty);
    try {
      window.dispatchEvent(
        new CustomEvent("hub:focus-updated", {
          detail: { minutes: 0, subjectId: null, summary: getSummary() },
        }),
      );
    } catch {
      return empty;
    }
    return empty;
  }

  function formatDurationAr(minutes) {
    const mins = Math.max(0, Math.round(Number(minutes) || 0));
    if (mins < 60) return `${mins} د`;
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem ? `${hours} س ${rem} د` : `${hours} س`;
  }

  function getSummary() {
    const log = readLog();
    return {
      todayMinutes: log.todayMinutes,
      totalMinutes: log.totalMinutes,
      sessionsCount: log.sessionsCount,
      bySubject: { ...log.bySubject },
      status: state.status,
    };
  }

  function remainingMs(now = Date.now()) {
    if (state.status === "running" && state.endAt) {
      return Math.max(0, state.endAt - now);
    }
    return Math.max(0, state.remainingMs);
  }

  function formatClock(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function selectedSubject() {
    return subjectById(state.subjectId) || config.subjects?.[0] || null;
  }

  function accentFor(subject) {
    if (state.mode === "break") return "#85c79a";
    return subject?.accent || "#4e8d9c";
  }

  function canFinishEarly() {
    if (state.mode === "break") return state.status === "running" || state.status === "paused";
    if (state.status !== "running" && state.status !== "paused") return false;
    const elapsed = Math.max(0, state.durationMin * 60000 - remainingMs());
    return elapsed >= 60000;
  }

  function statusLabel() {
    if (state.status === "paused") return "متوقف";
    if (state.status === "running") return "شغّال";
    if (state.status === "completed") return "مكتمل";
    return "جاهز";
  }

  function subjectOptions(selectedId) {
    return (config.subjects || [])
      .map(
        (subject) =>
          `<option value="${esc(subject.id)}"${subject.id === selectedId ? " selected" : ""}>${esc(subject.nameAr || subject.name || subject.id)}</option>`,
      )
      .join("");
  }

  function escapingSubject(subject) {
    return subject ? subject.nameAr || subject.name || subject.id : "";
  }

  function renderTopbar() {
    const btn = config.topbarBtnEl;
    if (!btn) return;
    let badge = btn.querySelector("#pomo-top-time") || btn.querySelector(".pomo-top-time");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "pomo-top-time";
      badge.id = "pomo-top-time";
      badge.dir = "ltr";
      btn.appendChild(badge);
    }
    const running = state.status === "running";
    const paused = state.status === "paused";
    const completed = state.status === "completed";
    btn.style.setProperty("--pomo-accent", accentFor(selectedSubject()));
    btn.classList.toggle("is-running", running);
    btn.classList.toggle("is-paused", paused);
    btn.classList.toggle("is-completed", completed);
    btn.setAttribute("aria-expanded", String(panelOpen));
    if (running || paused) {
      badge.hidden = false;
      badge.textContent = formatClock(remainingMs());
      btn.title = `مؤقت التركيز — ${badge.textContent}`;
    } else if (completed) {
      badge.hidden = false;
      badge.textContent = "✓";
      btn.title = "مؤقت التركيز — جلسة في انتظار الحفظ";
    } else {
      badge.hidden = true;
      badge.textContent = "";
      btn.title = "مؤقت التركيز (Pomodoro)";
    }
  }

  function renderPill() {
    if (state.status !== "running" && state.status !== "paused") return "";
    const subject = selectedSubject();
    const show = !panelOpen;
    const label = state.status === "paused" ? "متوقف" : state.mode === "break" ? "استراحة" : "تركيز";
    return `<div class="pomo-pill"${show ? "" : " hidden"} style="--pomo-accent:${esc(accentFor(subject))}">
      <span class="pomo-dot${state.status === "running" ? " is-live" : ""}" aria-hidden="true"></span>
      <span class="pomo-pill-clock" data-pomo-clock dir="ltr">${formatClock(remainingMs())}</span>
      <span class="pomo-pill-label">${esc(label)}</span>
      <button class="pomo-mini-btn" type="button" data-pomo-pill-toggle aria-label="${state.status === "running" ? "إيقاف مؤقت" : "استئناف"}">
        ${state.status === "running" ? ICON.pause : ICON.play}
      </button>
      <button class="pomo-mini-btn" type="button" data-pomo-expand aria-label="تكبير مؤقت التركيز">
        ${ICON.expand}
      </button>
    </div>`;
  }

  function renderModePill() {
    return state.mode === "break"
      ? `<span class="pomo-mode-pill is-break">استراحة قصيرة (${state.durationMin} د)</span>`
      : `<span class="pomo-mode-pill">جلسة تركيز</span>`;
  }

  function renderSessionView(subject) {
    const running = state.status === "running";
    const idle = state.status === "idle";
    const left = remainingMs();
    const durationMs = Math.max(1, state.durationMin * 60000);
    const progress = idle ? 0 : clamp(((durationMs - left) / durationMs) * 100, 0, 100);
    const summary = getSummary();
    const focusControls = idle
      ? `<div class="pomo-controls">
          <button class="btn btn-primary pomo-primary" type="button" data-pomo-start>ابدأ التركيز</button>
          <button class="btn btn-ghost" type="button" data-pomo-break>استراحة 5 د</button>
        </div>`
      : `<div class="pomo-controls">
          <button class="btn btn-primary pomo-primary" type="button" ${running ? "data-pomo-pause" : "data-pomo-resume"}>
            ${running ? "إيقاف مؤقت" : "استئناف"}
          </button>
          <button class="btn btn-ghost" type="button" data-pomo-finish${canFinishEarly() ? "" : " disabled"}>
            ${state.mode === "break" ? "إنهاء الاستراحة" : "خلصت بدري"}
          </button>
          <button class="btn btn-ghost pomo-reset" type="button" data-pomo-reset>إعادة ضبط</button>
        </div>`;
    const setup = idle
      ? `<label class="pomo-field">
          <span>المادة</span>
          <select data-pomo-subject>${subjectOptions(state.subjectId)}</select>
        </label>
        <div class="pomo-presets" aria-label="مدة الجلسة">
          ${DURATIONS.map(
            (minutes) =>
              `<button class="pomo-preset${state.focusDurationMin === minutes ? " is-active" : ""}" type="button" data-pomo-duration="${minutes}">${minutes} د</button>`,
          ).join("")}
          <label class="pomo-custom">
            <span>مخصص</span>
            <input type="number" min="5" max="120" inputmode="numeric" value="${state.focusDurationMin}" data-pomo-custom aria-label="مدة مخصصة بالدقائق">
          </label>
        </div>`
      : state.mode === "focus"
        ? `<div class="pomo-locked-subject">
            <span class="pomo-subj-dot" aria-hidden="true"></span>
            <strong>${esc(escapingSubject(subject))}</strong>
            <span class="pomo-lock-tag">مُثبّتة أثناء الجلسة</span>
          </div>`
        : "";
    const trackerHint = summary.totalMinutes
      ? `سجل وقتك حسب المادة · الإجمالي ${formatDurationAr(summary.totalMinutes)}`
      : "عرض سجل وقتك حسب المادة";
    return `<div class="pomo-session">
      <div class="pomo-mode-row">
        ${renderModePill()}
        <span class="pomo-status is-${esc(state.status)}">${esc(statusLabel())}</span>
      </div>
      <div class="pomo-clock-wrap">
        <strong class="pomo-clock" data-pomo-clock dir="ltr">${formatClock(left)}</strong>
        <span class="pomo-subject-line">${esc(state.mode === "break" ? "وقت راحة قصير" : escapingSubject(subject))}</span>
        <span class="pomo-progress" aria-hidden="true"><span style="width:${progress}%"></span></span>
      </div>
      ${setup}
      ${focusControls}
      <button class="pomo-stats-btn" type="button" data-pomo-tab="tracker">
        <span>${esc(trackerHint)}</span>
        <span aria-hidden="true">←</span>
      </button>
    </div>`;
  }

  function renderTrackerView() {
    const summary = getSummary();
    const subjects = config.subjects || [];
    const rows = subjects
      .map((subj, idx) => ({
        subject: subj,
        minutes: Math.max(0, Number(summary.bySubject[subj.id]) || 0),
        idx,
      }))
      .sort((a, b) => b.minutes - a.minutes || a.idx - b.idx);
    const maxMins = Math.max(1, ...rows.map((r) => r.minutes));
    const idle = state.status === "idle";

    const listHtml = rows
      .map(({ subject, minutes }) => {
        const share = summary.totalMinutes ? Math.round((minutes / summary.totalMinutes) * 100) : 0;
        const barWidth = minutes ? Math.max(6, Math.round((minutes / maxMins) * 100)) : 0;
        const accent = subject.accent || "#4e8d9c";
        return `<div class="pomo-track-row${minutes ? " has-time" : ""}" style="--track-accent:${esc(accent)}">
          <div class="pomo-track-top">
            <span class="pomo-track-name">
              <span class="pomo-track-dot" aria-hidden="true"></span>
              <strong>${esc(subject.nameAr || subject.name || subject.id)}</strong>
            </span>
            <span class="pomo-track-end">
              <span class="pomo-track-val">${esc(formatDurationAr(minutes))}</span>
              ${summary.totalMinutes && minutes ? `<span class="pomo-track-pct">${share}%</span>` : ""}
              ${
                idle
                  ? `<button class="pomo-track-go" type="button" data-pomo-pick-start="${esc(subject.id)}" title="تحديد المادة وفتح المؤقت">ابدأ</button>`
                  : ""
              }
            </span>
          </div>
          <span class="pomo-track-bar" aria-hidden="true"><span style="width:${barWidth}%"></span></span>
        </div>`;
      })
      .join("");

    const clearBtn = summary.totalMinutes
      ? `<button class="pomo-clear-btn${clearConfirm ? " is-confirm" : ""}" type="button" data-pomo-clear-log>
          ${clearConfirm ? "اضغط مرة أخرى لتأكيد تصفير السجل" : "تصفير سجل الوقت"}
        </button>`
      : "";

    return `<div class="pomo-tracker">
      <div class="pomo-kpi-grid">
        <div class="pomo-kpi"><span>اليوم</span><strong>${esc(formatDurationAr(summary.todayMinutes))}</strong></div>
        <div class="pomo-kpi"><span>الإجمالي</span><strong>${esc(formatDurationAr(summary.totalMinutes))}</strong></div>
        <div class="pomo-kpi"><span>الجلسات</span><strong>${summary.sessionsCount}</strong></div>
      </div>
      <div class="pomo-track-head">
        <span>توزيع الوقت حسب المادة</span>
      </div>
      <div class="pomo-track-list">${listHtml}</div>
      ${clearBtn}
    </div>`;
  }

  function studyChecklist(subjectId) {
    let items = [];
    try {
      items = config.getStudyItems(subjectId) || [];
    } catch {
      items = [];
    }
    if (!items.length) {
      return `<p class="pomo-empty">مفيش محاضرات متاحة للمادة دي.</p>`;
    }
    const pendingItems = items.filter((item) => !item.studied);
    const studiedItems = items.filter((item) => item.studied);
    const row = (item) =>
      `<label class="pomo-lec-item${item.studied ? " is-studied" : ""}">
        <input type="checkbox" data-pomo-study value="${esc(item.key)}"${item.studied ? " checked" : ""}>
        <span>${esc(item.label)}</span>
      </label>`;
    if (!pendingItems.length) {
      return `<div class="pomo-all-done">🎉 ما شاء الله! خلّصت كل محاضرات المادة دي!</div>
        <details class="pomo-studied-wrap">
          <summary>عرض المحاضرات المتذاكرة (${studiedItems.length})</summary>
          <div class="pomo-lec-list">${studiedItems.map(row).join("")}</div>
        </details>`;
    }
    return `<div class="pomo-check-title">علّم اللي خلصته في الجلسة</div>
      <div class="pomo-lec-list">${pendingItems.map(row).join("")}</div>
      ${
        studiedItems.length
          ? `<details class="pomo-studied-wrap">
              <summary>عرض المحاضرات المتذاكرة (${studiedItems.length})</summary>
              <div class="pomo-lec-list">${studiedItems.map(row).join("")}</div>
            </details>`
          : ""
      }`;
  }

  function renderCompletionView() {
    const pending = state.completedPending || {};
    if (pending.mode === "break") {
      return `<div class="pomo-complete pomo-break-done">
        <div class="pomo-complete-head">
          <span class="pomo-complete-mark">☕</span>
          <div>
            <span class="pomo-kicker">استراحة مكتملة</span>
            <h3>خلصت الاستراحة، جاهز ترجع؟</h3>
            <p>خد نفسك وارجع لجلسة تركيز جديدة لما تكون جاهز.</p>
          </div>
        </div>
        <div class="pomo-controls">
          <button class="btn btn-primary pomo-primary" type="button" data-pomo-start-focus>ابدأ جلسة تركيز</button>
          <button class="btn btn-ghost" type="button" data-pomo-close>إغلاق</button>
        </div>
      </div>`;
    }
    const assignId = subjectById(pending.subjectId) ? pending.subjectId : state.subjectId;
    const assignedSubject = subjectById(assignId);
    return `<div class="pomo-complete">
      <div class="pomo-complete-head">
        <span class="pomo-complete-mark">🎉</span>
        <div>
          <span class="pomo-kicker">جلسة مكتملة</span>
          <h3>عاش! خلّصت ${pending.minutes} دقيقة تركيز</h3>
          <p>سجّل اللي خلصته، والباقي يتحفظ في تقدمك على طول.</p>
        </div>
      </div>
      <label class="pomo-field">
        <span>نسب الجلسة لـ</span>
        <select data-pomo-assign-subject>${subjectOptions(assignId)}</select>
      </label>
      <div class="pomo-assign-hint">${esc(escapingSubject(assignedSubject))}</div>
      ${studyChecklist(assignId)}
      <div class="pomo-controls pomo-complete-actions">
        <button class="btn btn-primary pomo-primary" type="button" data-pomo-save>تأكيد وحفظ</button>
        <button class="btn btn-ghost" type="button" data-pomo-review>مراجعة فقط (بدون تعليم محاضرات)</button>
      </div>
    </div>`;
  }

  function renderSavedView() {
    const saved = postSave;
    return `<div class="pomo-complete pomo-saved">
      <div class="pomo-complete-head">
        <span class="pomo-complete-mark">✓</span>
        <div>
          <span class="pomo-kicker">تم الحفظ</span>
          <h3>${saved ? `+${saved.minutes} دقيقة تركيز` : "الجلسة محفوظة"}</h3>
          <p>${saved ? `${esc(saved.subjectName)} · اتحدثت في سجل التركيز.` : "سجل التركيز اتحدث."}</p>
        </div>
      </div>
      <div class="pomo-controls">
        <button class="btn btn-primary pomo-primary" type="button" data-pomo-break>استراحة 5 د</button>
        <button class="btn btn-ghost" type="button" data-pomo-close>إغلاق</button>
      </div>
    </div>`;
  }

  function renderPanelBody(subject) {
    if (state.status === "completed") return renderCompletionView();
    if (postSave && state.status === "idle") return renderSavedView();
    if (panelTab === "tracker") return renderTrackerView();
    return renderSessionView(subject);
  }

  function renderPanel(subject) {
    const muted = readText(MUTE_KEY, "0") === "1";
    const summary = getSummary();
    const showTabs = state.status !== "completed" && !(postSave && state.status === "idle");
    const tabsHtml = showTabs
      ? `<div class="pomo-tabs" role="tablist" aria-label="أقسام مؤقت التركيز">
          <button class="pomo-tab${panelTab === "timer" ? " is-active" : ""}" type="button" role="tab" aria-selected="${panelTab === "timer"}" data-pomo-tab="timer">المؤقت</button>
          <button class="pomo-tab${panelTab === "tracker" ? " is-active" : ""}" type="button" role="tab" aria-selected="${panelTab === "tracker"}" data-pomo-tab="tracker">
            <span>سجل وقتي</span>
            ${summary.totalMinutes ? `<span class="pomo-tab-badge">${esc(formatDurationAr(summary.totalMinutes))}</span>` : ""}
          </button>
        </div>`
      : "";
    return `<section class="pomo-panel" role="dialog" aria-label="مؤقت التركيز"${panelOpen ? "" : " hidden"} style="--pomo-accent:${esc(accentFor(subject))}">
      <header class="pomo-head">
        <div class="pomo-head-title">
          <h2>مؤقت التركيز</h2>
          <span class="pomo-head-badge" dir="ltr">Pomodoro</span>
        </div>
        <div class="pomo-head-actions">
          <button class="pomo-icon-btn" type="button" data-pomo-mute aria-pressed="${muted}" aria-label="${muted ? "تشغيل الصوت" : "كتم الصوت"}">
            ${muted ? ICON.muted : ICON.sound}
          </button>
          <button class="pomo-icon-btn" type="button" data-pomo-close aria-label="تصغير مؤقت التركيز">
            ${ICON.close}
          </button>
        </div>
      </header>
      ${tabsHtml}
      ${renderPanelBody(subject)}
    </section>`;
  }

  function renderAll() {
    if (!root) return;
    const subject = selectedSubject();
    root.style.setProperty("--pomo-accent", accentFor(subject));
    root.innerHTML = `${renderPill()}${renderPanel(subject)}`;
    renderTopbar();
  }

  function notifyChanged() {
    try {
      window.dispatchEvent(new CustomEvent("hub:pomodoro-changed"));
    } catch {
      return;
    }
  }

  function updateLive() {
    if (!root) return;
    const left = remainingMs();
    const text = formatClock(left);
    root.querySelectorAll("[data-pomo-clock]").forEach((node) => {
      node.textContent = text;
    });
    const durationMs = Math.max(1, state.durationMin * 60000);
    const progress = state.status === "idle" ? 0 : clamp(((durationMs - left) / durationMs) * 100, 0, 100);
    root.querySelectorAll(".pomo-progress > span").forEach((node) => {
      node.style.width = `${progress}%`;
    });
    const finishBtn = root.querySelector("[data-pomo-finish]");
    if (finishBtn) finishBtn.disabled = !canFinishEarly();
    renderTopbar();
  }

  function startTicker() {
    if (ticker) return;
    ticker = window.setInterval(tick, 500);
  }

  function stopTicker() {
    if (!ticker) return;
    window.clearInterval(ticker);
    ticker = null;
  }

  function tick() {
    if (state.status !== "running") {
      updateLive();
      return;
    }
    if (remainingMs() <= 0) {
      finishSession({ openPanel: true });
      return;
    }
    updateLive();
  }

  function finishSession({ openPanel = true, silent = false } = {}) {
    if (state.status === "completed") return;
    const durationMs = Math.max(0, state.durationMin * 60000);
    const elapsed = Math.max(0, durationMs - remainingMs());
    const minutes =
      state.mode === "break"
        ? Math.max(1, Math.round(elapsed / 60000) || state.durationMin)
        : Math.max(1, Math.round(elapsed / 60000) || state.durationMin);
    state.status = "completed";
    state.endAt = null;
    state.remainingMs = 0;
    state.completedPending = {
      subjectId: state.subjectId,
      minutes,
      finishedAt: new Date().toISOString(),
      mode: state.mode,
    };
    postSave = null;
    saveState();
    stopTicker();
    if (openPanel) panelOpen = true;
    if (!silent) playChime();
    renderAll();
    notifyChanged();
  }

  function startSession({ mode = "focus", durationMin = DEFAULT_DURATION, subjectId = null } = {}) {
    const subject = subjectById(subjectId) || subjectById(state.subjectId) || config.subjects?.[0];
    state.subjectId = subject?.id || null;
    state.mode = mode === "break" ? "break" : "focus";
    if (state.mode === "focus") {
      state.focusDurationMin = clamp(Number(durationMin) || state.focusDurationMin || DEFAULT_DURATION, 5, 120);
      state.durationMin = state.focusDurationMin;
    } else {
      state.durationMin = 5;
    }
    const durationMs = state.durationMin * 60000;
    state.status = "running";
    state.remainingMs = durationMs;
    state.endAt = Date.now() + durationMs;
    state.startedAt = new Date().toISOString();
    state.completedPending = null;
    postSave = null;
    panelOpen = true;
    saveState();
    ensureAudio();
    startTicker();
    renderAll();
    notifyChanged();
  }

  function pauseSession() {
    if (state.status !== "running") return;
    state.remainingMs = remainingMs();
    state.endAt = null;
    state.status = "paused";
    saveState();
    stopTicker();
    renderAll();
    notifyChanged();
  }

  function resumeSession() {
    if (state.status !== "paused") return;
    if (remainingMs() <= 0) {
      finishSession({ openPanel: true });
      return;
    }
    state.endAt = Date.now() + remainingMs();
    state.status = "running";
    saveState();
    startTicker();
    renderAll();
    notifyChanged();
  }

  function resetSession() {
    if (state.status !== "running" && state.status !== "paused") return;
    state.status = "idle";
    state.mode = "focus";
    state.durationMin = state.focusDurationMin;
    state.remainingMs = state.focusDurationMin * 60000;
    state.endAt = null;
    state.startedAt = null;
    state.completedPending = null;
    postSave = null;
    saveState();
    stopTicker();
    renderAll();
    notifyChanged();
  }

  function setMuted(muted) {
    if (muted) writeText(MUTE_KEY, "1");
    else {
      try {
        localStorage.removeItem(MUTE_KEY);
      } catch {
        return;
      }
    }
  }

  function applyStudyChanges(subjectId) {
    const studied = readJson("hub:studied", {});
    const map = studied && typeof studied === "object" && !Array.isArray(studied) ? studied : {};
    root.querySelectorAll("[data-pomo-study]").forEach((input) => {
      if (input.checked) map[input.value] = true;
      else delete map[input.value];
    });
    writeJson("hub:studied", map);
    try {
      config.onStudyChanged(subjectId);
    } catch {
      return;
    }
  }

  function finishToIdle(subjectId) {
    state.status = "idle";
    state.mode = "focus";
    state.durationMin = state.focusDurationMin;
    state.remainingMs = state.focusDurationMin * 60000;
    state.endAt = null;
    state.startedAt = null;
    state.completedPending = null;
    saveState();
    stopTicker();
    if (subjectId) state.subjectId = subjectId;
    saveState();
  }

  function saveCompletion({ close = false } = {}) {
    if (state.status !== "completed" || !state.completedPending) return;
    const pending = state.completedPending;
    if (pending.mode === "break") {
      finishToIdle(state.subjectId);
      if (close) panelOpen = false;
      postSave = null;
      renderAll();
      notifyChanged();
      return;
    }
    const select = root.querySelector("[data-pomo-assign-subject]");
    const subjectId = subjectById(select?.value) ? select.value : pending.subjectId;
    const minutes = Math.max(1, Math.round(Number(pending.minutes) || 1));
    if (!close) applyStudyChanges(subjectId);
    addFocusLog(minutes, subjectId);
    finishToIdle(subjectId);
    if (close) {
      panelOpen = false;
      postSave = null;
    } else {
      panelOpen = true;
      postSave = {
        minutes,
        subjectId,
        subjectName: escapingSubject(subjectById(subjectId)),
      };
    }
    saveState();
    try {
      window.dispatchEvent(
        new CustomEvent("hub:focus-updated", {
          detail: { minutes, subjectId, summary: getSummary() },
        }),
      );
    } catch {
      return;
    }
    renderAll();
    notifyChanged();
  }

  function closePanel() {
    panelOpen = false;
    clearConfirm = false;
    if (state.status === "idle") postSave = null;
    renderAll();
  }

  function openPanel(options = {}) {
    const requested = subjectById(options.subjectId);
    const current = subjectById(config.getCurrentSubjectId?.());
    if (state.status === "idle") {
      if (requested) state.subjectId = requested.id;
      else if (current) state.subjectId = current.id;
      if (state.mode !== "focus") {
        state.mode = "focus";
        state.durationMin = state.focusDurationMin;
        state.remainingMs = state.focusDurationMin * 60000;
      }
      saveState();
    }
    if (options.tab === "tracker" && state.status !== "completed") {
      panelTab = "tracker";
      postSave = null;
    } else if (options.tab === "timer") {
      panelTab = "timer";
    }
    clearConfirm = false;
    panelOpen = true;
    renderAll();
  }

  function togglePanel() {
    if (panelOpen) closePanel();
    else openPanel();
  }

  function handleAction(target) {
    if (target.closest("[data-pomo-close]")) {
      if (state.status === "completed" && state.completedPending?.mode === "break") {
        saveCompletion({ close: true });
        return;
      }
      closePanel();
      return;
    }
    if (target.closest("[data-pomo-expand]")) {
      openPanel();
      return;
    }
    if (target.closest("[data-pomo-pill-toggle]")) {
      if (state.status === "running") pauseSession();
      else if (state.status === "paused") resumeSession();
      return;
    }
    if (target.closest("[data-pomo-start]")) {
      startSession({ mode: "focus", durationMin: state.focusDurationMin });
      return;
    }
    if (target.closest("[data-pomo-break]")) {
      startSession({ mode: "break" });
      return;
    }
    if (target.closest("[data-pomo-start-focus]")) {
      startSession({ mode: "focus", durationMin: state.focusDurationMin });
      return;
    }
    if (target.closest("[data-pomo-pause]")) {
      pauseSession();
      return;
    }
    if (target.closest("[data-pomo-resume]")) {
      resumeSession();
      return;
    }
    if (target.closest("[data-pomo-reset]")) {
      resetSession();
      return;
    }
    if (target.closest("[data-pomo-finish]")) {
      if (canFinishEarly()) finishSession({ openPanel: true });
      return;
    }
    if (target.closest("[data-pomo-save]")) {
      saveCompletion();
      return;
    }
    if (target.closest("[data-pomo-review]")) {
      saveCompletion({ close: true });
      return;
    }
    const tabBtn = target.closest("[data-pomo-tab]");
    if (tabBtn) {
      panelTab = tabBtn.dataset.pomoTab === "tracker" ? "tracker" : "timer";
      clearConfirm = false;
      renderAll();
      return;
    }
    const pickStart = target.closest("[data-pomo-pick-start]");
    if (pickStart && state.status === "idle") {
      const subj = subjectById(pickStart.dataset.pomoPickStart);
      if (subj) {
        state.subjectId = subj.id;
        saveState();
      }
      panelTab = "timer";
      clearConfirm = false;
      renderAll();
      return;
    }
    if (target.closest("[data-pomo-clear-log]")) {
      if (!clearConfirm) {
        clearConfirm = true;
        renderAll();
        return;
      }
      clearConfirm = false;
      clearFocusLog();
      renderAll();
      return;
    }
    if (target.closest("[data-pomo-mute]")) {
      setMuted(readText(MUTE_KEY, "0") !== "1");
      renderAll();
      return;
    }
    const preset = target.closest("[data-pomo-duration]");
    if (preset) {
      const minutes = clamp(Number(preset.dataset.pomoDuration) || DEFAULT_DURATION, 5, 120);
      state.focusDurationMin = minutes;
      state.durationMin = minutes;
      state.remainingMs = minutes * 60000;
      saveState();
      renderAll();
    }
  }

  function handleChange(target) {
    if (target.matches("[data-pomo-subject]")) {
      if (state.status !== "idle") return;
      const subject = subjectById(target.value);
      if (!subject) return;
      state.subjectId = subject.id;
      saveState();
      renderAll();
      return;
    }
    if (target.matches("[data-pomo-assign-subject]")) {
      const subject = subjectById(target.value);
      if (!subject || !state.completedPending) return;
      state.completedPending.subjectId = subject.id;
      saveState();
      renderAll();
      return;
    }
    if (target.matches("[data-pomo-custom]")) {
      const minutes = clamp(Number(target.value) || DEFAULT_DURATION, 5, 120);
      state.focusDurationMin = minutes;
      state.durationMin = minutes;
      state.remainingMs = minutes * 60000;
      saveState();
      renderAll();
    }
  }

  function getAudio() {
    if (audioCtx) return audioCtx;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    try {
      audioCtx = new Audio();
    } catch {
      audioCtx = null;
    }
    return audioCtx;
  }

  function ensureAudio() {
    try {
      const ctx = getAudio();
      if (ctx?.state === "suspended") ctx.resume().catch(() => {});
    } catch {
      return;
    }
  }

  function playChime() {
    if (readText(MUTE_KEY, "0") === "1") return;
    try {
      const ctx = getAudio();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const start = ctx.currentTime + 0.02;
      [
        { frequency: 523.25, at: start, duration: 0.18 },
        { frequency: 659.25, at: start + 0.18, duration: 0.28 },
      ].forEach(({ frequency, at, duration }) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, at);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.12, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(at);
        oscillator.stop(at + duration + 0.02);
      });
    } catch {
      return;
    }
  }

  function init(options = {}) {
    config = { ...config, ...options };
    config.topbarBtnEl = config.topbarBtnEl || document.querySelector("#pomo-toggle");
    if (!root) {
      root = document.createElement("div");
      root.id = "pomo-root";
      root.dir = "rtl";
      document.body.appendChild(root);
      root.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof Element) handleAction(target);
      });
      root.addEventListener("change", (event) => {
        const target = event.target;
        if (target instanceof Element) handleChange(target);
      });
    }
    if (config.topbarBtnEl && config.topbarBtnEl.dataset.pomoBound !== "1") {
      config.topbarBtnEl.dataset.pomoBound = "1";
      config.topbarBtnEl.addEventListener("click", togglePanel);
    }
    state = normalizeState(readJson(STATE_KEY, {}));
    if (state.status === "running") {
      const left = remainingMs();
      if (left <= 0) {
        finishSession({ openPanel: true, silent: true });
      } else {
        panelOpen = false;
        startTicker();
        saveState();
        renderAll();
      }
    } else if (state.status === "completed") {
      panelOpen = true;
      renderAll();
    } else {
      panelOpen = false;
      renderAll();
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) return;
      if (state.status === "running") {
        if (remainingMs() <= 0) finishSession({ openPanel: true });
        else updateLive();
      } else {
        updateLive();
      }
    });
  }

  window.HubPomodoro = {
    init,
    open: openPanel,
    close: closePanel,
    toggle: togglePanel,
    isPanelOpen: () => panelOpen,
    getSummary,
  };
})();
