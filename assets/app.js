const ICONS = {
  lan: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="5" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="15" width="18" height="5" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M8 9v6M16 9v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  database: '<svg viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="5.5" rx="7.5" ry="3" stroke="currentColor" stroke-width="1.6"/><path d="M4.5 5.5v13c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-13" stroke="currentColor" stroke-width="1.6"/><path d="M4.5 12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3" stroke="currentColor" stroke-width="1.6"/></svg>',
  insights: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 19V9m5 10V5m5 14v-7m5 7V8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  science: '<svg viewBox="0 0 24 24" fill="none"><path d="M9 3h6M10 3v5.5L5.4 17A2.4 2.4 0 0 0 7.5 21h9a2.4 2.4 0 0 0 2.1-4L14 8.5V3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M7.5 15h9" stroke="currentColor" stroke-width="1.6"/></svg>',
  schema: '<svg viewBox="0 0 24 24" fill="none"><rect x="8.5" y="2.5" width="7" height="5" rx="1.4" stroke="currentColor" stroke-width="1.6"/><rect x="2.5" y="16.5" width="7" height="5" rx="1.4" stroke="currentColor" stroke-width="1.6"/><rect x="14.5" y="16.5" width="7" height="5" rx="1.4" stroke="currentColor" stroke-width="1.6"/><path d="M12 7.5v4M6 16.5v-2.5h12v2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none"><path d="M13 2 5 13.5h5.5L10 22l8-11.5h-5.5L13 2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 5.2A2.2 2.2 0 0 1 6.2 3H19a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6.2A2.2 2.2 0 0 1 4 16.8V5.2Z" stroke="currentColor" stroke-width="1.6"/><path d="M4 16.8A2.2 2.2 0 0 1 6.2 15H20" stroke="currentColor" stroke-width="1.6"/></svg>',
  lecture: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8 20h8M12 16v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M7.5 9h9M7.5 12h5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  slides: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4.5" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M12 15.5V20M9 20h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="m9.5 11 2-2.5 1.6 1.6 1.9-2.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  question: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.6 2.3c-.7.4-1.2 1-1.2 1.9v.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>',
  summary: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 2.5h8.5L19 7v14.5H6z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 2.5V7h5M9 12h7M9 15.5h7M9 8.5h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  revision: '<svg viewBox="0 0 24 24" fill="none"><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3 8.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M3 4v4.5h4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 8v4.4l3 1.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  simple: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3.5 14.3 9l5.7.4-4.3 3.7 1.3 5.4-5-3.1-5 3.1 1.3-5.4L4 9.4 9.7 9 12 3.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none"><path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4l2 2.5h8a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 19.5H5a1.5 1.5 0 0 1-1.5-1.5v-10Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4v10m0 0 3.5-3.5M12 14l-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 18.5h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  folderDown: '<svg viewBox="0 0 24 24" fill="none"><path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4l2 2.5h8A1.5 1.5 0 0 1 20.5 10v1" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 12.5v5m0 0 2.5-2.5M12 17.5 9.5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.5 18.5V21h-17v-2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none"><path d="M9.5 7.6v8.8l7-4.4-7-4.4Z" fill="currentColor"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" fill="none"><rect x="2.5" y="5.5" width="19" height="13" rx="4" stroke="currentColor" stroke-width="1.7"/><path d="M10.2 9.2v5.6l5-2.8-5-2.8Z" fill="currentColor"/></svg>',
  external: '<svg viewBox="0 0 24 24" fill="none"><path d="M14 4h6v6M20 4l-8.5 8.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 2.5h8L19 7.5v14H6z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 2.5v5h5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.7"/><path d="m16 16 4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15.5" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6"/><path d="M12 7.5V12l3 1.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 21s6.2-5.4 6.2-10.2a6.2 6.2 0 1 0-12.4 0C5.8 15.6 12 21 12 21Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="10.6" r="2.2" stroke="currentColor" stroke-width="1.6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none"><path d="m5 12.5 4.4 4.4L19 7.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 10.5v5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="7.5" r="1" fill="currentColor"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="3.5" width="7" height="7" rx="1.4" stroke="currentColor" stroke-width="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.4" stroke="currentColor" stroke-width="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.4" stroke="currentColor" stroke-width="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.4" stroke="currentColor" stroke-width="1.6"/></svg>',
};

const SECTION_ICONS = {
  lectures: "lecture",
  "original-pptx": "slides",
  books: "book",
  questions: "question",
  summaries: "summary",
  "midterm-revision": "revision",
  committees: "pin",
  "simplified-explanations": "simple",
  general: "folder",
};

const state = {
  data: null,
  subjectId: null,
  query: "",
  lastSubject: null,
  section: "1",
  viewMode: "matrix",
  feature: null,
  practiceSubject: null,
  scheduleAll: false,
  schedule: null,
  questions: null,
  facets: { subject: "all", lecture: "all", kind: "all" },
  searchIndex: null,
  questionIndex: null,
  renderedSubject: null,
  filtersOpen: false,
  searchOpen: false,
  sidebarOpen: false,
  tabsExpanded: false,
  notifOpen: false,
  kanbanExpanded: null,
};

const $ = (selector, root = document) => root.querySelector(selector);
const tabsEl = $("#tabs");
const viewEl = $("#view");
const searchEl = $("#search");
const modalEl = $("#modal");
const uploadEl = $("#upload");
const smartStripEl = $("#smart-strip");
const notifWrapEl = $("#notif-wrap");
const notifToggleEl = $("#notif-toggle");
const notifBadgeEl = $("#notif-badge");
const notifPanelEl = $("#notif-panel");
const sectionPickerEl = $("#section-picker");
const facetsEl = $("#search-facets");
const sidebarEl = $("#sidebar");
const sidebarToggleEl = $("#sidebar-toggle");
const sidebarBackdropEl = $("#sidebar-backdrop");
const filterToggleEl = $("#filter-toggle");
const searchPanelEl = $("#search-panel");
const searchToggleEl = $("#search-toggle");
const tabsPrevEl = $("#tabs-prev");
const tabsNextEl = $("#tabs-next");
const modeSwitcherEl = $("#mode-switcher");
const tabsBarEl = $("#tabs-bar");
const midtermPinEl = $("#midterm-pin");
const examNewsEl = $("#exam-news");
const examNewsLinkEl = $("#exam-news-link");
const examNewsCloseEl = $("#exam-news-close");

const SECTION_VALUES = Array.from({ length: 11 }, (_, index) => String(index + 1));
const AR_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const WEEK_DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];

const store = {
  get(key, fallback = null) {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch (error) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      return;
    }
  },
  getJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  },
  setJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      return;
    }
  },
};

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

const AR_NORMALIZE_MAP = {
  "أ": "ا",
  "إ": "ا",
  "آ": "ا",
  "ٱ": "ا",
  "ة": "ه",
  "ى": "ي",
  "ؤ": "و",
  "ئ": "ي",
};

const KIND_LABELS = {
  lecture: "المحاضرة",
  summary: "الملخص",
  questions: "الأسئلة",
  solution: "الحل",
  review: "مراجعة ميدترم",
  book: "كتاب شامل",
};

const KIND_SYNONYMS = {
  "ملخص": ["summary"],
  "ملخصات": ["summary"],
  summary: ["summary"],
  summaries: ["summary"],
  "اسئله": ["questions", "review"],
  "اسئلة": ["questions", "review"],
  "امتحان": ["questions", "review"],
  "امتحانات": ["questions", "review"],
  questions: ["questions", "review"],
  exam: ["questions", "review"],
  exams: ["questions", "review"],
  "حل": ["solution"],
  "حلول": ["solution"],
  "اجابه": ["solution"],
  "اجابات": ["solution"],
  solution: ["solution"],
  solutions: ["solution"],
  "مراجعه": ["review"],
  "مراجعات": ["review"],
  review: ["review"],
  revision: ["review"],
  "محاضره": ["lecture"],
  "محاضرات": ["lecture"],
  lecture: ["lecture"],
  lectures: ["lecture"],
  "كتاب": ["book"],
  book: ["book"],
  books: ["book"],
};

const SUBJECT_SYNONYMS = {
  "system-analysis": ["تحليل النظم", "تحليل نظم", "system analysis", "systems analysis"],
  "database-2": [
    "قواعد بيانات 2",
    "قواعد البيانات",
    "قواعد بيانات",
    "database 2",
    "database",
    "db2",
    "db",
  ],
  "information-theory": ["نظرية المعلومات", "نظريه المعلومات", "information theory"],
  "research-methods": ["اساليب البحث", "مناهج البحث", "طرق البحث", "research methods"],
  "computer-networks": ["شبكات الحاسب", "شبكات", "computer networks", "networks", "network"],
  "midterm-revision": ["مراجعة الميد", "مراجعه الميد", "midterm revision"],
};

const MAX_QUESTIONS_PER_SUBJECT = 12;

function normalizeDigits(value) {
  return String(value || "").replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

function normalizeChar(char) {
  if (/[\u064B-\u065F\u0670]/.test(char)) return "";
  if (/\s/.test(char)) return " ";
  const lower = char.toLowerCase();
  const mapped = AR_NORMALIZE_MAP[lower] || lower;
  if (/[٠-٩۰-۹]/.test(mapped)) return normalizeDigits(mapped);
  return /[\p{L}\p{N}]/u.test(mapped) ? mapped : " ";
}

function normalizeWithMap(value) {
  const source = String(value || "");
  let text = "";
  const map = [];
  for (let index = 0; index < source.length; index += 1) {
    const normalized = normalizeChar(source[index]);
    for (const piece of normalized) {
      if (piece === " " && (!text || text.endsWith(" "))) continue;
      text += piece;
      map.push(index);
    }
  }
  while (text.endsWith(" ")) {
    text = text.slice(0, -1);
    map.pop();
  }
  return { text, map };
}

function normalizeAr(value) {
  return normalizeWithMap(value).text;
}

function highlightText(value, tokens) {
  const source = String(value || "");
  const { text, map } = normalizeWithMap(source);
  if (!text || !tokens || !tokens.length) return esc(source);
  const ranges = [];
  for (const token of tokens) {
    if (!token) continue;
    let from = 0;
    while (from <= text.length - token.length) {
      const at = text.indexOf(token, from);
      if (at === -1) break;
      ranges.push([map[at], map[at + token.length - 1] + 1]);
      from = at + token.length;
    }
  }
  if (!ranges.length) return esc(source);
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([range[0], range[1]]);
  }
  let html = "";
  let cursor = 0;
  for (const [start, end] of merged) {
    html += esc(source.slice(cursor, start));
    html += `<mark>${esc(source.slice(start, end))}</mark>`;
    cursor = end;
  }
  return html + esc(source.slice(cursor));
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fileLectures(file) {
  const lectures = [];
  if (Number.isInteger(file.lecture)) lectures.push(file.lecture);
  if (Array.isArray(file.lectureSpan)) {
    for (const lecture of file.lectureSpan) {
      if (Number.isInteger(lecture)) lectures.push(lecture);
    }
  }
  return [...new Set(lectures)];
}

function isReviewFile(file) {
  return file.kind === "review" || file.kind === "book" || file.lecture === null;
}

function matchesKind(file, kind) {
  if (kind === "all") return true;
  if (kind === "review") return isReviewFile(file);
  return file.kind === kind;
}

function midtermScope(subjectId) {
  return new Set(state.schedule?.coursesMeta?.[subjectId]?.midtermLectures || []);
}

function facetsActive() {
  return (
    state.facets.subject !== "all" ||
    state.facets.lecture !== "all" ||
    state.facets.kind !== "all"
  );
}

function searchActive() {
  return Boolean(state.query.trim()) || facetsActive();
}

function resetFacets() {
  state.facets = { subject: "all", lecture: "all", kind: "all" };
}

function updateSearchPanel() {
  if (!searchPanelEl) return;
  const open = Boolean(state.searchOpen || searchActive() || state.filtersOpen);
  searchPanelEl.hidden = !open;
  searchToggleEl?.setAttribute("aria-expanded", String(open));
  searchToggleEl?.classList.toggle("is-active", open);
}

function resetSearchUI() {
  state.query = "";
  state.filtersOpen = false;
  state.searchOpen = false;
  searchEl.value = "";
  resetFacets();
  searchEl.blur();
  render();
}

function openSearch() {
  state.searchOpen = true;
  updateSearchPanel();
  searchEl.focus();
}

function closeSearch() {
  if (searchActive() || state.filtersOpen) {
    resetSearchUI();
    return;
  }
  state.searchOpen = false;
  updateSearchPanel();
}

function parseQuery(raw) {
  const normalized = normalizeAr(raw);
  const parsed = {
    raw: String(raw || ""),
    normalized,
    tokens: [],
    lectures: new Set(),
    kinds: new Set(),
    subjects: new Set(),
    midterm: false,
  };
  if (!normalized) return parsed;

  let working = ` ${normalized} `;
  working = working.replace(
    /(?:^|\s)(?:محاضر(?:ه|ات)?|lec(?:ture)?s?)\s*(\d{1,2})(?=\s|$)/g,
    (match, lecture) => {
      parsed.lectures.add(Number(lecture));
      return " ";
    },
  );

  const subjects = Object.entries(SUBJECT_SYNONYMS).sort(
    (a, b) =>
      Math.max(...b[1].map((item) => normalizeAr(item).length)) -
      Math.max(...a[1].map((item) => normalizeAr(item).length)),
  );
  for (const [subjectId, synonyms] of subjects) {
    for (const synonym of synonyms) {
      const phrase = normalizeAr(synonym);
      if (!phrase) continue;
      const pattern = new RegExp(`(^|\\s)${escapeRegExp(phrase)}(?=\\s|$)`, "g");
      if (pattern.test(working)) {
        parsed.subjects.add(subjectId);
        working = working.replace(pattern, " ");
      }
    }
  }

  const tokens = [];
  for (const token of working.split(/\s+/).filter(Boolean)) {
    if (token === "ميدترم" || token === "midterm") {
      parsed.midterm = true;
      continue;
    }
    const key = token.startsWith("ال") && token.length > 2 ? token.slice(2) : token;
    const kinds = KIND_SYNONYMS[key];
    if (kinds) {
      for (const kind of kinds) parsed.kinds.add(kind);
      continue;
    }
    tokens.push(token);
  }
  parsed.tokens = [
    ...new Set(tokens.filter((token) => token.length >= 2 || /^\d+$/.test(token))),
  ];
  return parsed;
}

function buildSearchIndex() {
  state.searchIndex = state.data.subjects.flatMap((subject) =>
    subject.sections.flatMap((section) =>
      section.files.map((file) => ({
        subject,
        section,
        file,
        hay: normalizeAr(
          [
            file.title,
            file.original,
            file.id,
            file.path,
            subject.name,
            subject.nameAr,
            subject.id,
            file.kind,
            KIND_LABELS[file.kind] || "",
            ...(Array.isArray(file.keywords) ? file.keywords : []),
            ...fileLectures(file),
          ]
            .filter((value) => value !== null && value !== undefined)
            .join(" "),
        ),
      })),
    ),
  );
  state.questionIndex = buildQuestionIndex();
}

function buildQuestionIndex() {
  const entries = [];
  const banks = state.questions || {};
  for (const [subjectKey, bank] of Object.entries(banks)) {
    const questions = Array.isArray(bank)
      ? bank
      : Array.isArray(bank?.questions)
        ? bank.questions
        : [];
    for (const question of questions) {
      if (!question || typeof question !== "object") continue;
      const subjectId = question.subjectId || subjectKey;
      const subject = subjectById(subjectId) || subjectById(subjectKey) || null;
      const options = Array.isArray(question.options) ? question.options : [];
      entries.push({
        question,
        subjectId,
        subject,
        lecture: Number.isInteger(question.lecture) ? question.lecture : null,
        hay: normalizeAr(
          [
            question.qAr,
            question.q,
            question.id,
            question.explanation,
            question.difficulty,
            question.type,
            ...options,
          ]
            .filter((value) => typeof value === "string")
            .join(" "),
        ),
      });
    }
  }
  return entries;
}

function fileMatchesFacetsAndQuery(entry, parsed) {
  const { file, subject, hay } = entry;
  if (state.facets.subject !== "all" && subject.id !== state.facets.subject) return false;
  if (parsed.subjects.size && !parsed.subjects.has(subject.id)) return false;

  const lectures = fileLectures(file);

  if (parsed.lectures.size) {
    const wanted = [...parsed.lectures];
    if (!wanted.some((lecture) => lectures.includes(lecture))) return false;
  }

  if (state.facets.lecture === "reviews") {
    if (!isReviewFile(file)) return false;
  } else if (state.facets.lecture !== "all") {
    if (!lectures.includes(Number(state.facets.lecture))) return false;
  }

  if (state.facets.kind !== "all" && !matchesKind(file, state.facets.kind)) return false;
  if (parsed.kinds.size && ![...parsed.kinds].some((kind) => matchesKind(file, kind))) {
    return false;
  }

  if (parsed.midterm) {
    const scope = midtermScope(subject.id);
    if (!isReviewFile(file) && !lectures.some((lecture) => scope.has(lecture))) return false;
  }

  return parsed.tokens.every((token) => hay.includes(token));
}

function questionMatchesFacetsAndQuery(entry, parsed) {
  if (state.facets.subject !== "all" && entry.subjectId !== state.facets.subject) return false;
  if (parsed.subjects.size && !parsed.subjects.has(entry.subjectId)) return false;

  if (parsed.lectures.size) {
    if (entry.lecture === null || !parsed.lectures.has(entry.lecture)) return false;
  }

  if (state.facets.lecture === "reviews") return false;
  if (
    state.facets.lecture !== "all" &&
    entry.lecture !== Number(state.facets.lecture)
  ) {
    return false;
  }

  if (state.facets.kind !== "all" && state.facets.kind !== "questions") return false;
  if (parsed.kinds.size && !parsed.kinds.has("questions")) return false;

  if (parsed.midterm) {
    const scope = midtermScope(entry.subjectId);
    if (entry.lecture === null || !scope.has(entry.lecture)) return false;
  }

  return parsed.tokens.every((token) => entry.hay.includes(token));
}

function searchFileCard(entry, tokens) {
  const { file, subject, section } = entry;
  const lectures = fileLectures(file);
  const lectureLabel = file.lecture === null
    ? isReviewFile(file)
      ? "مراجعة شاملة"
      : "ملف عام"
    : lectures.length > 1
      ? `محاضرات ${lectures[0]}–${lectures[lectures.length - 1]}`
      : `محاضرة ${file.lecture}`;
  const kindLabel = KIND_LABELS[file.kind] || file.kind || "ملف";
  const meta = `${subject.nameAr} · ${lectureLabel} · ${kindLabel}`;
  const originalMatches =
    Boolean(file.original) &&
    tokens.some((token) => normalizeAr(file.original).includes(token)) &&
    !tokens.some((token) => normalizeAr(file.title).includes(token));
  return fileRow(file, subject, section?.id || "", "file-search", {
    tokens,
    meta,
    showOriginal: originalMatches,
  });
}

function searchQuestionCard(entry, tokens) {
  const { question, subjectId, subject, lecture } = entry;
  const accent = subject?.accent || "#64748b";
  const subjectName = subject?.nameAr || subjectId;
  const primary = question.qAr || question.q || "";
  const secondary = question.qAr && question.q ? question.q : "";
  const badges = [];
  if (lecture !== null) badges.push(`<span class="q-chip">محاضرة ${lecture}</span>`);
  if (question.difficulty) {
    badges.push(`<span class="q-chip">${esc(question.difficulty)}</span>`);
  }
  return `<article class="question-hit" style="--accent:${esc(accent)}">
    <div class="qh-head">
      <span class="qh-subject"><span class="dot" style="background:${esc(accent)}"></span>${esc(subjectName)}</span>
      ${badges.join("")}
      ${question.id ? `<span class="qh-id" dir="ltr">${esc(question.id)}</span>` : ""}
    </div>
    ${primary ? `<p class="qh-text">${highlightText(primary, tokens)}</p>` : ""}
    ${secondary ? `<p class="qh-text qh-secondary" dir="ltr">${highlightText(secondary, tokens)}</p>` : ""}
    <div class="qh-actions">
      <a class="btn btn-sm btn-primary" href="#practice/${esc(subjectId)}">${ICONS.question}<span>افتح في الاختبار</span></a>
    </div>
  </article>`;
}

function renderFacets() {
  if (!facetsEl || !state.data) return;
  const open = state.filtersOpen || searchActive();
  facetsEl.hidden = !open;
  if (filterToggleEl) {
    filterToggleEl.setAttribute("aria-expanded", String(open));
    filterToggleEl.classList.toggle("is-active", open);
  }
  if (!open) {
    facetsEl.innerHTML = "";
    return;
  }

  const subjectRow = [
    { value: "all", label: "الكل" },
    ...state.data.subjects
      .filter((subject) => subject.id !== "midterm-revision")
      .map((subject) => ({
        value: subject.id,
        label: subject.nameAr,
        accent: subject.accent,
      })),
  ];
  const lectureRow = [
    { value: "all", label: "كل المحاضرات" },
    ...Array.from({ length: 7 }, (_, index) => ({
      value: String(index + 1),
      label: `محاضرة ${index + 1}`,
    })),
    { value: "reviews", label: "مراجعات شاملة" },
  ];
  const kindRow = [
    { value: "all", label: "الكل" },
    { value: "lecture", label: "المحاضرة" },
    { value: "summary", label: "الملخص" },
    { value: "questions", label: "الأسئلة" },
    { value: "solution", label: "الحل" },
    { value: "review", label: "مراجعة ميدترم" },
  ];

  const row = (facet, label, items) => `<div class="facet-row">
    <span class="facet-label">${esc(label)}</span>
    <div class="facet-chips">${items
      .map(
        (item) => `<button class="facet-chip${state.facets[facet] === item.value ? " is-active" : ""}" type="button" data-facet="${facet}" data-value="${esc(item.value)}" aria-pressed="${state.facets[facet] === item.value}"${item.accent ? ` style="--chip-accent:${esc(item.accent)}"` : ""}>${item.accent ? '<span class="facet-dot"></span>' : ""}${esc(item.label)}</button>`,
      )
      .join("")}</div>
  </div>`;

  const actions = `<div class="facet-actions">
    ${searchActive() ? '<button class="facet-reset" type="button" data-facet="reset">مسح البحث والفلاتر</button>' : ""}
    <button class="facet-close" type="button" data-facet="close">إخفاء الفلاتر</button>
  </div>`;

  facetsEl.innerHTML = `${row("subject", "المادة", subjectRow)}${row("lecture", "المحاضرة", lectureRow)}${row("kind", "النوع", kindRow)}${actions}`;
}

const fmtSize = (bytes) => {  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const subjectFiles = (subject) => subject.sections.flatMap((section) => section.files);
const sectionIconKey = (section) => SECTION_ICONS[section.id] || "folder";
const subjectById = (id) => state.data?.subjects?.find((subject) => subject.id === id) || null;

const MIDTERM_TO_SUBJECT_ID = {
  "computer-networks": "computer-networks",
  database: "database-2",
  "information-theory": "information-theory",
  research: "research-methods",
  "system-analysis": "system-analysis",
};

const SUBJECT_TO_MIDTERM_SEC = {
  "computer-networks": "computer-networks",
  "database-2": "database",
  "information-theory": "information-theory",
  "research-methods": "research",
  "system-analysis": "system-analysis",
};

function themeInit() {
  const forced = new URLSearchParams(location.search).get("theme");
  if (forced === "light" || forced === "dark") {
    document.documentElement.dataset.theme = forced;
    applyThemeMeta();
    return;
  }
  const saved = store.get("theme");
  const dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  applyThemeMeta();
}

function applyThemeMeta() {
  const dark = document.documentElement.dataset.theme === "dark";
  $('meta[name="theme-color"]').setAttribute("content", dark ? "#13111c" : "#f5f3ec");
}

$("#theme-toggle").addEventListener("click", () => {
  const root = document.documentElement;
  root.classList.add("theme-switching");
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  store.set("theme", next);
  applyThemeMeta();
  void root.offsetHeight;
  requestAnimationFrame(() => root.classList.remove("theme-switching"));
});

function initSection() {
  const queryValue = Number(new URLSearchParams(location.search).get("sec"));
  const querySection =
    Number.isInteger(queryValue) && queryValue >= 1 && queryValue <= 11 ? String(queryValue) : null;
  const savedValue = Number(store.get("hub:mySection"));
  const savedSection =
    Number.isInteger(savedValue) && savedValue >= 1 && savedValue <= 11 ? String(savedValue) : null;
  state.section = querySection || savedSection || "1";
  if (querySection) store.set("hub:mySection", querySection);
  else if (!savedSection) store.set("hub:mySection", state.section);
  state.viewMode = store.get("hub:viewMode") === "classic" ? "classic" : "matrix";
}

function renderSectionPicker() {
  if (!sectionPickerEl) return;
  sectionPickerEl.innerHTML = SECTION_VALUES.map(
    (value) => `<option value="${value}">سكشن ${value}</option>`,
  ).join("");
  sectionPickerEl.value = state.section;
}

function sectionInstructors(subjectId) {
  const entries = (state.schedule?.sectionsTimetable?.[String(state.section)] || []).filter(
    (entry) => entry.subjectId === subjectId,
  );
  return [...new Set(entries.map((entry) => entry.instructor).filter(Boolean))].join("، ");
}

function periodById(id) {
  return state.schedule?.periods?.find((period) => period.id === Number(id)) || null;
}

function parseDateParts(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  if (!year || !month || !day) return new Date(NaN);
  return new Date(year, month - 1, day);
}

function parseDateTime(dateStr, timeStr) {
  const date = parseDateParts(dateStr);
  const [hours, minutes] = String(timeStr || "00:00").split(":").map(Number);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function formatDate(value) {
  const date = value instanceof Date ? value : parseDateParts(value);
  if (Number.isNaN(date.getTime())) return String(value || "");
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch (error) {
    return date.toLocaleDateString("ar-EG");
  }
}

function formatDateShort(value) {
  const date = value instanceof Date ? value : parseDateParts(value);
  if (Number.isNaN(date.getTime())) return String(value || "");
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch (error) {
    return date.toLocaleDateString("ar-EG");
  }
}

function formatRange(start, end) {
  const from = formatDateShort(start);
  if (!end || end === start) return from;
  return `${from} — ${formatDateShort(end)}`;
}

function withLtrYears(value) {
  return esc(String(value || "")).replace(
    /(\d{4})\s*[-–]\s*(\d{4})/g,
    '<bdi dir="ltr">$1-$2</bdi>',
  );
}

function eventPeriodRange(entry) {
  const periods = Array.isArray(entry.periods) ? entry.periods : [];
  const start = periodById(periods[0]);
  const end = periodById(periods[periods.length - 1]);
  return {
    start,
    end,
    label: start && end ? `${start.start} – ${end.end}` : "غير محدد",
  };
}

function getDayEntries(day, section) {
  if (!state.schedule) return [];
  const sectionNumber = Number(section);
  const shared = (state.schedule.sharedLectures || [])
    .filter((entry) => (entry.sections || []).map(Number).includes(sectionNumber))
    .map((entry) => ({ ...entry, shared: true }));
  const own = (state.schedule.sectionsTimetable?.[String(section)] || []).map((entry) => ({
    ...entry,
    shared: false,
  }));
  return [...shared, ...own]
    .filter((entry) => entry.day === day)
    .sort((a, b) => (a.periods?.[0] || 0) - (b.periods?.[0] || 0));
}

function resolveToday() {
  const now = new Date();
  const todayName = AR_DAYS[now.getDay()];
  const todayEntries = getDayEntries(todayName, state.section);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const lastEntry = todayEntries[todayEntries.length - 1];
  const lastPeriodId = lastEntry?.periods?.length ? lastEntry.periods[lastEntry.periods.length - 1] : null;
  const lastPeriod = periodById(lastPeriodId);
  let lastEnd = 0;
  if (lastPeriod) {
    const [hours, minutes] = lastPeriod.end.split(":").map(Number);
    lastEnd = hours * 60 + minutes;
  }
  const done = todayEntries.length > 0 && nowMinutes > lastEnd;
  if (todayEntries.length && !done) {
    return { label: "اليوم", dayName: todayName, entries: todayEntries, date: now };
  }
  for (let offset = 1; offset <= 7; offset += 1) {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    const dayName = AR_DAYS[date.getDay()];
    const entries = getDayEntries(dayName, state.section);
    if (entries.length) {
      return { label: offset === 1 ? "غداً" : `يوم ${dayName}`, dayName, entries, date };
    }
  }
  return { label: "قريباً", dayName: "", entries: [], date: now };
}

function nextMidterm() {
  const now = new Date();
  return (
    (state.schedule?.midterms || [])
      .map((midterm) => ({
        ...midterm,
        endAt: parseDateTime(midterm.date, midterm.endTime || midterm.startTime),
      }))
      .filter((midterm) => midterm.endAt >= now)
      .sort((a, b) => a.endAt - b.endAt)[0] || null
  );
}

function defaultMidtermKanbanSectionId() {
  return SUBJECT_TO_MIDTERM_SEC[defaultSubjectId()] || null;
}

function defaultSubjectId() {
  const sorted = (state.schedule?.midterms || [])
    .map((midterm) => ({
      ...midterm,
      startAt: parseDateTime(midterm.date, midterm.startTime),
      endAt: parseDateTime(midterm.date, midterm.endTime || midterm.startTime),
    }))
    .filter((midterm) => !Number.isNaN(midterm.endAt.getTime()))
    .sort((a, b) => a.startAt - b.startAt);

  const fallback = subjectById("system-analysis")?.id || state.data?.subjects?.[0]?.id || null;
  if (!sorted.length) return fallback;

  const now = new Date();
  const windowStart = new Date(sorted[0].startAt);
  windowStart.setHours(0, 0, 0, 0);
  const windowEnd = new Date(sorted[sorted.length - 1].endAt);
  const insideMidterms = now >= windowStart && now <= windowEnd;
  if (!insideMidterms) return fallback;

  const current = sorted.find(
    (midterm) => midterm.endAt >= now && subjectById(midterm.subjectId),
  );
  return current?.subjectId || fallback;
}

function countdownLabel(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((target - today) / 86400000);
  if (days <= 0) return "اليوم";
  if (days === 1) return "غداً";
  return `بعد ${days} يوم`;
}

function midtermStatus(midterm) {
  const start = parseDateTime(midterm.date, midterm.startTime);
  const end = parseDateTime(midterm.date, midterm.endTime);
  const now = new Date();
  if (now >= start && now <= end) return { label: "جارٍ الآن", active: true };
  if (now > end) return { label: "انتهى", active: false };
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = parseDateParts(midterm.date);
  const days = Math.round((target - today) / 86400000);
  if (days <= 0) return { label: "اليوم", active: false };
  if (days === 1) return { label: "غداً", active: false };
  return { label: `بعد ${days} يوم`, active: false };
}

const RECENT_FILE_WINDOW_MS = 24 * 60 * 60 * 1000;
const NOTIF_FILE_WINDOW_MS = RECENT_FILE_WINDOW_MS;
const NOTIF_SEEN_KEY = "hub:notif:seen";
const NOTIF_BROWSER_KEY = "hub:notif:browser";
const EXAM_NEWS_SEEN_KEY = "hub:exam-news:seen";

function isRecentFile(file) {
  if (!file?.addedAt) return false;
  const addedMs = Date.parse(file.addedAt);
  if (Number.isNaN(addedMs)) return false;
  const diff = Date.now() - addedMs;
  return diff >= -60000 && diff <= RECENT_FILE_WINDOW_MS;
}

function formatRelativeTimeAr(isoString) {
  const ms = Date.parse(isoString);
  if (Number.isNaN(ms)) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (diffSec < 60) return "الآن";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "منذ ساعة" : `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "أمس";
  return `منذ ${days} أيام`;
}

function getSeenNotifIds() {
  return new Set(store.getJson(NOTIF_SEEN_KEY, []));
}

function markNotifSeen(id) {
  if (!id) return;
  const seen = getSeenNotifIds();
  if (!seen.has(id)) {
    seen.add(id);
    store.setJson(NOTIF_SEEN_KEY, Array.from(seen).slice(-120));
  }
}

function markAllNotifsSeen(items) {
  const seen = getSeenNotifIds();
  for (const item of items) seen.add(item.id);
  store.setJson(NOTIF_SEEN_KEY, Array.from(seen).slice(-120));
}

function buildNotifications() {
  const items = [];
  const networksSubject = subjectById("computer-networks");
  items.push({
    id: "announcement-networks-organized",
    kind: "announcement",
    priority: 0,
    title: "كل ماتريال النيتورك .. مترتبة",
    meta: "شبكات الحاسب · Computer Networks",
    href: "#computer-networks",
    ctaLabel: "فتح المادة",
    accent: networksSubject?.accent || "#4e8d9c",
  });
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (const midterm of state.schedule?.midterms || []) {
    const startAt = parseDateTime(midterm.date, midterm.startTime);
    const endAt = parseDateTime(midterm.date, midterm.endTime || midterm.startTime);
    if (Number.isNaN(startAt.getTime())) continue;
    const targetDay = new Date(startAt.getFullYear(), startAt.getMonth(), startAt.getDate());
    const days = Math.round((targetDay - today) / 86400000);
    const subject = subjectById(midterm.subjectId);
    const accent = subject?.accent || "#4e8d9c";
    const revisionHref = `#${midterm.subjectId}/midterm-revision`;

    if (days === 0 && endAt >= now) {
      const ongoing = now >= startAt && now <= endAt;
      items.push({
        id: `exam-today-${midterm.subjectId}-${midterm.date}`,
        kind: "exam-today",
        priority: 1,
        title: ongoing
          ? `امتحان ${midterm.subjectName} جارٍ الآن`
          : `اليوم امتحان ${midterm.subjectName}`,
        meta: `${midterm.startTime}–${midterm.endTime} · ${midterm.venue}`,
        href: revisionHref,
        ctaLabel: "مراجعة الميدترم ★",
        accent,
        midterm,
      });
    } else if (days === 1) {
      items.push({
        id: `exam-tomorrow-${midterm.subjectId}-${midterm.date}`,
        kind: "exam-soon",
        priority: 2,
        title: `غداً امتحان ${midterm.subjectName}`,
        meta: `${formatDateShort(midterm.date)} · ${midterm.startTime}–${midterm.endTime}`,
        href: revisionHref,
        ctaLabel: "مراجعة الميدترم",
        accent,
        midterm,
      });
    }
  }

  const fileCandidates = new Map();
  for (const subject of state.data?.subjects || []) {
    for (const section of subject.sections || []) {
      for (const file of section.files || []) {
        if (!file.addedAt) continue;
        const addedMs = Date.parse(file.addedAt);
        if (Number.isNaN(addedMs)) continue;
        const diff = Date.now() - addedMs;
        if (diff < -60000 || diff > NOTIF_FILE_WINDOW_MS) continue;

        const key = file.path || `${subject.id}/${section.id}/${file.id}`;
        const existing = fileCandidates.get(key);
        const candidate = {
          subject,
          section,
          file,
          addedMs,
          isPrimary: subject.id !== "midterm-revision",
        };
        if (!existing || (candidate.isPrimary && !existing.isPrimary)) {
          fileCandidates.set(key, candidate);
        }
      }
    }
  }

  const recentFiles = Array.from(fileCandidates.values())
    .sort((a, b) => b.addedMs - a.addedMs)
    .slice(0, 5);
  for (const entry of recentFiles) {
    const recent24h = isRecentFile(entry.file);
    items.push({
      id: `file-${entry.file.path}-${entry.file.addedAt}`,
      kind: "new-file",
      priority: recent24h ? 2 : 4,
      recent24h,
      title: entry.file.title,
      meta: `${entry.subject.nameAr} · ${entry.section.name} · ${formatRelativeTimeAr(entry.file.addedAt)}`,
      href: `#${entry.subject.id}/${entry.section.id}/${entry.file.id}`,
      ctaLabel: "فتح الملف",
      accent: entry.subject.accent || "#4e8d9c",
    });
  }

  return items.sort((a, b) => a.priority - b.priority);
}

function setNotifOpen(open) {
  state.notifOpen = Boolean(open);
  if (notifToggleEl) notifToggleEl.setAttribute("aria-expanded", state.notifOpen ? "true" : "false");
  if (notifPanelEl) notifPanelEl.hidden = !state.notifOpen;
  if (state.notifOpen) {
    const rect = notifToggleEl?.getBoundingClientRect();
    if (rect) notifPanelEl?.style.setProperty("--notif-top", `${Math.round(rect.bottom + 8)}px`);
    renderNotifications();
  }
}

function renderNotifications() {
  const items = buildNotifications();
  const seen = getSeenNotifIds();
  const unreadCount = items.filter((item) => !seen.has(item.id)).length;

  if (notifBadgeEl) {
    notifBadgeEl.hidden = unreadCount === 0;
    notifBadgeEl.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
  }

  if (!notifPanelEl) return;
  const canBrowserNotif = "Notification" in window && Notification.permission !== "granted";
  const browserBtn = canBrowserNotif
    ? `<button class="notif-action-link" type="button" data-notif-browser="1">تفعيل إشعارات المتصفح</button>`
    : "";

  const listHtml = items.length
    ? items
        .map((item) => {
          const unread = !seen.has(item.id);
          const badge =
            item.kind === "announcement"
              ? `<span class="notif-tag is-soon">تحديث</span>`
              : item.kind === "exam-today"
                ? `<span class="notif-tag is-exam">اليوم</span>`
                : item.kind === "exam-soon"
                  ? `<span class="notif-tag is-soon">امتحان قريب</span>`
                  : `<span class="notif-tag">ملف جديد</span>`;
          return `<a class="notif-item${unread ? " is-unread" : ""}" href="${esc(item.href)}" data-notif-id="${esc(item.id)}">
            <span class="notif-dot" style="background:${esc(item.accent)}"></span>
            <div class="notif-item-body">
              <div class="notif-item-top">
                <strong class="notif-item-title">${esc(item.title)}</strong>
                ${badge}
              </div>
              <span class="notif-item-meta">${esc(item.meta)}</span>
            </div>
            <span class="notif-item-cta">${esc(item.ctaLabel)}</span>
          </a>`;
        })
        .join("")
    : `<div class="notif-empty">لا توجد إشعارات جديدة حالياً.</div>`;

  notifPanelEl.innerHTML = `<div class="notif-panel-head">
      <strong>الإشعارات</strong>
      <div class="notif-panel-actions">
        ${browserBtn}
        ${items.length ? `<button class="notif-action-link" type="button" data-notif-read-all="1">تحديد الكل كمقروء</button>` : ""}
      </div>
    </div>
    <div class="notif-list">${listHtml}</div>`;
}

function maybeSendBrowserNotifications() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (store.get(NOTIF_BROWSER_KEY) !== "1") return;
  const items = buildNotifications();
  const browserSentKey = "hub:notif:browser-sent";
  const sent = new Set(store.getJson(browserSentKey, []));
  for (const item of items) {
    if (item.kind !== "exam-today") continue;
    if (sent.has(item.id)) continue;
    sent.add(item.id);
    try {
      const n = new Notification(item.title, { body: item.meta, icon: "assets/logo.png" });
      n.onclick = () => {
        window.focus();
        location.hash = item.href;
        n.close();
      };
    } catch {
      // Ignore browser notification errors
    }
  }
  store.setJson(browserSentKey, Array.from(sent).slice(-60));
}

function renderSmartStrip() {
  if (!smartStripEl) return;
  if (!state.schedule || state.feature !== "schedule" || searchActive() || state.filtersOpen) {
    smartStripEl.hidden = true;
    smartStripEl.innerHTML = "";
    return;
  }
  smartStripEl.hidden = false;
  const today = resolveToday();
  const midterm = nextMidterm();
  const events = today.entries.length
    ? today.entries
        .map((entry) => {
          const range = eventPeriodRange(entry);
          const subject = subjectById(entry.subjectId);
          return `<div class="today-event">
            <span class="today-dot" style="background:${esc(subject?.accent || "#4e8d9c")}"></span>
            <span class="today-time" dir="ltr">${esc(range.label)}</span>
            <div class="today-main">
              <span class="today-title">${esc(entry.title)}</span>
              <span class="today-meta">${esc(entry.room || "")}${entry.instructor ? ` · ${esc(entry.instructor)}` : ""}</span>
            </div>
            <span class="mini-badge${entry.type === "section" ? " section" : ""}">${entry.type === "section" ? "سكشن" : "محاضرة"}</span>
          </div>`;
        })
        .join("")
    : `<p class="smart-empty">لا توجد محاضرات أو سكاشن ${today.label === "اليوم" ? "اليوم" : today.label} لسكشن ${esc(state.section)}.</p>`;
  const hallsFile = midterm?.hallsFile || "";
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
  const midtermCard = midterm
    ? `<div class="smart-card midterm-card">
        <div class="smart-head">
          <div>
            <span class="smart-kicker">أقرب ميدترم</span>
            <strong class="midterm-subject">${esc(midterm.subjectName)}</strong>
          </div>
          <span class="countdown-pill">${esc(countdownLabel(midterm.endAt))}</span>
        </div>
        <div class="midterm-facts">
          <span>${ICONS.calendar} ${esc(formatDateShort(midterm.date))}</span>
          <span>${ICONS.clock} <span dir="ltr">${esc(midterm.startTime)}–${esc(midterm.endTime)}</span></span>
          <span>${ICONS.pin} ${esc(midterm.venue)}</span>
          <span>${ICONS.lecture} ${(midterm.lecturesInScope || []).length} محاضرات</span>
          <span>${esc(String(midterm.marks))} درجة</span>
        </div>
        ${hallsGuide}
        <div class="smart-actions">
          <a class="smart-action" href="#${esc(midterm.subjectId)}/midterm-revision">${ICONS.revision}<span>مراجعة الميدترم</span></a>
          <a class="smart-action" href="#practice/${esc(midterm.subjectId)}">${ICONS.question}<span>اختبر نفسك</span></a>
        </div>
      </div>`
    : `<div class="smart-card midterm-card">
        <div class="smart-head"><span class="smart-kicker">أقرب ميدترم</span></div>
        <p class="smart-empty">لا يوجد ميدترم قادم في الجدول.</p>
      </div>`;
  smartStripEl.innerHTML = `<div class="smart-card today-card">
      <div class="smart-head">
        <div>
          <span class="smart-kicker">جدولك ${today.label === "اليوم" ? "اليوم" : "القادم"}</span>
          <strong class="smart-day">${esc(today.dayName || today.label)} · سكشن ${esc(state.section)}</strong>
        </div>
        <span class="smart-date">${esc(formatDateShort(today.date))}</span>
      </div>
      ${events}
    </div>
    ${midtermCard}`;
}

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

function renderTabs() {
  const searching = searchActive();
  const featureActive = Boolean(state.feature) && !searching;
  const midtermSubject = state.data.subjects.find((subject) => subject.id === "midterm-revision");
  const regularSubjects = state.data.subjects.filter(
    (subject) => subject.id !== "midterm-revision",
  );
  const collapsed =
    !searching &&
    !featureActive &&
    Boolean(state.subjectId && state.subjectId !== "midterm-revision") &&
    !state.tabsExpanded;

  const isInitialMount = !tabsEl.dataset.mounted;
  if (isInitialMount) {
    const subjectTabs = regularSubjects
      .map(
        (subject, index) => `<button class="tab" type="button" role="tab" aria-selected="false"
          data-subject="${subject.id}" style="--tab-accent:${subject.accent};--tab-index:${index}">
          <span class="dot"></span>
          <span>${esc(subject.nameAr)}</span>
        </button>`,
      )
      .join("");
    const collector = `<button class="tab tab-collector" type="button" data-collector="1"
      aria-expanded="false" aria-label="اعرض كل المواد" title="اعرض كل المواد">
      <span class="dot"></span>
      <span class="collector-icon">${ICONS.grid}</span>
      <span>كل المواد</span>
      <span class="count">${regularSubjects.length}</span>
    </button>`;
    tabsEl.classList.add("is-no-anim");
    tabsEl.innerHTML = subjectTabs + collector;
    tabsEl.dataset.mounted = "1";

    if (midtermPinEl && midtermSubject) {
      midtermPinEl.innerHTML = `<button class="tab tab-pinned" type="button" role="tab"
        aria-selected="false" data-subject="midterm-revision"
        style="--tab-accent:${midtermSubject.accent}">
        <span class="dot"></span>
        <span class="pinned-icon">${ICONS.revision}</span>
        <span>${esc(midtermSubject.nameAr)}</span>
      </button>`;
    }
  }

  tabsEl.querySelectorAll(".tab[data-subject]").forEach((btn) => {
    const active = !featureActive && !searching && btn.dataset.subject === state.subjectId;
    const hidden = collapsed && !active;
    btn.setAttribute("aria-selected", active ? "true" : "false");
    if (hidden) {
      btn.setAttribute("tabindex", "-1");
      btn.setAttribute("aria-hidden", "true");
    } else {
      btn.removeAttribute("tabindex");
      btn.removeAttribute("aria-hidden");
    }
  });

  const collectorBtn = tabsEl.querySelector(".tab-collector");
  if (collectorBtn) {
    collectorBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
    if (collapsed) {
      collectorBtn.removeAttribute("tabindex");
      collectorBtn.removeAttribute("aria-hidden");
    } else {
      collectorBtn.setAttribute("tabindex", "-1");
      collectorBtn.setAttribute("aria-hidden", "true");
    }
  }

  const pinnedBtn = midtermPinEl?.querySelector(".tab-pinned");
  if (pinnedBtn) {
    const active = !featureActive && !searching && state.subjectId === "midterm-revision";
    pinnedBtn.setAttribute("aria-selected", active ? "true" : "false");
  }

  tabsEl.classList.toggle("is-collapsed", collapsed);

  if (isInitialMount) {
    void tabsEl.offsetWidth;
    requestAnimationFrame(() => tabsEl.classList.remove("is-no-anim"));
  }

  requestAnimationFrame(updateTabsScrollButtons);
  clearTimeout(tabsExpandTimer);
  tabsExpandTimer = setTimeout(updateTabsScrollButtons, 560);
}

function updateTabsScrollButtons() {
  if (!tabsEl || !tabsPrevEl || !tabsNextEl) return;
  const canScroll = tabsEl.scrollWidth > tabsEl.clientWidth + 4;
  tabsPrevEl.hidden = !canScroll;
  tabsNextEl.hidden = !canScroll;
}

function fileRow(file, subject, sectionId, variant = "", options = {}) {
  const tokens = Array.isArray(options.tokens) ? options.tokens : [];
  const meta = options.meta || "";
  const badge = esc(file.ext || "file");
  const yt = file.youtube
    ? `<a class="act yt" href="${esc(file.youtube)}" target="_blank" rel="noopener" title="مشاهدة الشرح" aria-label="مشاهدة الشرح">${ICONS.play}</a>`
    : "";
  const run =
    (file.ext || "").toLowerCase() === "html"
      ? `<a class="act run" href="${esc(file.path)}" target="_blank" rel="noopener" title="تشغيل الملف التفاعلي" aria-label="تشغيل">${ICONS.play}</a>`
      : "";
  const infoBtn = file.info
    ? `<button class="act info-btn" type="button" data-file-info="${esc(file.info)}" data-file-title="${esc(file.title)}" title="معلومات عن الملف" aria-label="معلومات عن الملف">${ICONS.info}</button>`
    : "";
  const bookmarked = isBookmarked(file.path);
  const bookmarkLabel = bookmarked ? "إزالة من المحفوظات" : "حفظ في المفضلة";
  const className = `file${variant ? ` ${variant}` : ""}${options.studyChecked ? " is-studied" : ""}`;
  return `<div class="${className}" tabindex="0" data-file="${esc(file.path)}" data-subject="${subject.id}" data-section="${esc(sectionId)}" title="معاينة أو تحميل الملف">
    <span class="file-badge ${badge}">${badge}</span>
    <div class="file-main">
      <span class="file-title" title="${esc(file.original || file.title)}">${highlightText(file.title, tokens)}</span>
      ${file.docTag ? `<span class="doc-tag ${file.docTag === "ملخص" ? "is-summary" : "is-questions"}">${esc(file.docTag)}</span>` : ""}
      ${options.showOriginal && file.original ? `<span class="file-original" dir="ltr">${highlightText(file.original, tokens)}</span>` : ""}
      <span class="file-sub">
        ${meta ? `<span class="file-meta">${esc(meta)}</span><span class="sep">·</span>` : ""}
        <span dir="ltr">${fmtSize(file.size)}</span>
        <span class="sep">·</span>
        <span dir="ltr">${badge.toUpperCase()}</span>
        <span class="sep hint-sep">·</span>
        <span class="file-hint hint-desktop">اضغط للتحميل</span>
        <span class="file-hint hint-mobile">اضغط للمعاينة</span>
      </span>
      ${options.studyKey ? `<label class="study-check file-study"><input type="checkbox" data-study="${esc(options.studyKey)}"${options.studyChecked ? " checked" : ""}><span>تمت المذاكرة</span></label>` : ""}
    </div>
    <div class="file-actions">
      ${infoBtn}
      <button class="act bookmark${bookmarked ? " is-bookmarked" : ""}" type="button" data-bookmark-toggle="${esc(file.path)}" aria-pressed="${bookmarked ? "true" : "false"}" title="${bookmarkLabel}" aria-label="${bookmarkLabel}">★</button>
      ${yt}
      ${run}
      <button class="act preview" type="button" title="معاينة داخل الموقع" aria-label="معاينة">${ICONS.eye}</button>
      <span class="dl-pill">${ICONS.download}<span>تحميل</span></span>
    </div>
  </div>`;
}

function downloadRow(row) {
  const subject = state.data.subjects.find((entry) => entry.id === row.dataset.subject);
  const file = subject && subjectFiles(subject).find((entry) => entry.path === row.dataset.file);
  if (!file) return;
  const anchor = document.createElement("a");
  anchor.href = file.path;
  anchor.download = file.path.split("/").pop();
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  row.classList.add("is-downloading");
  setTimeout(() => row.classList.remove("is-downloading"), 800);
}

function sectionIdOf(subject, file) {
  const section = subject.sections.find((entry) =>
    entry.files.some((item) => item.path === file.path),
  );
  return section ? section.id : "";
}

function maxLecture(subject) {
  let max = 0;
  for (const file of subjectFiles(subject)) {
    if (Number.isInteger(file.lecture)) max = Math.max(max, file.lecture);
    if (Array.isArray(file.lectureSpan)) {
      for (const lecture of file.lectureSpan) {
        if (Number.isInteger(lecture)) max = Math.max(max, lecture);
      }
    }
  }
  return max;
}

function lectureTotal(subject) {
  const midterm = state.schedule?.coursesMeta?.[subject.id]?.midtermLectures || [];
  return midterm.reduce(
    (max, lecture) => (Number.isInteger(lecture) ? Math.max(max, lecture) : max),
    maxLecture(subject),
  );
}

function lectureNoun(count) {
  return count >= 3 && count <= 10 ? "محاضرات" : "محاضرة";
}

function fileAppliesToLecture(file, lecture) {
  return file.lecture === lecture || (Array.isArray(file.lectureSpan) && file.lectureSpan.includes(lecture));
}

function getStudied() {
  const value = store.getJson("hub:studied", {});
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

const BOOKMARKS_KEY = "hub:bookmarks";

function getBookmarks() {
  const value = store.getJson(BOOKMARKS_KEY, {});
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function isBookmarked(filePath) {
  return Boolean(getBookmarks()[filePath]);
}

function toggleBookmark(filePath) {
  if (!filePath) return false;
  const bookmarks = getBookmarks();
  const bookmarked = !bookmarks[filePath];
  if (bookmarked) bookmarks[filePath] = true;
  else delete bookmarks[filePath];
  store.setJson(BOOKMARKS_KEY, bookmarks);
  window.dispatchEvent(
    new CustomEvent("hub:bookmarks-updated", {
      detail: { source: "ui", path: filePath, bookmarked },
    }),
  );
  return bookmarked;
}

function bookmarkedFiles(subject) {
  const bookmarks = getBookmarks();
  const seen = new Set();
  return subjectFiles(subject).filter((file) => {
    if (!bookmarks[file.path] || seen.has(file.path)) return false;
    seen.add(file.path);
    return true;
  });
}

function sectionNameOf(subject, file) {
  const section = subject.sections.find((entry) =>
    entry.files.some((item) => item.path === file.path),
  );
  return section ? section.name : "";
}

function updateStudyProgress(subjectId) {
  const subject = subjectById(subjectId);
  if (!subject) return;
  const boxes = viewEl.querySelectorAll(`[data-study^="${CSS.escape(subjectId)}:"]`);
  const lectureCount =
    subjectId === "computer-networks" && boxes.length ? boxes.length : lectureTotal(subject);
  let studied = 0;
  boxes.forEach((box) => {
    if (box.checked) studied += 1;
  });
  const percent = lectureCount ? Math.round((studied / lectureCount) * 100) : 0;
  const progress = viewEl.querySelector(`[data-progress="${CSS.escape(subjectId)}"]`);
  if (!progress) return;
  const label = progress.querySelector(".progress-head span");
  const value = progress.querySelector(".progress-head strong");
  const bar = progress.querySelector(".progress span");
  const unitLabel = subjectId === "computer-networks" ? "فصل" : lectureNoun(lectureCount);
  if (label) label.textContent = `تمت مذاكرة ${studied} من ${lectureCount} ${unitLabel}`;
  if (value) value.textContent = `${percent}%`;
  if (bar) bar.style.width = `${percent}%`;
}

function studyProgressMarkup(subject, studiedCount, totalOverride = null) {
  const lectureCount = totalOverride ?? lectureTotal(subject);
  const percent = lectureCount ? Math.round((studiedCount / lectureCount) * 100) : 0;
  const unitLabel = subject.id === "computer-networks" ? "فصل" : lectureNoun(lectureCount);
  return `<div class="matrix-toolbar" data-progress="${esc(subject.id)}">
      <div class="progress-head"><span>تمت مذاكرة ${studiedCount} من ${lectureCount} ${unitLabel}</span><strong>${percent}%</strong></div>
      <div class="progress"><span style="width:${percent}%"></span></div>
    </div>`;
}

function bookmarkStripMarkup(subject, files) {
  const open = store.get("section:__bookmarks") !== "closed";
  return `<section class="section bookmarks-section" data-section="__bookmarks" data-open="${open}">
    <button class="section-head" type="button" aria-expanded="${open}">
      <span class="section-icon">${ICONS.simple}</span>
      <span class="section-titles">
        <h3>المحفوظات السريعة (${files.length})</h3>
        <span class="en">Quick Bookmarks</span>
      </span>
      <span class="section-badge">${files.length}</span>
      <svg class="chevron" viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="section-body">
      ${files
        .map((file) =>
          fileRow(file, subject, sectionIdOf(subject, file), "file-compact", {
            meta: sectionNameOf(subject, file),
          }),
        )
        .join("")}
    </div>
  </section>`;
}

function bookmarksSlotMarkup(subject) {
  const files = bookmarkedFiles(subject);
  return `<div class="bookmarks-slot" data-bookmarks-slot${files.length ? "" : " hidden"}>${
    files.length ? bookmarkStripMarkup(subject, files) : ""
  }</div>`;
}

function refreshBookmarkUI(filePath) {
  const bookmarked = isBookmarked(filePath);
  const label = bookmarked ? "إزالة من المحفوظات" : "حفظ في المفضلة";
  viewEl.querySelectorAll("[data-bookmark-toggle]").forEach((button) => {
    if (button.dataset.bookmarkToggle !== filePath) return;
    button.classList.toggle("is-bookmarked", bookmarked);
    button.setAttribute("aria-pressed", bookmarked ? "true" : "false");
    button.title = label;
    button.setAttribute("aria-label", label);
  });
  const slot = viewEl.querySelector("[data-bookmarks-slot]");
  const subject = subjectById(state.subjectId);
  if (slot && subject) {
    const files = bookmarkedFiles(subject);
    slot.hidden = files.length === 0;
    slot.innerHTML = files.length ? bookmarkStripMarkup(subject, files) : "";
  }
}

function parseYouTubeTime(value) {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return 0;
  if (/^\d+$/.test(text)) return Number(text);
  const match = text.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match) return 0;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

function formatYouTubeTimestamp(value) {
  const seconds = parseYouTubeTime(value);
  if (!seconds) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}`
    : `${minutes}:${rest}`;
}

function parseYouTubeUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return null;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  let videoId = "";
  if (host === "youtu.be") {
    videoId = parsed.pathname.split("/").filter(Boolean)[0] || "";
  } else if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com"
  ) {
    if (parsed.pathname === "/watch") videoId = parsed.searchParams.get("v") || "";
    else if (parsed.pathname.startsWith("/shorts/")) videoId = parsed.pathname.split("/")[2] || "";
    else if (parsed.pathname.startsWith("/embed/")) videoId = parsed.pathname.split("/")[2] || "";
  }
  if (!videoId) return null;
  return {
    videoId,
    startSeconds: parseYouTubeTime(parsed.searchParams.get("t") || ""),
  };
}

function buildYouTubeTimestampUrl(baseUrl, t) {
  const raw = String(baseUrl || "");
  const seconds = parseYouTubeTime(t);
  try {
    const parsed = new URL(raw);
    if (seconds > 0) parsed.searchParams.set("t", `${seconds}s`);
    else parsed.searchParams.delete("t");
    return parsed.toString();
  } catch {
    return raw;
  }
}

function buildYouTubeEmbedUrl(videoId, startSeconds = 0) {
  const params = new URLSearchParams({ autoplay: "1", rel: "0" });
  if (startSeconds > 0) params.set("start", String(startSeconds));
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
}

function collectYouTubeLinks(meta, subject) {
  const links = [];
  const push = (url, title, chapters) => {
    const clean = String(url || "").trim();
    if (!clean) return;
    links.push({
      url: clean,
      title: String(title || "").trim() || "شرح المادة",
      chapters: Array.isArray(chapters)
        ? chapters.filter((chapter) => chapter && chapter.label && chapter.t)
        : [],
    });
  };
  if (Array.isArray(meta?.youtubeLinks)) {
    for (const link of meta.youtubeLinks) push(link?.url, link?.title, link?.chapters);
  }
  if (meta?.youtube) push(meta.youtube, meta.youtubeTitle);
  else if (!links.length && subject?.youtube) push(subject.youtube);
  return links;
}

function renderSubjectLinksBox(subject) {
  const meta = state.schedule?.coursesMeta?.[subject.id];
  const ytLinks = collectYouTubeLinks(meta, subject);
  const extLinks = Array.isArray(meta?.links)
    ? meta.links.filter((l) => l && /^https?:\/\//i.test(String(l.url || "").trim()))
    : [];
  if (!ytLinks.length && !extLinks.length) return "";

  const totalCount = ytLinks.length + extLinks.length;
  const triggerLabel = ytLinks.length ? "شرح المادة" : "روابط المادة";
  const triggerIcon = ytLinks.length ? ICONS.youtube : ICONS.external;

  const ytItems = ytLinks
    .map((link) => {
      const parsed = parseYouTubeUrl(link.url);
      const chapters = link.chapters
        .map(
          (chapter) =>
            `<a class="yt-chapter-chip" href="${esc(buildYouTubeTimestampUrl(link.url, chapter.t))}" target="_blank" rel="noopener">▶ ${esc(formatYouTubeTimestamp(chapter.t))} · ${esc(chapter.label)}</a>`,
        )
        .join("");
      return `<div class="slb-pill">
        <span class="slb-title">${esc(link.title)}</span>
        <div class="slb-btns">
          <a class="circle-icon-btn yt-circle" href="${esc(link.url)}" target="_blank" rel="noopener" title="مشاهدة على يوتيوب — ${esc(link.title)}" aria-label="مشاهدة على يوتيوب">${ICONS.youtube}</a>
          ${
            parsed
              ? `<button class="circle-icon-btn play-circle" type="button" data-yt-embed="${esc(parsed.videoId)}" data-yt-start="${parsed.startSeconds}" data-yt-title="${esc(link.title)}" title="تشغيل هنا — ${esc(link.title)}" aria-label="تشغيل هنا">${ICONS.play}</button>`
              : ""
          }
        </div>
        ${chapters ? `<div class="yt-chapters">${chapters}</div>` : ""}
      </div>`;
    })
    .join("");

  const extItems = extLinks
    .map((link) => {
      const title = String(link.title || "").trim() || "فتح الرابط";
      const url = String(link.url).trim();
      return `<div class="slb-pill">
        <span class="slb-title">${esc(title)}</span>
        <div class="slb-btns">
          <a class="circle-icon-btn ext-circle" href="${esc(url)}" target="_blank" rel="noopener" title="${esc(title)}" aria-label="${esc(title)}">${ICONS.external}</a>
        </div>
      </div>`;
    })
    .join("");

  return `<details class="links-circle-card ci-links-inline" style="--accent:${subject.accent}">
    <summary class="links-circle-trigger" title="${esc(triggerLabel)}" aria-label="${esc(triggerLabel)}">
      <span class="links-circle-orb${ytLinks.length ? " is-yt" : ""}">
        ${triggerIcon}
        ${totalCount > 1 ? `<span class="links-circle-count">${totalCount}</span>` : ""}
      </span>
      <span class="links-circle-label">${esc(triggerLabel)}</span>
      <span class="ci-summary-chevron" aria-hidden="true">▾</span>
    </summary>
    <div class="links-circle-tray">
      ${ytItems}
      ${extItems}
    </div>
  </details>`;
}

function renderCourseInfo(subject) {
  const meta = state.schedule?.coursesMeta?.[subject.id];
  if (!meta) return "";
  const instructors = sectionInstructors(subject.id);
  return `<details class="course-info-card" id="sec-course-info" data-spy-section="course-info" data-spy-label="معلومات المادة" style="--accent:${subject.accent}">
    <summary class="course-info-summary">
      <span class="ci-summary-title">معلومات المادة — ${esc(subject.nameAr)}</span>
      <span class="ci-summary-en" dir="ltr">${esc(subject.name)}</span>
      <span class="ci-summary-chevron" aria-hidden="true">▾</span>
    </summary>
    <div class="course-info">
      <div class="ci-item"><span class="ci-label">الدكتور</span><strong>${esc((meta.doctors || []).join("، ") || "غير محدد")}</strong></div>
      <div class="ci-item"><span class="ci-label">معيد سكشنك (${esc(state.section)})</span><strong>${esc(instructors || "غير محدد")}</strong></div>
      <div class="ci-item"><span class="ci-label">درجة الميدترم</span><strong>${esc(meta.midtermMarks || "غير محدد")}</strong></div>
      <div class="ci-item"><span class="ci-label">نطاق الميدترم</span><strong>${esc(meta.midtermScopeText || "غير محدد")}</strong></div>
      ${renderSubjectLinksBox(subject)}
    </div>
  </details>`;
}

function renderReviewBlock(subject, files) {
  const practiceHref = `#practice/${esc(subject.id)}`;
  const midtermSection = subject.sections?.find((section) => section.id === "midterm-revision");
  const open = store.get("section:review") !== "closed";
  return `<section class="section review-block" id="sec-review" data-section="review" data-open="${open}" data-spy-section="review" data-spy-label="مراجعات الميدترم">
    <div class="section-head review-head" role="button" tabindex="0" aria-expanded="${open}">
      <span class="section-icon">${ICONS.revision}</span>
      <span class="section-titles">
        <h3>مراجعات الميدترم والملفات الشاملة <span class="important-badge">★ مهم</span></h3>
        <span class="en">${midtermSection?.nameEn ? `${esc(midtermSection.nameEn)} · ` : ""}${files.length} ملف</span>
      </span>
      <a class="btn btn-sm" href="${practiceHref}">${ICONS.question}<span>اختبر نفسك</span></a>
      <svg class="chevron" viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="section-body review-body">
      ${
        files.length
          ? `<div class="review-grid">${files
              .map((file) => fileRow(file, subject, sectionIdOf(subject, file)))
              .join("")}</div>`
          : `<p class="review-empty">لا توجد ملفات مراجعة لهذه المادة بعد.</p>`
      }
    </div>
  </section>`;
}

function renderMatrixSlot(files, subject) {
  if (!files.length) return `<span class="cell-empty">غير متاح حالياً</span>`;
  return `<div class="cell-files">${files
    .map((file) => fileRow(file, subject, sectionIdOf(subject, file), "file-compact"))
    .join("")}</div>`;
}

function renderMatrix(subject) {
  const meta = state.schedule?.coursesMeta?.[subject.id];
  const midtermLectures = new Set(meta?.midtermLectures || []);
  const files = subjectFiles(subject);
  const lectureCount = lectureTotal(subject);
  const midtermSection = subject.sections.find((section) => section.id === "midterm-revision");
  const committeesSection = subject.sections.find(
    (section) => section.id === "committees" && section.files.length,
  );
  const curatedSection = SUBJECT_TO_MIDTERM_SEC[subject.id]
    ? subjectById("midterm-revision")?.sections.find(
        (section) => section.id === SUBJECT_TO_MIDTERM_SEC[subject.id],
      )
    : null;
  const curatedFiles = curatedSection?.files || [];
  const curatedOrder = new Map();
  const curatedTags = new Map();
  curatedFiles.forEach((file, index) => {
    if (file.id) {
      curatedOrder.set(file.id, index);
      if (file.docTag) curatedTags.set(file.id, file.docTag);
    }
    curatedOrder.set(file.path, index);
    if (file.docTag) curatedTags.set(file.path, file.docTag);
  });
  let reviewFiles = files.filter(
    (file) =>
      file.midtermReview === true ||
      (file.midtermReview !== false &&
        (file.kind === "review" || file.kind === "book" || file.lecture === null)),
  );
  if (subject.id !== "system-analysis") {
    reviewFiles = curatedFiles
      .map((curated) => {
        const file = files.find(
          (entry) => entry.id === curated.id || entry.path === curated.path,
        );
        return file ? { ...file, docTag: curated.docTag || file.docTag, info: curated.info || file.info, addedAt: file.addedAt || curated.addedAt } : curated;
      })
      .filter(Boolean);
  } else {
    const orderOf = (file) =>
      (file.id && curatedOrder.has(file.id) ? curatedOrder.get(file.id) : undefined) ??
      (curatedOrder.has(file.path) ? curatedOrder.get(file.path) : Number.MAX_SAFE_INTEGER);
    reviewFiles.sort((a, b) => orderOf(a) - orderOf(b));
  }
  const reviewSet = new Set(reviewFiles.map((file) => file.path));
  const extraFiles = ["computer-networks", "database-2", "information-theory"].includes(
    subject.id,
  )
    ? files.filter(
        (file) =>
          !String(file.path || "").startsWith("files/committees/") &&
          !reviewSet.has(file.path) &&
          !Number.isInteger(file.lecture) &&
          !(Array.isArray(file.lectureSpan) && file.lectureSpan.length),
      )
    : [];
  const studiedMap = getStudied();
  let studiedCount = 0;
  const rows = [];

  for (let lecture = 1; lecture <= lectureCount; lecture += 1) {
    const lectureFiles = files.filter((file) => fileAppliesToLecture(file, lecture));
    const slots = {
      lecture: lectureFiles.filter((file) => file.kind === "lecture"),
      summary: lectureFiles.filter((file) => file.kind === "summary"),
      questions: lectureFiles.filter((file) => file.kind === "questions"),
      solution: lectureFiles.filter((file) => file.kind === "solution"),
    };
    const key = `${subject.id}:${lecture}`;
    const studied = Boolean(studiedMap[key]);
    if (studied) studiedCount += 1;
    rows.push(`<div class="matrix-row${studied ? " is-studied" : ""}" data-lecture="${lecture}">
      <div class="matrix-lecture">
        <div class="matrix-lec-top">
          <span class="lec-number">${lecture}</span>
          <div>
            <strong>محاضرة ${lecture}</strong>
            ${midtermLectures.has(lecture) ? '<span class="midterm-badge">في الميدترم</span>' : ""}
          </div>
        </div>
        <label class="study-check"><input type="checkbox" data-study="${esc(key)}"${studied ? " checked" : ""}><span>تمت المذاكرة</span></label>
      </div>
      ${["lecture", "summary", "questions", "solution"]
        .map(
          (slot) =>
            `<div class="matrix-cell" data-slot="${slot}">${renderMatrixSlot(slots[slot], subject)}</div>`,
        )
        .join("")}
    </div>`);
  }

  const table = lectureCount
    ? `<div class="matrix-wrap" id="sec-matrix" data-spy-section="matrix" data-spy-label="جدول المحاضرات"><div class="matrix">
        <div class="matrix-head">
          <div>المحاضرة</div>
          <div>${ICONS.lecture}<span>المحاضرة</span></div>
          <div>${ICONS.summary}<span>الملخص</span></div>
          <div>${ICONS.question}<span>الأسئلة</span></div>
          <div>${ICONS.check}<span>الحل</span></div>
        </div>
        ${rows.join("")}
      </div></div>`
    : `<div class="empty">${ICONS.lecture}<strong>لا توجد محاضرات مفهرسة</strong><span>لم يتم العثور على ملفات محاضرات مرقمة لهذه المادة.</span></div>`;
  const extraSection = extraFiles.length
    ? `<section class="section matrix-extra" id="sec-extra" data-section="extra" data-spy-section="extra" data-spy-label="مراجع وملفات إضافية" data-open="true">
        <button class="section-head" type="button" aria-expanded="true">
          <span class="section-icon">${ICONS.file}</span>
          <span class="section-titles"><h3>مراجع وملفات إضافية</h3><span class="en">Reference Files</span></span>
          <span class="section-badge">${extraFiles.length}</span>
        </button>
        <div class="section-body">${extraFiles
          .map((file) => fileRow(file, subject, sectionIdOf(subject, file)))
          .join("")}</div>
      </section>`
    : "";

  const committeesMarkup = committeesSection
    ? sectionMarkup(
        committeesSection,
        committeesSection.files
          .map((file) => fileRow(file, subject, committeesSection.id))
          .join(""),
        store.get(`section:${committeesSection.id}`) !== "closed",
      )
    : "";

  return `${renderReviewBlock(subject, reviewFiles)}
    ${committeesMarkup}
    ${studyProgressMarkup(subject, studiedCount)}
    ${table}
    ${extraSection}`;
}

function sectionMarkup(section, rows, open) {
  return `<section class="section" data-section="${section.id}" data-open="${open}">
        <button class="section-head" type="button" aria-expanded="${open}">
          <span class="section-icon">${ICONS[sectionIconKey(section)]}</span>
          <span class="section-titles">
            <h3>${esc(section.name)}${section.important ? ' <span class="important-badge">★ مهمة</span>' : ""}</h3>
            <span class="en">${esc(section.nameEn)}</span>
          </span>
          <span class="section-badge">${section.files.length}</span>
          <svg class="chevron" viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="section-body">
          ${rows}
        </div>
      </section>`;
}

function renderClassicSections(subject) {
  const studiedMap = getStudied();
  const seenLectures = new Set();
  let studiedCount = 0;
  const sections = subject.sections
    .map((section) => {
      const open = store.get(`section:${section.id}`) !== "closed";
      const rows = section.files
        .map((file) => {
          const options = {};
          if (Number.isInteger(file.lecture) && !seenLectures.has(file.lecture)) {
            seenLectures.add(file.lecture);
            const key = `${subject.id}:${file.lecture}`;
            const checked = Boolean(studiedMap[key]);
            if (checked) studiedCount += 1;
            options.studyKey = key;
            options.studyChecked = checked;
          }
          return fileRow(file, subject, section.id, "", options);
        })
        .join("");
      return sectionMarkup(section, rows, open);
    })
    .join("");
  return `${studyProgressMarkup(subject, studiedCount)}${sections}`;
}

function renderMidtermKanban(subject) {
  const columns = subject.sections.filter((section) => section.id !== "general");
  if (!(state.kanbanExpanded instanceof Set)) {
    const defId = defaultMidtermKanbanSectionId() || columns[0]?.id;
    state.kanbanExpanded = new Set(defId ? [defId] : []);
  }
  return `<div class="kanban-board">
    ${columns
      .map((section) => {
        const targetId = MIDTERM_TO_SUBJECT_ID[section.id] || section.id;
        const targetSubject = subjectById(targetId);
        const isOpen = state.kanbanExpanded.has(section.id);
        const bodyId = `kanban-body-${section.id}`;
        return `<section class="kanban-col${isOpen ? "" : " is-collapsed"}" id="sec-${esc(section.id)}"
          data-spy-section="${esc(section.id)}" data-spy-label="${esc(section.name)}"
          style="--col-accent:${esc(targetSubject?.accent || subject.accent)}">
          <header class="kanban-col-head">
            <button class="kanban-col-toggle" type="button" data-kanban-toggle="${esc(section.id)}"
              aria-expanded="${isOpen}" aria-controls="${esc(bodyId)}">
              <span class="dot" style="background:var(--col-accent)"></span>
              <span class="kanban-col-name">${esc(section.name)}</span>
              <span class="kanban-col-count">${section.files.length}</span>
              <svg class="kanban-col-chevron" viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <a class="kanban-col-link" href="#${esc(targetId)}">المادة ↗</a>
          </header>
          <div class="kanban-col-body" id="${esc(bodyId)}"${isOpen ? "" : " hidden"}>
            ${
              section.files.length
                ? section.files
                    .map((file) =>
                      fileRow(file, targetSubject || subject, section.id, "file-kanban"),
                    )
                    .join("")
                : '<span class="cell-empty">غير متاح حالياً</span>'
            }
          </div>
        </section>`;
      })
      .join("")}
  </div>`;
}

function renderNetworksUnitTable(subject, section, units, colLabels, studiedMap, onStudied) {
  if (!section) return "";
  const rows = units
    .map((unit) => {
      const unitFiles = section.files.filter((file) => file.unit === unit.id);
      if (!unitFiles.length) return "";
      const slots = {
        book: unitFiles.filter((f) => f.slot === "book"),
        summary: unitFiles.filter((f) => f.slot === "summary"),
        qa: unitFiles.filter((f) => f.slot === "qa"),
      };
      const studyHtml = unit.trackStudy
        ? (() => {
            const key = `${subject.id}:${unit.id}`;
            const studied = Boolean(studiedMap[key]);
            if (studied) onStudied();
            return `<label class="study-check"><input type="checkbox" data-study="${esc(key)}"${studied ? " checked" : ""}><span>تمت المذاكرة</span></label>`;
          })()
        : "";
      const rowStudied = unit.trackStudy && Boolean(studiedMap[`${subject.id}:${unit.id}`]);
      return `<div class="matrix-row${rowStudied ? " is-studied" : ""}" data-unit="${esc(unit.id)}">
        <div class="matrix-lecture">
          <div class="matrix-lec-top">
            <span class="lec-number">${esc(unit.badge)}</span>
            <div>
              <strong>${esc(unit.title)}</strong>
              ${unit.sub ? `<span class="net-unit-sub" dir="ltr">${esc(unit.sub)}</span>` : ""}
              ${unit.inExam ? '<span class="midterm-badge">مقرر بالامتحان</span>' : ""}
            </div>
          </div>
          ${studyHtml}
        </div>
        <div class="matrix-cell" data-slot="book">${renderMatrixSlot(slots.book, subject)}</div>
        <div class="matrix-cell" data-slot="summary">${renderMatrixSlot(slots.summary, subject)}</div>
        <div class="matrix-cell" data-slot="qa">${renderMatrixSlot(slots.qa, subject)}</div>
      </div>`;
    })
    .join("");

  if (!rows) return "";
  return `<div class="matrix-wrap net-matrix-wrap">
    <div class="matrix net-matrix">
      <div class="matrix-head net-matrix-head">
        <div>${esc(colLabels[0])}</div>
        <div>${ICONS.book}<span>${esc(colLabels[1])}</span></div>
        <div>${ICONS.summary}<span>${esc(colLabels[2])}</span></div>
        <div>${ICONS.question}<span>${esc(colLabels[3])}</span></div>
      </div>
      ${rows}
    </div>
  </div>`;
}

function renderNetworksHub(subject) {
  const byId = new Map((subject.sections || []).map((sec) => [sec.id, sec]));
  const atwanBook = byId.get("atwan-book");
  const atwanChapters = byId.get("atwan-chapters");
  const mahfouz = byId.get("mahfouz");
  const midtermSec = byId.get("midterm-revision");
  const committeesSec = byId.get("committees");

  const reviewFiles = midtermSec?.files || [];

  const committeesMarkup = committeesSec?.files?.length
    ? sectionMarkup(
        committeesSec,
        committeesSec.files.map((file) => fileRow(file, subject, committeesSec.id)).join(""),
        store.get(`section:${committeesSec.id}`) !== "closed",
      )
    : "";

  const studiedMap = getStudied();
  let studiedCount = 0;
  const countStudied = () => {
    studiedCount += 1;
  };

  const atwanChaptersTable = renderNetworksUnitTable(
    subject,
    atwanChapters,
    [
      { id: "atwan-ch1", badge: "Ch1", title: "Ch 01: Introduction to Networks", sub: "pp. 3–21 · مراجعة", inExam: true, trackStudy: true },
      { id: "atwan-ch2", badge: "Ch2", title: "Ch 02: Data Communication", sub: "pp. 22–47 · مراجعة", inExam: true, trackStudy: true },
      { id: "atwan-ch3", badge: "Ch3", title: "Ch 03: Network Hardware & LAN", sub: "pp. 48–79 · مراجعة", inExam: true, trackStudy: true },
      { id: "atwan-ch4", badge: "Ch4", title: "Ch 04: OSI Model", sub: "pp. 80–102 · مراجعة", inExam: true, trackStudy: true },
      { id: "atwan-ch5", badge: "Ch5", title: "Ch 05: Protocols", sub: "pp. 103–162 · مشروحة", inExam: true, trackStudy: true },
      { id: "atwan-ch6", badge: "Ch6", title: "Ch 06: Wide Area Networks", sub: "pp. 163–176 · مشروحة", inExam: true, trackStudy: true },
      { id: "atwan-ch7", badge: "Ch7", title: "Ch 07: Addressing", sub: "pp. 177–205 · مشروحة", inExam: true, trackStudy: true },
      { id: "atwan-lec1-3", badge: "Lec", title: "ملخصات وأسئلة المحاضرات 1–3", sub: "Lec 01–03", inExam: false, trackStudy: false },
      { id: "atwan-lec4-5", badge: "Lec", title: "محاضرات 4–5 و IPv4 Structure", sub: "Lec 04–05 + IPv4", inExam: false, trackStudy: false },
    ],
    ["الفصل / المحاضرة", "الكتاب (PDF)", "الملخص (.md / Lec)", "الأسئلة والحل (Q&A)"],
    studiedMap,
    countStudied,
  );

  const mahfouzTable = renderNetworksUnitTable(
    subject,
    mahfouz,
    [
      { id: "mahfouz-ch1", badge: "Ch1", title: "Ch 01: Introduction (Full)", sub: "84 Slides · Full", inExam: true, trackStudy: true },
      { id: "mahfouz-ch2", badge: "Ch2", title: "Ch 02: Application Layer", sub: "Slides 1–42 (حتى Web Caches)", inExam: true, trackStudy: true },
    ],
    ["الفصل", "السلايدز (PDF)", "الملخص (.md)", "الأسئلة والحل (Q&A)"],
    studiedMap,
    countStudied,
  );

  const atwanOpen = store.get("section:net-atwan") !== "closed";
  const mahfouzOpen = store.get("section:net-mahfouz") !== "closed";

  return `${renderReviewBlock(subject, reviewFiles)}
    ${committeesMarkup}
    ${studyProgressMarkup(subject, studiedCount, 9)}
    <section class="section net-track" id="sec-atwan" data-section="net-atwan" data-open="${atwanOpen}" data-spy-section="atwan" data-spy-label="د. أحمد عطوان">
      <button class="section-head" type="button" aria-expanded="${atwanOpen}">
        <span class="section-icon">${ICONS.lecture}</span>
        <span class="section-titles">
          <h3>1. د. أحمد عطوان — الفصول 1 إلى 7</h3>
          <span class="en">Dr. Ahmed Atwan · Chapters 1–7</span>
        </span>
        <span class="net-scope-pill is-included">مقرر بالامتحان (Ch. 1–7)</span>
        <svg class="chevron" viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="section-body net-track-body">
        ${
          atwanBook?.files?.length
            ? `<div class="net-book-strip">${atwanBook.files
                .map((f) => fileRow(f, subject, atwanBook.id, "file-compact"))
                .join("")}</div>`
            : ""
        }
        ${atwanChaptersTable}
      </div>
    </section>
    <section class="section net-track" id="sec-mahfouz" data-section="net-mahfouz" data-open="${mahfouzOpen}" data-spy-section="mahfouz" data-spy-label="د. محمد محفوظ">
      <button class="section-head" type="button" aria-expanded="${mahfouzOpen}">
        <span class="section-icon">${ICONS.slides}</span>
        <span class="section-titles">
          <h3>2. د. محمد محفوظ — Kurose & Ross</h3>
          <span class="en">Dr. Mahfouz · Ch. 1 (Full) + Ch. 2 (Slides 1–42)</span>
        </span>
        <span class="net-scope-pill is-included">Ch. 1 + Ch. 2 (1–42)</span>
        <svg class="chevron" viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="section-body net-track-body">
        ${mahfouzTable}
      </div>
    </section>`;
}

function renderSubject(subject) {
  const supportsMatrix = subject.id !== "midterm-revision";
  const useMatrix = supportsMatrix && state.viewMode !== "classic";
  const toggle = supportsMatrix
    ? `<div class="subject-toolbar">
        <button class="btn btn-sm" type="button" data-view-toggle="1">
          ${useMatrix ? ICONS.folder : ICONS.grid}
          <span>${useMatrix ? "عرض كأقسام كلاسيكية (القديم)" : "عرض كجدول محاضرات (الجديد)"}</span>
        </button>
      </div>`
    : "";
  const body =
    subject.id === "midterm-revision"
      ? renderMidtermKanban(subject)
      : useMatrix
        ? subject.id === "computer-networks"
          ? renderNetworksHub(subject)
          : renderMatrix(subject)
        : renderClassicSections(subject);

  viewEl.innerHTML = `<div class="subject-wrap" style="--accent:${subject.accent}">
    <div class="subject-head">
      <div class="subject-titles">
        <span class="eyebrow"><span class="dot" style="width:8px;height:8px;border-radius:50%;background:${subject.accent};display:inline-block"></span>${esc(subject.name)}</span>
        <h2>${esc(subject.nameAr)}</h2>
      </div>
      <div class="subject-actions">
        <a class="btn" href="downloads/${subject.id}.zip" download>${ICONS.download}<span>تحميل المادة</span></a>
      </div>
    </div>
    ${renderCourseInfo(subject)}
    ${toggle}
    ${bookmarksSlotMarkup(subject)}
    ${body}
  </div>`;
}

function renderSearch(query) {
  const parsed = parseQuery(query);
  const fileEntries = (state.searchIndex || []).filter((entry) =>
    fileMatchesFacetsAndQuery(entry, parsed),
  );
  const questionEntries = parsed.tokens.length
    ? (state.questionIndex || []).filter((entry) =>
        questionMatchesFacetsAndQuery(entry, parsed),
      )
    : [];

  const subjectOrder = new Map(
    state.data.subjects.map((subject, index) => [subject.id, index]),
  );
  fileEntries.sort(
    (a, b) =>
      (subjectOrder.get(a.subject.id) ?? 99) - (subjectOrder.get(b.subject.id) ?? 99) ||
      (a.file.lecture ?? 99) - (b.file.lecture ?? 99) ||
      String(a.file.title).localeCompare(String(b.file.title), "ar"),
  );

  const fileGroups = [];
  const fileGroupMap = new Map();
  for (const entry of fileEntries) {
    let group = fileGroupMap.get(entry.subject.id);
    if (!group) {
      group = { subject: entry.subject, entries: [] };
      fileGroupMap.set(entry.subject.id, group);
      fileGroups.push(group);
    }
    group.entries.push(entry);
  }

  const questionGroups = [];
  const questionGroupMap = new Map();
  for (const entry of questionEntries) {
    const key = entry.subjectId;
    let group = questionGroupMap.get(key);
    if (!group) {
      group = {
        subject:
          entry.subject || { id: key, nameAr: key, accent: "#64748b" },
        entries: [],
      };
      questionGroupMap.set(key, group);
      questionGroups.push(group);
    }
    group.entries.push(entry);
  }

  const fileCount = fileEntries.length;
  const questionCount = questionEntries.length;
  const label = parsed.raw.trim() ? `«${esc(parsed.raw.trim())}»` : "كل الملفات";
  const head = `<div class="search-head">
    <h2>نتائج البحث</h2>
    <span class="muted">${fileCount} ملف · ${questionCount} سؤال · ${label}</span>
  </div>`;

  if (!fileCount && !questionCount) {
    viewEl.innerHTML = `<div class="search-results">
      ${head}
      <div class="empty">
        ${ICONS.search}
        <strong>لا توجد نتائج</strong>
        <span>جرّب كلمة أخرى مثل «محاضرة 3» أو «Database» أو «DFD»، أو امسح الفلاتر.</span>
        ${searchActive() ? '<button class="btn btn-sm" type="button" data-facet="reset" style="margin-top:12px">مسح البحث والفلاتر</button>' : ""}
      </div>
    </div>`;
    return;
  }

  const filesHtml = fileGroups
    .map(
      ({ subject, entries }) => `<div class="result-group" style="--accent:${subject.accent}">
        <div class="result-subject">
          <span class="dot" style="background:${subject.accent}"></span>
          <span>${esc(subject.nameAr)}</span>
          <span class="muted">${entries.length}</span>
        </div>
        <section class="section" data-open="true"><div class="section-body">
          ${entries.map((entry) => searchFileCard(entry, parsed.tokens)).join("")}
        </div></section>
      </div>`,
    )
    .join("");

  const questionsHtml = questionGroups
    .map(({ subject, entries }) => {
      const shown = entries.slice(0, MAX_QUESTIONS_PER_SUBJECT);
      const hidden = entries.length - shown.length;
      return `<div class="result-group" style="--accent:${subject.accent}">
        <div class="result-subject">
          <span class="dot" style="background:${subject.accent}"></span>
          <span>${esc(subject.nameAr)} — أسئلة</span>
          <span class="muted">${entries.length}</span>
        </div>
        <div class="question-list">
          ${shown.map((entry) => searchQuestionCard(entry, parsed.tokens)).join("")}
        </div>
        ${hidden > 0 ? `<p class="q-more">+${hidden} سؤال آخر مطابق — ضيّق البحث أو استخدم الفلاتر.</p>` : ""}
      </div>`;
    })
    .join("");

  const questionsSection = questionsHtml
    ? `<div class="search-section">
        <h3 class="search-section-title">${ICONS.question}<span>الأسئلة المطابقة من بنك الامتحانات</span><span class="muted">${questionCount}</span></h3>
        ${questionsHtml}
      </div>`
    : "";

  viewEl.innerHTML = `<div class="search-results">
    ${head}
    ${filesHtml}
    ${questionsSection}
  </div>`;
}

function scheduleEventCard(entry, showSectionLabel) {
  const subject = subjectById(entry.subjectId);
  const range = eventPeriodRange(entry);
  const typeLabel = entry.type === "section" ? "سكشن" : "محاضرة";
  const badges = [];
  badges.push(`<span class="tt-badge">${typeLabel}</span>`);
  if (entry.sectionBadge === "مشترك") badges.push('<span class="tt-badge shared">مشترك</span>');
  else if (showSectionLabel && entry.sectionBadge)
    badges.push(`<span class="tt-badge">${esc(entry.sectionBadge)}</span>`);
  return `<div class="tt-event" style="--accent:${esc(subject?.accent || "#4e8d9c")}">
    <span class="tt-time" dir="ltr">${esc(range.label)}</span>
    <span class="tt-title">${esc(entry.title)}</span>
    <span class="tt-meta">${esc(entry.room || "")}${entry.instructor ? ` · ${esc(entry.instructor)}` : ""}</span>
    <span class="tt-badges">${badges.join("")}</span>
  </div>`;
}

function renderSchedule() {
  const schedule = state.schedule;
  if (!schedule) {
    viewEl.innerHTML = `<div class="empty">${ICONS.calendar}<strong>الجدول غير متاح</strong><span>لم يتم تحميل بيانات الجدول.</span></div>`;
    return;
  }
  const all = state.scheduleAll;
  const now = new Date();
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entriesByDay = new Map(WEEK_DAYS.map((day) => [day, []]));
  const addEntry = (entry, sectionBadge) => {
    if (!entriesByDay.has(entry.day)) return;
    entriesByDay.get(entry.day).push({ ...entry, sectionBadge });
  };

  if (all) {
    for (const entry of schedule.sharedLectures || []) addEntry(entry, "مشترك");
    for (const [sectionNumber, entries] of Object.entries(schedule.sectionsTimetable || {})) {
      for (const entry of entries) addEntry(entry, `سكشن ${sectionNumber}`);
    }
  } else {
    for (const entry of schedule.sharedLectures || []) {
      if ((entry.sections || []).map(Number).includes(Number(state.section))) {
        addEntry(entry, "مشترك");
      }
    }
    for (const entry of schedule.sectionsTimetable?.[String(state.section)] || []) {
      addEntry(entry, "");
    }
  }

  for (const entries of entriesByDay.values()) {
    entries.sort(
      (a, b) =>
        (a.periods?.[0] || 0) - (b.periods?.[0] || 0) ||
        String(a.subjectId).localeCompare(String(b.subjectId)),
    );
  }

  const week = WEEK_DAYS.map((day) => {
    const entries = entriesByDay.get(day);
    return `<div class="day-col">
      <div class="day-col-head"><strong>${day}</strong><span>${entries.length} حدث</span></div>
      <div class="day-events">${
        entries.length
          ? entries.map((entry) => scheduleEventCard(entry, all)).join("")
          : '<span class="day-empty">لا توجد محاضرات</span>'
      }</div>
    </div>`;
  }).join("");

  const midtermRows = (schedule.midterms || [])
    .map((midterm) => {
      const status = midtermStatus(midterm);
      const meta = schedule.coursesMeta?.[midterm.subjectId];
      return `<tr class="${status.active ? "now-row" : ""}">
        <td><strong>${esc(midterm.subjectName)}</strong>${meta?.code ? `<div class="muted" dir="ltr">${esc(meta.code)}</div>` : ""}</td>
        <td>${esc(midterm.dayAr)}</td>
        <td>${esc(formatDateShort(midterm.date))}</td>
        <td dir="ltr">${esc(midterm.startTime)}–${esc(midterm.endTime)}</td>
        <td>${esc(midterm.venue)}${
          midterm.halls?.length
            ? `<div class="muted">${midterm.halls
                .map((h) => `${esc(h.name)}: <span dir="ltr">${h.pcFrom}–${h.pcTo}</span>`)
                .join(" · ")}</div>`
            : ""
        }</td>
        <td>${(midterm.lecturesInScope || []).length} محاضرة${midterm.scopeNote ? `<div class="muted">${esc(midterm.scopeNote)}</div>` : ""}</td>
        <td>${esc(String(midterm.marks))} درجة${midterm.marksNote ? `<div class="muted">${esc(midterm.marksNote)}</div>` : ""}</td>
        <td><span class="status-pill${status.active ? " active" : ""}">${esc(status.label)}</span></td>
      </tr>`;
    })
    .join("");

  const calendar = (schedule.calendar || [])
    .map((item) => {
      const start = parseDateParts(item.startDate);
      const end = parseDateParts(item.endDate || item.startDate);
      let statusClass = "is-upcoming";
      let statusLabel = "قادم";
      if (!Number.isNaN(end.getTime()) && end < todayMid) {
        statusClass = "is-past";
        statusLabel = "انتهى";
      } else if (
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime()) &&
        start <= todayMid &&
        todayMid <= end
      ) {
        statusClass = "is-current";
        statusLabel = "الآن";
      }
      return `<div class="cal-card ${statusClass}">
        <div class="cal-card-top">
          <strong>${esc(item.title)}</strong>
          <span class="cal-status">${statusLabel}</span>
        </div>
        <span class="cal-dates">${esc(formatRange(item.startDate, item.endDate))}</span>
        ${item.note ? `<span class="cal-note">${esc(item.note)}</span>` : ""}
      </div>`;
    })
    .join("");

  const periods = (schedule.periods || [])
    .map(
      (period) => `<div class="period-card">
        <span class="period-num">${period.id}</span>
        <div>
          <strong>${esc(period.label)}</strong>
          <span class="period-time" dir="ltr">${esc(period.start)} – ${esc(period.end)}</span>
        </div>
      </div>`,
    )
    .join("");

  viewEl.innerHTML = `<div class="feature-page schedule-page">
    <div class="schedule-toolbar">
      <div class="segment">
        <button class="btn btn-sm${!all ? " is-active" : ""}" type="button" data-schedule-all="0">سكشنك فقط</button>
        <button class="btn btn-sm${all ? " is-active" : ""}" type="button" data-schedule-all="1">كل السكاشن</button>
      </div>
      <span class="muted">${all ? "كل السكاشن مع تمييز رقم كل سكشن" : `عرض محاضرات وسكاشن سكشن ${esc(state.section)}`}</span>
    </div>
    <section class="schedule-block" id="sec-week" data-spy-section="week" data-spy-label="جدول الأسبوع">
      <h2>جدول الأسبوع</h2>
      <p>المحاضرات المشتركة تظهر تلقائيًا حسب السكشن المختار.</p>
      <div class="week-grid">${week}</div>
    </section>
    <section class="schedule-block" id="sec-midterms" data-spy-section="midterms" data-spy-label="امتحانات الميدترم">
      <h2>امتحانات الميدترم</h2>
      <p>5 امتحانات إلكترونية — 11:00 إلى 11:30 صباحًا.</p>
      <div class="table-scroll">
        <table class="data-table">
          <thead><tr><th>المادة</th><th>اليوم</th><th>التاريخ</th><th>الوقت</th><th>المكان</th><th>المحاضرات</th><th>الدرجة</th><th>الحالة</th></tr></thead>
          <tbody>${midtermRows}</tbody>
        </table>
      </div>
    </section>
    <section class="schedule-block" id="sec-calendar" data-spy-section="calendar" data-spy-label="الخريطة الزمنية">
      <h2>الخريطة الزمنية للترم</h2>
      <div class="calendar-grid">${calendar}</div>
    </section>
    <section class="schedule-block" id="sec-periods" data-spy-section="periods" data-spy-label="مواعيد الفترات">
      <h2>مواعيد الفترات</h2>
      <p>${withLtrYears(schedule.term)}</p>
      <div class="period-grid">${periods}</div>
    </section>
  </div>`;
}

function examSubtabsHtml(activeTab) {
  const mistakesObj = store.getJson("hub:mistakes", {});
  const mistakesCount =
    mistakesObj && typeof mistakesObj === "object" ? Object.keys(mistakesObj).length : 0;
  return `<div class="exam-subtabs" role="tablist" aria-label="أقسام الامتحانات">
    <a class="exam-subtab${activeTab === "practice" ? " is-active" : ""}" href="#practice" role="tab" aria-selected="${activeTab === "practice"}">
      ${ICONS.question}<span>بنك الأسئلة</span>
    </a>
    <a class="exam-subtab${activeTab === "mistakes" ? " is-active" : ""}" href="#mistakes" role="tab" aria-selected="${activeTab === "mistakes"}">
      ${ICONS.bolt}<span>أخطائي</span>${mistakesCount > 0 ? `<span class="exam-subtab-badge">${mistakesCount}</span>` : ""}
    </a>
  </div><div id="quiz-mount"></div>`;
}

function syncMistakesBadge() {
  const link = document.querySelector('.exam-subtab[href="#mistakes"]');
  if (!link) return;
  const mistakesObj = store.getJson("hub:mistakes", {});
  const count =
    mistakesObj && typeof mistakesObj === "object" ? Object.keys(mistakesObj).length : 0;
  let badge = link.querySelector(".exam-subtab-badge");
  if (!count) {
    badge?.remove();
    return;
  }
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "exam-subtab-badge";
    link.appendChild(badge);
  }
  badge.textContent = String(count);
}

function renderPractice() {
  if (window.HubQuiz) {
    viewEl.innerHTML = examSubtabsHtml("practice");
    window.HubQuiz.renderPractice($("#quiz-mount", viewEl), {
      subjectId: state.practiceSubject || "all",
    });
    return;
  }
  const subject = state.practiceSubject ? subjectById(state.practiceSubject) : null;
  const title = subject ? subject.nameAr : "كل المواد";
  const backId = subject ? subject.id : state.subjectId || defaultSubjectId();
  const chips = state.data.subjects
    .filter((entry) => entry.id !== "midterm-revision")
    .map(
      (entry) =>
        `<a class="chip" href="#practice/${entry.id}" style="--accent:${entry.accent}"><span class="dot" style="background:${entry.accent}"></span>${esc(entry.nameAr)}</a>`,
    )
    .join("");
  viewEl.innerHTML = `<div class="feature-page">
    <div class="feature-hero" style="--accent:${subject?.accent || "#4e8d9c"}">
      <span class="eyebrow">${ICONS.question} بنك الأسئلة والامتحانات التفاعلية</span>
      <h2>اختبر نفسك — ${esc(title)}</h2>
      <p class="feature-sub">محرك الامتحانات التفاعلي قيد التجهيز. سيتم تفعيل وضع التدريب الفوري ومحاكاة الميدترم وبنك الأخطاء قريبًا.</p>
      <div class="feature-actions">
        <a class="btn btn-primary" href="#${esc(backId)}">${ICONS.lecture}<span>العودة للمادة</span></a>
      </div>
      <div class="feature-chips">${chips}</div>
    </div>
    <div class="empty">${ICONS.question}<strong>بنك الأسئلة قيد التجهيز</strong><span>هذه الصفحة ستحتوي على الأسئلة التفاعلية لكل مادة.</span></div>
  </div>`;
}

function renderMistakes() {
  if (window.HubQuiz) {
    viewEl.innerHTML = examSubtabsHtml("mistakes");
    window.HubQuiz.renderMistakes($("#quiz-mount", viewEl), {});
    return;
  }
  viewEl.innerHTML = `<div class="feature-page">
    <div class="feature-hero" style="--accent:#c85f6b">
      <span class="eyebrow">${ICONS.question} بنك أخطائي</span>
      <h2>امتحن في أخطائك فقط</h2>
      <p class="feature-sub">سيتم تسجيل كل سؤال تخطئ فيه هنا مع تكرار الخطأ، ثم يُستبعد بعد الإجابة الصحيحة مرتين.</p>
    </div>
    <div class="empty">${ICONS.bolt}<strong>بنك الأخطاء قيد التجهيز</strong><span>سيتوفر مع محرك الامتحانات التفاعلي.</span></div>
  </div>`;
}

let spyObserver = null;

function setActiveSpy(id) {
  if (!sidebarEl) return;
  sidebarEl.querySelectorAll("[data-spy-target]").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.spyTarget === id);
  });
}

function setupScrollSpy() {
  if (spyObserver) {
    spyObserver.disconnect();
    spyObserver = null;
  }
  const sections = [...viewEl.querySelectorAll("[data-spy-section]")];
  if (!sections.length) return;
  setActiveSpy(sections[0].dataset.spySection);
  if (typeof IntersectionObserver !== "function") return;
  spyObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) {
        setActiveSpy(visible[0].target.dataset.spySection);
      }
    },
    { rootMargin: "-120px 0px -55% 0px", threshold: 0.01 },
  );
  sections.forEach((section) => spyObserver.observe(section));
}

function renderSidebar() {
  if (!sidebarEl || !state.data) return;
  const searching = searchActive() || state.filtersOpen;
  const featureActive = Boolean(state.feature) && !searching;

  const spySections = [...viewEl.querySelectorAll("[data-spy-section]")];
  const currentSubject = !featureActive && !searching ? subjectById(state.subjectId) : null;
  const contextLabel = searching
    ? "البحث والفلاتر"
    : state.feature === "schedule"
      ? "الجدول الدراسي"
      : state.feature === "practice"
        ? "بنك الأسئلة"
        : state.feature === "mistakes"
          ? "بنك أخطائي"
          : currentSubject
            ? currentSubject.nameAr
            : "الصفحة الحالية";

  const tocHtml = spySections.length
    ? `<nav class="sidebar-toc" aria-label="أقسام الصفحة">
        ${spySections
          .map(
            (sec, idx) =>
              `<button type="button" class="sidebar-toc-link${idx === 0 ? " is-active" : ""}" data-spy-target="${esc(sec.dataset.spySection)}">
                <span class="toc-indicator"></span>
                <span>${esc(sec.dataset.spyLabel || sec.dataset.spySection)}</span>
              </button>`,
          )
          .join("")}
      </nav>`
    : `<div class="sidebar-context">${esc(contextLabel)}</div>`;

  sidebarEl.innerHTML = `
    <div class="sidebar-top">
      <div class="sidebar-top-brand">
        <img src="assets/logo.png" alt="" width="34" height="34">
        <div class="sidebar-top-text">
          <strong>محتويات الصفحة</strong>
          <span>${esc(contextLabel)}</span>
        </div>
      </div>
      <button class="icon-btn sidebar-close" type="button" data-sidebar-close aria-label="إغلاق المحتويات">
        <svg viewBox="0 0 24 24" fill="none"><path d="m7 7 10 10M17 7 7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="sidebar-group">
      <div class="sidebar-heading">${spySections.length ? "في هذه الصفحة" : "الصفحة الحالية"}</div>
      ${tocHtml}
    </div>`;
}

const sidebarQuery = window.matchMedia("(min-width: 961px)");

function setSidebarOpen(open, { focus = false } = {}) {
  const persistent = sidebarQuery.matches;
  state.sidebarOpen = persistent ? false : Boolean(open);
  if (sidebarEl) sidebarEl.hidden = persistent ? false : !state.sidebarOpen;
  if (sidebarBackdropEl) sidebarBackdropEl.hidden = persistent ? true : !state.sidebarOpen;
  sidebarToggleEl?.setAttribute("aria-expanded", String(persistent || state.sidebarOpen));
  document.documentElement.classList.toggle("sidebar-open", !persistent && state.sidebarOpen);
  if (!focus || persistent) return;
  if (state.sidebarOpen) sidebarEl?.querySelector("[data-sidebar-close]")?.focus();
  else sidebarToggleEl?.focus();
}

function activeTopMode() {
  const searching = searchActive() || state.filtersOpen;
  if (!searching && state.feature === "schedule") return "schedule";
  if (!searching && (state.feature === "practice" || state.feature === "mistakes")) return "exam";
  return "lectures";
}

function renderModeSwitcher() {
  const mode = activeTopMode();
  if (tabsBarEl) tabsBarEl.hidden = mode !== "lectures";
  if (!modeSwitcherEl) return;
  modeSwitcherEl.querySelectorAll("[data-mode]").forEach((btn) => {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });
}

let pendingMidtermHighlight = false;
let midtermHighlightTimer = 0;

function highlightNearestMidterm() {
  const card = smartStripEl?.querySelector(".midterm-card");
  if (!card || smartStripEl.hidden) return;
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.classList.remove("is-highlighted");
  void card.offsetWidth;
  card.classList.add("is-highlighted");
  window.clearTimeout(midtermHighlightTimer);
  midtermHighlightTimer = window.setTimeout(
    () => card.classList.remove("is-highlighted"),
    2800,
  );
}

function render() {
  renderModeSwitcher();
  renderNotifications();
  renderSmartStrip();
  renderFacets();
  updateSearchPanel();
  if (searchActive()) {
    renderTabs();
    renderSearch(state.query);
    document.title = `نتائج البحث — ${state.data.title}`;
    renderSidebar();
    setupScrollSpy();
    return;
  }
  if (state.feature === "schedule") {
    renderTabs();
    renderSchedule();
    document.title = `الجدول الدراسي — ${state.data.title}`;
    renderSidebar();
    setupScrollSpy();
    if (pendingMidtermHighlight) {
      pendingMidtermHighlight = false;
      window.setTimeout(highlightNearestMidterm, 80);
    }
    return;
  }
  if (state.feature === "practice") {
    renderTabs();
    renderPractice();
    document.title = `بنك الأسئلة — ${state.data.title}`;
    renderSidebar();
    setupScrollSpy();
    return;
  }
  if (state.feature === "mistakes") {
    renderTabs();
    renderMistakes();
    document.title = `بنك أخطائي — ${state.data.title}`;
    renderSidebar();
    setupScrollSpy();
    return;
  }

  const subject = subjectById(state.subjectId) || subjectById(defaultSubjectId());
  if (!subject) return;
  state.subjectId = subject.id;
  renderTabs();

  if (state.renderedSubject !== subject.id) {
    state.renderedSubject = subject.id;
    tabsEl
      .querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }

  renderSubject(subject);
  document.title = `${subject.nameAr} — ${state.data.title}`;
  renderSidebar();
  setupScrollSpy();
}

function parseHash() {
  const rawHash = location.hash.replace(/^#/, "");
  let raw = rawHash;
  try {
    raw = decodeURIComponent(rawHash);
  } catch (error) {
    raw = rawHash;
  }
  if (!raw) return null;
  const [subjectId, sectionId, fileId] = raw.split("/");
  return { subjectId, sectionId, fileId, raw };
}

function clearSearch() {
  resetFacets();
  if (state.query || searchEl.value) {
    searchEl.value = "";
    state.query = "";
  }
}

function route() {
  setSidebarOpen(false);
  window.HubQuiz?.closeSync?.();
  const parsed = parseHash();
  if (!parsed) {
    state.feature = null;
    state.subjectId = defaultSubjectId();
    state.tabsExpanded = false;
    render();
    return;
  }

  if (parsed.raw.indexOf("sync=") === 0) {
    const payload = parsed.raw.slice(5);
    history.replaceState(null, "", location.pathname + location.search + "#mistakes");
    state.feature = "mistakes";
    window.HubQuiz?.reset();
    clearSearch();
    if (!modalEl.hidden) closePreview(false);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.HubQuiz?.openSyncImport(payload);
    return;
  }

  if (parsed.raw === "upload") {
    openUpload();
    return;
  }

  if (parsed.subjectId === "schedule") {
    state.feature = "schedule";
    clearSearch();
    if (!modalEl.hidden) closePreview(false);
    const highlightMidterm = pendingMidtermHighlight;
    render();
    if (!highlightMidterm) window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (parsed.subjectId === "practice") {
    state.feature = "practice";
    state.practiceSubject = parsed.sectionId || null;
    window.HubQuiz?.reset();
    clearSearch();
    if (!modalEl.hidden) closePreview(false);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (parsed.subjectId === "mistakes") {
    state.feature = "mistakes";
    window.HubQuiz?.reset();
    clearSearch();
    if (!modalEl.hidden) closePreview(false);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const subject = state.data.subjects.find((entry) => entry.id === parsed.subjectId);
  if (!subject) {
    state.feature = null;
    state.subjectId = defaultSubjectId();
    render();
    return;
  }

  clearSearch();
  state.feature = null;
  state.subjectId = subject.id;
  state.lastSubject = subject.id;
  state.tabsExpanded = false;
  render();

  if (!parsed.fileId && !modalEl.hidden) closePreview(false);

  if (parsed.sectionId) {
    const sectionEl = viewEl.querySelector(
      `.section[data-section="${CSS.escape(parsed.sectionId)}"]`,
    );
    if (sectionEl) {
      sectionEl.dataset.open = "true";
      sectionEl.querySelector(".section-head")?.setAttribute("aria-expanded", "true");
      if (!parsed.fileId) sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (!parsed.fileId) {
      const fallback =
        parsed.sectionId === "midterm-revision"
          ? viewEl.querySelector(".review-block")
          : parsed.sectionId === "lectures"
            ? viewEl.querySelector(".matrix-wrap")
            : null;
      fallback?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (parsed.fileId) {
    const file = subjectFiles(subject).find(
      (entry) => entry.id === parsed.fileId || entry.path.endsWith(`/${parsed.fileId}`),
    );
    if (file) openPreview(file, { fromDeepLink: true });
  }
}

function navigate(hash) {
  const next = `#${hash}`;
  if (location.hash === next) route();
  else location.hash = next;
}

let tabsExpandTimer;

tabsBarEl.addEventListener("click", (event) => {
  const collector = event.target.closest("[data-collector]");
  if (collector) {
    state.tabsExpanded = true;
    renderTabs();
    const firstOther = [...tabsEl.querySelectorAll(".tab:not(.tab-collector)")].find(
      (button) => button.getAttribute("aria-selected") !== "true",
    );
    firstOther?.focus({ preventScroll: true });
    return;
  }

  const tab = event.target.closest(".tab");
  if (!tab) return;
  state.filtersOpen = false;
  state.tabsExpanded = false;
  clearSearch();
  if (tab.dataset.route) navigate(tab.dataset.route);
  else navigate(tab.dataset.subject);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

function closeFileInfoBubble() {
  const existing = document.getElementById("file-info-bubble");
  if (existing) existing.remove();
  document.querySelectorAll(".act.info-btn.is-open").forEach((btn) => {
    btn.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  });
}

function toggleFileInfoPanel(infoBtn) {
  const existing = document.getElementById("file-info-bubble");
  const isSame = existing && infoBtn.classList.contains("is-open");
  closeFileInfoBubble();
  if (isSame) return;

  const title = infoBtn.dataset.fileTitle || "معلومات عن الملف";
  const infoText = infoBtn.dataset.fileInfo || "";

  const bubble = document.createElement("div");
  bubble.id = "file-info-bubble";
  bubble.className = "file-info-bubble";
  bubble.setAttribute("role", "dialog");
  bubble.setAttribute("aria-label", title);
  bubble.innerHTML = `<div class="file-info-head">
    <span class="file-info-icon">${ICONS.info}</span>
    <strong class="file-info-title">${esc(title)}</strong>
    <button type="button" class="file-info-close" aria-label="إغلاق">×</button>
  </div>
  <p class="file-info-body">${esc(infoText).replace(/\n/g, "<br>")}</p>
  <span class="file-info-arrow" aria-hidden="true"></span>`;

  document.body.appendChild(bubble);
  infoBtn.classList.add("is-open");
  infoBtn.setAttribute("aria-expanded", "true");

  const rect = infoBtn.getBoundingClientRect();
  const bRect = bubble.getBoundingClientRect();
  const gap = 10;
  const pad = 12;

  let top = rect.top - bRect.height - gap;
  let placedBelow = false;
  if (top < pad) {
    top = rect.bottom + gap;
    placedBelow = true;
  }

  let left = rect.left + rect.width / 2 - bRect.width / 2;
  left = Math.max(pad, Math.min(left, window.innerWidth - bRect.width - pad));

  const arrowLeft = Math.max(14, Math.min(rect.left + rect.width / 2 - left, bRect.width - 14));
  const arrowEl = bubble.querySelector(".file-info-arrow");
  arrowEl.style.left = `${arrowLeft}px`;
  if (placedBelow) bubble.classList.add("is-below");

  bubble.style.top = `${Math.round(top)}px`;
  bubble.style.left = `${Math.round(left)}px`;

  const onDocClick = (e) => {
    if (bubble.contains(e.target) && !e.target.closest(".file-info-close")) return;
    if (e.target.closest("[data-file-info]") === infoBtn) return;
    cleanup();
  };
  const onKey = (e) => {
    if (e.key === "Escape") cleanup();
  };
  const onScrollOrResize = () => cleanup();

  const cleanup = () => {
    closeFileInfoBubble();
    document.removeEventListener("click", onDocClick);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("scroll", onScrollOrResize, true);
    window.removeEventListener("resize", onScrollOrResize);
  };

  setTimeout(() => {
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
  }, 0);
}

viewEl.addEventListener("click", (event) => {
  const infoBtn = event.target.closest("[data-file-info]");
  if (infoBtn) {
    event.preventDefault();
    event.stopPropagation();
    toggleFileInfoPanel(infoBtn);
    return;
  }

  const bookmarkBtn = event.target.closest("[data-bookmark-toggle]");
  if (bookmarkBtn) {
    event.preventDefault();
    event.stopPropagation();
    const filePath = bookmarkBtn.dataset.bookmarkToggle;
    toggleBookmark(filePath);
    refreshBookmarkUI(filePath);
    return;
  }

  if (event.target.closest(".study-check, [data-study]")) {
    event.stopPropagation();
    return;
  }

  const resetButton = event.target.closest('[data-facet="reset"]');
  if (resetButton) {
    resetSearchUI();
    return;
  }

  const viewToggle = event.target.closest("[data-view-toggle]");
  if (viewToggle) {
    state.viewMode = state.viewMode === "matrix" ? "classic" : "matrix";
    store.set("hub:viewMode", state.viewMode);
    render();
    return;
  }

  const scheduleToggle = event.target.closest("[data-schedule-all]");
  if (scheduleToggle) {
    state.scheduleAll = scheduleToggle.dataset.scheduleAll === "1";
    render();
    return;
  }

  const head = event.target.closest(".section-head");
  if (head && !event.target.closest("a")) {
    const section = head.closest(".section");
    const open = section.dataset.open !== "true";
    section.dataset.open = String(open);
    head.setAttribute("aria-expanded", String(open));
    store.set(`section:${section.dataset.section}`, open ? "open" : "closed");
    return;
  }

  const previewBtn = event.target.closest(".preview");
  if (previewBtn) {
    const row = previewBtn.closest(".file");
    const subject = state.data.subjects.find((entry) => entry.id === row.dataset.subject);
    const file = subject && subjectFiles(subject).find((entry) => entry.path === row.dataset.file);
    if (file) openPreview(file);
    return;
  }

  const row = event.target.closest(".file");
  if (row && !event.target.closest("a")) {
    const wantsDownload = Boolean(event.target.closest(".dl-pill"));
    if (wantsDownload || !isMobileView()) {
      downloadRow(row);
      return;
    }
    const subject = state.data.subjects.find((entry) => entry.id === row.dataset.subject);
    const file =
      subject && subjectFiles(subject).find((entry) => entry.path === row.dataset.file);
    if (file) openPreview(file);
  }
});

viewEl.addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-study]");
  if (!checkbox) return;
  const key = checkbox.dataset.study;
  const subjectId = key.split(":")[0];
  const studied = getStudied();
  if (checkbox.checked) studied[key] = true;
  else delete studied[key];
  store.setJson("hub:studied", studied);
  const row = checkbox.closest(".matrix-row, .file");
  if (row) row.classList.toggle("is-studied", checkbox.checked);
  updateStudyProgress(subjectId);
});

viewEl.addEventListener("keydown", (event) => {
  const head = event.target.closest?.('.section-head[role="button"]');
  if (head && event.target === head && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    head.click();
    return;
  }
  const row = event.target.closest?.(".file");
  if (!row || event.target !== row) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    if (!isMobileView()) {
      downloadRow(row);
      return;
    }
    const subject = state.data.subjects.find((entry) => entry.id === row.dataset.subject);
    const file =
      subject && subjectFiles(subject).find((entry) => entry.path === row.dataset.file);
    if (file) openPreview(file);
  }
});

let searchTimer;
searchEl.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.query = searchEl.value;
    render();
  }, 90);
});

searchEl.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    resetSearchUI();
  }
});

facetsEl?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-facet]");
  if (!button) return;
  if (button.dataset.facet === "reset") {
    resetSearchUI();
    return;
  }
  if (button.dataset.facet === "close") {
    state.filtersOpen = false;
    render();
    return;
  }
  state.facets[button.dataset.facet] = button.dataset.value;
  render();
});

searchToggleEl?.addEventListener("click", () => {
  if (!searchPanelEl?.hidden) {
    state.searchOpen = false;
    closeSearch();
    return;
  }
  openSearch();
});

filterToggleEl?.addEventListener("click", () => {
  state.filtersOpen = !state.filtersOpen;
  state.searchOpen = true;
  render();
});

sidebarToggleEl?.addEventListener("click", () => {
  setSidebarOpen(!state.sidebarOpen, { focus: true });
});

sidebarBackdropEl?.addEventListener("click", () => {
  setSidebarOpen(false, { focus: true });
});

sidebarEl?.addEventListener("click", (event) => {
  if (event.target.closest("[data-sidebar-close]")) {
    setSidebarOpen(false, { focus: true });
    return;
  }
  const spyBtn = event.target.closest("[data-spy-target]");
  if (spyBtn) {
    setSidebarOpen(false);
    const el = viewEl.querySelector(`[data-spy-section="${CSS.escape(spyBtn.dataset.spyTarget)}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
      setActiveSpy(spyBtn.dataset.spyTarget);
    }
  }
});

modeSwitcherEl?.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-mode]");
  if (!btn) return;
  const mode = btn.dataset.mode;
  state.filtersOpen = false;
  clearSearch();
  if (mode === "lectures") {
    navigate(state.lastSubject || defaultSubjectId());
  } else if (mode === "schedule") {
    navigate("schedule");
  } else if (mode === "exam") {
    navigate("practice");
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
});

tabsPrevEl?.addEventListener("click", () => {
  tabsEl?.scrollBy({ left: 220, behavior: "smooth" });
});

tabsNextEl?.addEventListener("click", () => {
  tabsEl?.scrollBy({ left: -220, behavior: "smooth" });
});

window.addEventListener("resize", updateTabsScrollButtons);

sidebarQuery.addEventListener("change", () => {
  setSidebarOpen(false);
  updateTabsScrollButtons();
});

sectionPickerEl?.addEventListener("change", (event) => {
  const value = String(event.target.value);
  if (!SECTION_VALUES.includes(value)) return;
  state.section = value;
  store.set("hub:mySection", value);
  render();
});

document.addEventListener("keydown", (event) => {
  const typing = /^(input|textarea)$/i.test(document.activeElement?.tagName || "");
  if (event.key === "/" && !typing) {
    event.preventDefault();
    openSearch();
  }
  if (event.key === "Escape" && state.sidebarOpen) setSidebarOpen(false, { focus: true });
  if (event.key === "Escape" && !modalEl.hidden) closePreview();
  if (event.key === "Escape" && !uploadEl.hidden) closeUpload();
  if (
    event.key === "Escape" &&
    modalEl.hidden &&
    uploadEl.hidden &&
    !state.sidebarOpen &&
    (state.searchOpen || searchActive() || state.filtersOpen)
  ) {
    closeSearch();
  }
});

document.addEventListener("click", (event) => {
  if (!state.searchOpen || searchActive() || state.filtersOpen) return;
  if (event.target.closest(".search-panel, #search-toggle")) return;
  state.searchOpen = false;
  updateSearchPanel();
});

function isMobileView() {
  return (
    window.matchMedia("(max-width: 860px)").matches ||
    window.matchMedia("(hover: none)").matches
  );
}

const PDFJS_MODULE_URL = new URL("assets/pdfjs/pdf.min.js", document.baseURI).href;
const PDFJS_WORKER_URL = new URL("assets/pdfjs/pdf.worker.min.js", document.baseURI).href;
const PDF_ZOOM_MIN = 0.5;
const PDF_ZOOM_MAX = 4;
const PDF_ZOOM_STEP = 1.25;
const PDF_LAZY_MARGIN = 600;

let pdfjsPromise = null;
let pdfViewer = null;

function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import(PDFJS_MODULE_URL).then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      return pdfjs;
    });
    pdfjsPromise.catch(() => {
      pdfjsPromise = null;
    });
  }
  return pdfjsPromise;
}

function shouldUsePdfJsViewer() {
  return isMobileView() || navigator.pdfViewerEnabled === false;
}

function pdfViewerMarkup() {
  return `<div class="pdf-viewer" data-pdf-viewer>
    <div class="pdf-toolbar">
      <div class="pdf-zoom-group" role="group" aria-label="تكبير وتصغير">
        <button class="pdf-tool-btn" type="button" data-pdf-zoom="out" aria-label="تصغير">−</button>
        <button class="pdf-zoom-label" type="button" data-pdf-zoom="fit" aria-label="ملاءمة العرض">ملاءمة العرض</button>
        <button class="pdf-tool-btn" type="button" data-pdf-zoom="in" aria-label="تكبير">+</button>
      </div>
      <span class="pdf-page-indicator" data-pdf-page>صفحة 1 / 1</span>
      <span class="pdf-loading" data-pdf-loading>جارٍ تحميل الملف…</span>
    </div>
    <div class="pdf-scroll" data-pdf-scroll>
      <div class="pdf-pages" data-pdf-pages></div>
    </div>
  </div>`;
}

function pdfFallbackMarkup(file, message) {
  return `<div class="pdf-fallback">
    <span class="pdf-fallback-badge">PDF</span>
    <strong>${esc(file.title)}</strong>
    <span>${esc(message)}</span>
    <div class="pdf-fallback-actions">
      <a class="btn btn-primary" href="${esc(file.path)}" target="_blank" rel="noopener">فتح في تبويب جديد</a>
      <a class="btn" href="${esc(file.path)}" download>تحميل الملف</a>
    </div>
  </div>`;
}

function teardownPdfViewer() {
  if (!pdfViewer) return;
  const viewer = pdfViewer;
  pdfViewer = null;
  try {
    viewer.observer?.disconnect();
  } catch (error) {
    void error;
  }
  try {
    viewer.resizeObserver?.disconnect();
  } catch (error) {
    void error;
  }
  for (const task of viewer.renderTasks || []) {
    try {
      task.cancel();
    } catch (error) {
      void error;
    }
  }
  viewer.renderTasks?.clear();
  try {
    viewer.task?.destroy();
  } catch (error) {
    void error;
  }
  try {
    viewer.doc?.destroy();
  } catch (error) {
    void error;
  }
  window.clearTimeout(viewer.resizeTimer);
  window.cancelAnimationFrame(viewer.scrollFrame);
}

function pdfFitScale(session, index) {
  const available = Math.max(120, session.scrollEl.clientWidth - 28);
  const width = session.dims[index]?.width || 612;
  return available / width;
}

function pdfScaleKey(session, index) {
  return (pdfFitScale(session, index) * session.zoom).toFixed(4);
}

function updatePdfZoomLabel(session) {
  if (!session.zoomLabelEl) return;
  session.zoomLabelEl.textContent =
    session.zoom === 1 ? "ملاءمة العرض" : `${Math.round(session.zoom * 100)}%`;
}

function layoutPdfPages(session) {
  session.slots.forEach((slot, index) => {
    const dim = session.dims[index];
    slot.style.width = `${Math.round(dim.width * pdfFitScale(session, index) * session.zoom)}px`;
    slot.style.height = `${Math.round(dim.height * pdfFitScale(session, index) * session.zoom)}px`;
  });
  updatePdfZoomLabel(session);
}

function clearPdfCanvases(session) {
  for (const task of session.renderTasks) {
    try {
      task.cancel();
    } catch (error) {
      void error;
    }
  }
  session.renderTasks.clear();
  for (const slot of session.slots) {
    slot.querySelector("canvas")?.remove();
    slot.dataset.renderedScale = "";
    slot.dataset.rendering = "";
    slot.classList.remove("is-rendered", "is-error");
  }
}

function pdfAnchor(session) {
  const rootTop = session.scrollEl.getBoundingClientRect().top;
  for (let index = 0; index < session.slots.length; index += 1) {
    const rect = session.slots[index].getBoundingClientRect();
    if (rect.bottom > rootTop + 1) {
      const ratio = Math.min(1, Math.max(0, (rootTop - rect.top) / Math.max(1, rect.height)));
      return { index, ratio };
    }
  }
  return { index: 0, ratio: 0 };
}

function restorePdfAnchor(session, anchor) {
  const slot = session.slots[anchor.index];
  if (!slot) return;
  const rootTop = session.scrollEl.getBoundingClientRect().top;
  const slotTop = slot.getBoundingClientRect().top;
  session.scrollEl.scrollTop += slotTop - rootTop + anchor.ratio * slot.offsetHeight;
}

function relayoutPdfPages(session) {
  if (!session.slots.length) return;
  const anchor = pdfAnchor(session);
  clearPdfCanvases(session);
  layoutPdfPages(session);
  renderPdfVisible(session);
  restorePdfAnchor(session, anchor);
  updatePdfPageIndicator(session);
}

function changePdfZoom(session, action) {
  let next = session.zoom;
  if (action === "in") next *= PDF_ZOOM_STEP;
  else if (action === "out") next /= PDF_ZOOM_STEP;
  else next = 1;
  next = Math.min(PDF_ZOOM_MAX, Math.max(PDF_ZOOM_MIN, Math.round(next * 100) / 100));
  if (next === session.zoom) return;
  session.zoom = next;
  relayoutPdfPages(session);
}

async function renderPdfPage(session, index) {
  if (pdfViewer !== session) return;
  const slot = session.slots[index];
  if (!slot || slot.dataset.rendering === "1") return;
  const scaleKey = pdfScaleKey(session, index);
  if (slot.dataset.renderedScale === scaleKey) return;
  slot.dataset.rendering = "1";
  try {
    const page = await session.doc.getPage(index + 1);
    if (pdfViewer !== session) return;
    const scale = pdfFitScale(session, index) * session.zoom;
    const viewport = page.getViewport({ scale });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width * dpr));
    canvas.height = Math.max(1, Math.floor(viewport.height * dpr));
    canvas.setAttribute("aria-label", `صفحة ${index + 1}`);
    const context = canvas.getContext("2d", { alpha: false });
    const renderTask = page.render({
      canvasContext: context,
      viewport,
      transform: dpr === 1 ? null : [dpr, 0, 0, dpr, 0, 0],
    });
    session.renderTasks.add(renderTask);
    try {
      await renderTask.promise;
    } finally {
      session.renderTasks.delete(renderTask);
    }
    if (pdfViewer !== session) return;
    if (scaleKey !== pdfScaleKey(session, index)) return;
    slot.querySelector("canvas")?.remove();
    slot.replaceChildren(canvas);
    slot.dataset.renderedScale = scaleKey;
    slot.classList.add("is-rendered");
    slot.classList.remove("is-error");
  } catch (error) {
    if (error?.name !== "RenderingCancelledException" && pdfViewer === session) {
      slot.classList.add("is-error");
    }
  } finally {
    slot.dataset.rendering = "";
  }
}

function renderPdfVisible(session) {
  const rootRect = session.scrollEl.getBoundingClientRect();
  session.slots.forEach((slot, index) => {
    const rect = slot.getBoundingClientRect();
    if (rect.bottom >= rootRect.top - PDF_LAZY_MARGIN && rect.top <= rootRect.bottom + PDF_LAZY_MARGIN) {
      renderPdfPage(session, index);
    }
  });
}

function buildPdfPages(session) {
  const fragment = document.createDocumentFragment();
  session.slots = session.dims.map((dim, index) => {
    const slot = document.createElement("div");
    slot.className = "pdf-page-slot";
    slot.dataset.pageIndex = String(index);
    slot.dataset.pageLabel = `صفحة ${index + 1}`;
    slot.setAttribute("aria-label", `صفحة ${index + 1}`);
    slot.style.setProperty("--pdf-aspect", `${dim.width} / ${dim.height}`);
    fragment.appendChild(slot);
    return slot;
  });
  session.pagesEl.replaceChildren(fragment);
  layoutPdfPages(session);
}

function updatePdfPageIndicator(session) {
  if (!session.pageEl || !session.slots.length) return;
  const rootRect = session.scrollEl.getBoundingClientRect();
  const target = rootRect.top + rootRect.height * 0.35;
  let current = 0;
  for (let index = 0; index < session.slots.length; index += 1) {
    const rect = session.slots[index].getBoundingClientRect();
    if (rect.bottom >= target) {
      current = index;
      break;
    }
    current = index;
  }
  session.pageEl.textContent = `صفحة ${current + 1} / ${session.slots.length}`;
}

function observePdfPages(session) {
  session.observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        renderPdfPage(session, Number(entry.target.dataset.pageIndex));
      }
    },
    { root: session.scrollEl, rootMargin: `${PDF_LAZY_MARGIN}px 0px`, threshold: 0.01 },
  );
  session.slots.forEach((slot) => session.observer.observe(slot));
  session.scrollEl.addEventListener(
    "scroll",
    () => {
      if (session.scrollFrame) return;
      session.scrollFrame = window.requestAnimationFrame(() => {
        session.scrollFrame = 0;
        updatePdfPageIndicator(session);
      });
    },
    { passive: true },
  );
  if ("ResizeObserver" in window) {
    session.resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(session.resizeTimer);
      session.resizeTimer = window.setTimeout(() => {
        if (pdfViewer === session) relayoutPdfPages(session);
      }, 180);
    });
    session.resizeObserver.observe(session.scrollEl);
  }
}

async function openPdfViewer(file, body) {
  const session = {
    token: Symbol("pdf-viewer"),
    task: null,
    doc: null,
    observer: null,
    resizeObserver: null,
    renderTasks: new Set(),
    scrollEl: body.querySelector("[data-pdf-scroll]"),
    pagesEl: body.querySelector("[data-pdf-pages]"),
    pageEl: body.querySelector("[data-pdf-page]"),
    loadingEl: body.querySelector("[data-pdf-loading]"),
    zoomLabelEl: body.querySelector("[data-pdf-zoom='fit']"),
    zoom: 1,
    dims: [],
    slots: [],
    scrollFrame: 0,
    resizeTimer: 0,
  };
  if (!session.scrollEl || !session.pagesEl) return;
  pdfViewer = session;

  body.querySelector("[data-pdf-viewer]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-pdf-zoom]");
    if (!button || pdfViewer !== session) return;
    changePdfZoom(session, button.dataset.pdfZoom);
  });

  const fail = (message) => {
    if (pdfViewer !== session) return;
    teardownPdfViewer();
    body.innerHTML = pdfFallbackMarkup(file, message);
  };

  try {
    const pdfjs = await loadPdfJs();
    if (pdfViewer !== session) return;
    const loadingTask = pdfjs.getDocument({ url: file.path });
    session.task = loadingTask;
    const doc = await loadingTask.promise;
    if (pdfViewer !== session) {
      doc.destroy();
      return;
    }
    session.doc = doc;

    const dims = [];
    for (let index = 0; index < doc.numPages; index += 1) {
      const page = await doc.getPage(index + 1);
      if (pdfViewer !== session) return;
      const viewport = page.getViewport({ scale: 1 });
      dims.push({ width: viewport.width, height: viewport.height });
    }
    if (pdfViewer !== session) return;
    session.dims = dims;
    buildPdfPages(session);
    if (session.loadingEl) session.loadingEl.hidden = true;
    observePdfPages(session);
    renderPdfVisible(session);
    updatePdfPageIndicator(session);
  } catch (error) {
    if (error?.name === "AbortException" || error?.name === "RenderingCancelledException") return;
    console.warn("PDF.js viewer failed", error);
    fail("تعذّر عرض الملف داخل الموقع. يمكنك فتحه في تبويب جديد أو تحميله.");
  }
}

function renderMarkdownInline(text) {
  let out = esc(text);
  const codeSpans = [];
  out = out.replace(/`([^`]+)`/g, (_, code) => {
    const idx = codeSpans.length;
    codeSpans.push(`<code>${code}</code>`);
    return `\u0000CODE${idx}\u0000`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  out = out.replace(/\u0000CODE(\d+)\u0000/g, (_, idx) => codeSpans[Number(idx)] || "");
  return out;
}

function renderMarkdownToHtml(source) {
  const lines = String(source || "").replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      const codeLines = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(esc(lines[i]));
        i += 1;
      }
      i += 1;
      out.push(`<pre class="md-code"><code>${codeLines.join("\n")}</code></pre>`);
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      out.push("<hr>");
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level}>${renderMarkdownInline(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*[-:]+/.test(lines[i + 1])) {
      const parseRow = (row) =>
        row
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((cell) => cell.trim());
      const headers = parseRow(line);
      i += 2;
      const bodyRows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        bodyRows.push(parseRow(lines[i]));
        i += 1;
      }
      out.push(
        `<div class="md-table-wrap"><table><thead><tr>${headers
          .map((h) => `<th>${renderMarkdownInline(h)}</th>`)
          .join("")}</tr></thead><tbody>${bodyRows
          .map(
            (r) =>
              `<tr>${r.map((c) => `<td>${renderMarkdownInline(c)}</td>`).join("")}</tr>`,
          )
          .join("")}</tbody></table></div>`,
      );
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(`<li>${renderMarkdownInline(lines[i].replace(/^\s*[-*]\s+/, ""))}</li>`);
        i += 1;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${renderMarkdownInline(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>`);
        i += 1;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    if (line.trim().startsWith(">")) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(renderMarkdownInline(lines[i].replace(/^\s*>\s?/, "")));
        i += 1;
      }
      out.push(`<blockquote>${quoteLines.join("<br>")}</blockquote>`);
      continue;
    }

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,4}\s|---+|\s*[-*]\s|\s*\d+\.\s|\s*>|```)/.test(lines[i])
    ) {
      para.push(renderMarkdownInline(lines[i]));
      i += 1;
    }
    out.push(`<p>${para.join(" ")}</p>`);
  }

  return out.join("\n");
}

function openPreview(file, options = {}) {
  const ext = (file.ext || "").toLowerCase();
  teardownPdfViewer();

  $("#modal-title").textContent = file.title;
  $("#modal-badge").textContent = (file.ext || "file").toUpperCase();
  $("#modal-badge").className = `file-badge ${file.ext || ""}`;
  $("#modal-download").href = file.path;
  $("#modal-download").setAttribute("download", "");
  $("#modal-download").hidden = false;
  $("#modal-open").href = file.path;
  $("#modal-open").hidden = false;

  const body = $("#modal-body");
  const usePdfJs = ext === "pdf" && shouldUsePdfJsViewer();

  if (ext === "pdf") {
    body.innerHTML = usePdfJs
      ? pdfViewerMarkup()
      : `<iframe src="${esc(file.path)}#view=FitH" title="${esc(file.title)}"></iframe>`;
  } else if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
    body.innerHTML = `<img src="${esc(file.path)}" alt="${esc(file.title)}" style="height:100%;width:100%;object-fit:contain">`;
  } else if (ext === "md") {
    body.innerHTML = `<div class="md-preview-wrap"><p>جارٍ التحميل…</p></div>`;
    fetch(file.path)
      .then((response) => {
        if (!response.ok) throw new Error("fetch failed");
        return response.text();
      })
      .then((text) => {
        body.innerHTML = `<div class="md-preview-wrap"><article class="md-preview" dir="ltr">${renderMarkdownToHtml(text)}</article></div>`;
      })
      .catch(() => {
        body.innerHTML = note("تعذّر قراءة الملف", "يمكنك تحميله بدلًا من ذلك.", "file");
      });
  } else if (ext === "txt") {
    body.innerHTML = `<pre>جارٍ التحميل…</pre>`;
    fetch(file.path)
      .then((response) => response.text())
      .then((text) => {
        body.innerHTML = `<pre>${esc(text)}</pre>`;
      })
      .catch(() => {
        body.innerHTML = note("تعذّر قراءة الملف", "يمكنك تحميله بدلًا من ذلك.", "file");
      });
  } else {
    body.innerHTML = note(
      "لا تتوفّر معاينة لهذا النوع",
      "نزّل الملف لفتحه في Office أو أي تطبيق مناسب.",
      "file",
    );
  }

  modalEl.hidden = false;
  document.documentElement.style.overflow = "hidden";
  if (usePdfJs) openPdfViewer(file, body);
}

function openYouTubeEmbed(videoId, startSeconds = 0, title = "") {
  if (!videoId) return;
  teardownPdfViewer();
  $("#modal-title").textContent = title || "مشاهدة الشرح";
  $("#modal-badge").textContent = "YouTube";
  $("#modal-badge").className = "file-badge";
  $("#modal-download").hidden = true;
  const openLink = $("#modal-open");
  openLink.hidden = false;
  openLink.href = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  const body = $("#modal-body");
  body.innerHTML = `<div class="yt-embed-frame"><iframe src="${esc(buildYouTubeEmbedUrl(videoId, startSeconds))}" title="${esc(title || "YouTube")}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>`;
  modalEl.hidden = false;
  document.documentElement.style.overflow = "hidden";
}

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

viewEl.addEventListener("click", (event) => {
  const ytBtn = event.target.closest("[data-yt-embed]");
  if (!ytBtn) return;
  openYouTubeEmbed(
    ytBtn.dataset.ytEmbed,
    Number(ytBtn.dataset.ytStart || 0),
    ytBtn.dataset.ytTitle || "",
  );
});

function note(title, message, icon) {
  return `<div class="modal-note">${ICONS[icon] || ICONS.file}<strong>${esc(title)}</strong><span>${esc(message)}</span></div>`;
}

function closePreview(navigateBack = true) {
  teardownPdfViewer();
  modalEl.hidden = true;
  $("#modal-body").innerHTML = "";
  document.documentElement.style.overflow = "";
  if (navigateBack && parseHash()?.fileId) navigate(state.subjectId || defaultSubjectId());
}

modalEl.addEventListener("click", (event) => {
  if (event.target.closest("[data-close]")) closePreview();
});

function openUpload() {
  uploadEl.hidden = false;
  document.documentElement.style.overflow = "hidden";
}

function closeUpload() {
  uploadEl.hidden = true;
  document.documentElement.style.overflow = "";
  if (location.hash === "#upload") navigate(state.subjectId || defaultSubjectId());
}

uploadEl.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-upload]")) closeUpload();
});

function setFooter() {
  $("#site-title").textContent = state.data.title;
  $("#site-subtitle").textContent = state.data.subtitle;
}

window.addEventListener("hub:mistakes-updated", syncMistakesBadge);
window.addEventListener("hub:bookmarks-updated", (event) => {
  if (event.detail?.source === "ui") return;
  render();
});
window.addEventListener("hashchange", route);

notifToggleEl?.addEventListener("click", (event) => {
  event.stopPropagation();
  setNotifOpen(!state.notifOpen);
});

notifPanelEl?.addEventListener("click", async (event) => {
  const readAllBtn = event.target.closest("[data-notif-read-all]");
  if (readAllBtn) {
    markAllNotifsSeen(buildNotifications());
    renderNotifications();
    return;
  }

  const browserBtn = event.target.closest("[data-notif-browser]");
  if (browserBtn && "Notification" in window) {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      store.set(NOTIF_BROWSER_KEY, "1");
      maybeSendBrowserNotifications();
    }
    renderNotifications();
    return;
  }

  const itemLink = event.target.closest(".notif-item[data-notif-id]");
  if (itemLink) {
    markNotifSeen(itemLink.dataset.notifId);
    setNotifOpen(false);
    renderNotifications();
  }
});

document.addEventListener("click", (event) => {
  if (state.notifOpen && notifWrapEl && !notifWrapEl.contains(event.target)) {
    setNotifOpen(false);
  }
});

function hideExamNews() {
  if (!examNewsEl || examNewsEl.hidden) return;
  examNewsEl.classList.add("is-leaving");
  window.setTimeout(() => {
    examNewsEl.hidden = true;
    examNewsEl.classList.remove("is-leaving");
  }, 200);
}

function activeExamNewsWindow(now = new Date()) {
  for (const midterm of state.schedule?.midterms || []) {
    const examStart = parseDateTime(midterm.date, midterm.startTime);
    if (Number.isNaN(examStart.getTime())) continue;
    const windowStart = new Date(
      examStart.getFullYear(),
      examStart.getMonth(),
      examStart.getDate() - 1,
      20,
      0,
      0,
      0,
    );
    if (now >= windowStart && now <= examStart) {
      return { id: `${midterm.subjectId}-${midterm.date}`, midterm };
    }
  }
  return null;
}

function syncExamNewsVisibility() {
  if (!examNewsEl) return;
  const active = activeExamNewsWindow();
  if (!active) {
    examNewsEl.hidden = true;
    return;
  }
  const seen = new Set(store.getJson(EXAM_NEWS_SEEN_KEY, []));
  if (seen.has(active.id)) {
    examNewsEl.hidden = true;
    return;
  }
  examNewsEl.hidden = false;
  seen.add(active.id);
  store.setJson(EXAM_NEWS_SEEN_KEY, Array.from(seen).slice(-30));
}

function navigateToMidterm() {
  pendingMidtermHighlight = true;
  navigate("schedule");
}

examNewsLinkEl?.addEventListener("click", (event) => {
  event.preventDefault();
  navigateToMidterm();
});

examNewsEl?.addEventListener("click", (event) => {
  if (event.target.closest(".exam-news-close") || event.target.closest("a")) return;
  navigateToMidterm();
});

examNewsCloseEl?.addEventListener("click", hideExamNews);
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (state.notifOpen) {
    setNotifOpen(false);
    return;
  }
  if (examNewsEl && !examNewsEl.hidden) hideExamNews();
});

async function loadData() {
  if (location.protocol !== "file:") {
    try {
      const response = await fetch("data/subjects.json", { cache: "no-store" });
      if (response.ok) return await response.json();
    } catch (error) {
      console.warn("manifest fetch failed, using embedded copy", error);
    }
  }
  if (window.__SITE_DATA__) return window.__SITE_DATA__;
  throw new Error("no manifest available");
}

(async function boot() {
  themeInit();
  initSection();
  renderSectionPicker();

  try {
    state.data = await loadData();
  } catch (error) {
    viewEl.innerHTML = `<div class="empty">
      ${ICONS.file}
      <strong>تعذّر تحميل قائمة الملفات</strong>
      <span>شغّل الموقع من سيرفر محلي: <code>python -m http.server 8080</code></span>
    </div>`;
    return;
  }

  state.schedule = window.__SITE_SCHEDULE__ || null;
  state.questions = window.__SITE_QUESTIONS__ || {};
  window.HubQuiz?.init({ banks: state.questions, subjects: state.data.subjects });
  buildSearchIndex();
  setFooter();
  route();
  syncExamNewsVisibility();
  maybeSendBrowserNotifications();

  const topbar = document.querySelector(".topbar");
  const onScroll = () => topbar.classList.toggle("is-stuck", window.scrollY > 4);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
