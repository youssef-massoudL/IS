(function () {
  "use strict";

  var ICONS = {
    question:
      '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.6 2.3c-.7.4-1.2 1-1.2 1.9v.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none"><path d="M13 2 5 13.5h5.5L10 22l8-11.5h-5.5L13 2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    clock:
      '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6"/><path d="M12 7.5V12l3 1.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" fill="none"><path d="m5 12.5 4.4 4.4L19 7.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    download:
      '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4v10m0 0 3.5-3.5M12 14l-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 18.5h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    upload:
      '<svg viewBox="0 0 24 24" fill="none"><path d="M12 20V10m0 0 3.5 3.5M12 10l-3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 5.5h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none"><path d="M8.5 5.5v13l10-6.5-10-6.5Z" fill="currentColor"/></svg>',
    trash:
      '<svg viewBox="0 0 24 24" fill="none"><path d="M4.5 7h15M9 7V4.5h6V7M6.5 7l.8 12.5h9.4L17.5 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    trophy:
      '<svg viewBox="0 0 24 24" fill="none"><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" stroke="currentColor" stroke-width="1.6"/><path d="M8 6H4.5v2A3.5 3.5 0 0 0 8 11.5M16 6h3.5v2A3.5 3.5 0 0 1 16 11.5M12 13v4M8.5 20h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none"><path d="M19 12H5m0 0 6-6m-6 6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14m0 0-6-6m6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  var esc = function (value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  };

  var store = {
    getJson: function (key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (error) {
        return fallback;
      }
    },
    setJson: function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        return false;
      }
    },
    remove: function (key) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        return;
      }
    },
  };

  var MISTAKES_KEY = "hub:mistakes";
  var CONFIG_KEY = "hub:quizConfig";
  var MAX_LECTURE = 7;
  var PASS_MARK = 50;

  var banks = {};
  var subjects = [];
  var questionById = {};
  var ui = {
    container: null,
    kind: null,
    subjectId: null,
    screen: "builder",
    config: null,
    session: null,
    message: "",
    mastered: 0,
    mistakesFilter: "all",
  };
  var timerId = null;

  var DIFFICULTY_LABELS = { all: "كل المستويات", easy: "سهل", medium: "متوسط", hard: "صعب" };
  var MODE_LABELS = { practice: "تدريب فوري", timed: "محاكاة ميدترم" };
  var COUNT_LABELS = { 10: "10", 20: "20", 30: "30", 50: "50", all: "الكل" };

  function defaultConfig() {
    return { difficulty: "all", mode: "practice", count: 20, shuffle: true, lectures: [] };
  }

  function init(options) {
    banks = (options && options.banks) || {};
    subjects = ((options && options.subjects) || []).filter(function (subject) {
      return subject.id !== "midterm-revision";
    });
    questionById = {};
    Object.keys(banks).forEach(function (subjectId) {
      var bank = banks[subjectId];
      var list = Array.isArray(bank) ? bank : Array.isArray(bank && bank.questions) ? bank.questions : [];
      list.forEach(function (question) {
        questionById[question.id] = question;
      });
    });
    ui.config = store.getJson(CONFIG_KEY, defaultConfig());
    if (!ui.config || typeof ui.config !== "object") ui.config = defaultConfig();
    ui.config = Object.assign(defaultConfig(), ui.config);
  }

  function subjectById(id) {
    return (
      subjects.find(function (subject) {
        return subject.id === id;
      }) || null
    );
  }

  function bankFor(subjectId) {
    var bank = banks[subjectId];
    return Array.isArray(bank) ? bank : Array.isArray(bank && bank.questions) ? bank.questions : [];
  }

  function allQuestions() {
    var list = [];
    subjects.forEach(function (subject) {
      list = list.concat(bankFor(subject.id));
    });
    return list;
  }

  function lecturesFor(subjectId) {
    var source = subjectId === "all" ? allQuestions() : bankFor(subjectId);
    var values = {};
    source.forEach(function (question) {
      if (question && question.lecture) values[question.lecture] = true;
    });
    return Object.keys(values)
      .map(Number)
      .sort(function (a, b) {
        return a - b;
      });
  }

  function poolFor(subjectId, config) {
    var source = subjectId === "all" ? allQuestions() : bankFor(subjectId);
    var lectures = Array.isArray(config.lectures) ? config.lectures : [];
    return source.filter(function (question) {
      if (!question || !question.id) return false;
      if (lectures.length && lectures.indexOf(Number(question.lecture)) === -1) return false;
      if (config.difficulty !== "all" && question.difficulty !== config.difficulty) return false;
      return true;
    });
  }

  function shuffle(list) {
    var result = list.slice();
    for (var index = result.length - 1; index > 0; index -= 1) {
      var swap = Math.floor(Math.random() * (index + 1));
      var value = result[index];
      result[index] = result[swap];
      result[swap] = value;
    }
    return result;
  }

  function examKey(subjectId) {
    return "hub:examState:" + subjectId;
  }

  function getMistakes() {
    var value = store.getJson(MISTAKES_KEY, {});
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function saveMistakes(value) {
    store.setJson(MISTAKES_KEY, value);
  }

  function getMistakeQuestion(id) {
    return questionById[id] || null;
  }

  function mistakeEntries() {
    var mistakes = getMistakes();
    return Object.keys(mistakes)
      .map(function (id) {
        var entry = mistakes[id];
        var question = getMistakeQuestion(id);
        if (!question) return null;
        return {
          id: id,
          wrongCount: Number(entry.wrongCount) || 1,
          correctStreak: Number(entry.correctStreak) || 0,
          lastAt: entry.lastAt || "",
          question: question,
          subjectId: entry.subjectId || question.subjectId,
          lecture: entry.lecture || question.lecture,
        };
      })
      .filter(Boolean)
      .sort(function (a, b) {
        return String(b.lastAt).localeCompare(String(a.lastAt));
      });
  }

  function recordWrong(question) {
    var mistakes = getMistakes();
    var existing = mistakes[question.id] || {};
    mistakes[question.id] = {
      wrongCount: (Number(existing.wrongCount) || 0) + 1,
      correctStreak: 0,
      firstAt: existing.firstAt || new Date().toISOString(),
      lastAt: new Date().toISOString(),
      subjectId: question.subjectId,
      lecture: question.lecture,
    };
    saveMistakes(mistakes);
  }

  function recordCorrect(question) {
    var mistakes = getMistakes();
    var existing = mistakes[question.id];
    if (!existing) return false;
    existing.correctStreak = (Number(existing.correctStreak) || 0) + 1;
    existing.lastAt = new Date().toISOString();
    if (existing.correctStreak >= 2) {
      delete mistakes[question.id];
      saveMistakes(mistakes);
      return true;
    }
    saveMistakes(mistakes);
    return false;
  }

  function formatTime(milliseconds) {
    var total = Math.max(0, Math.floor(milliseconds / 1000));
    var minutes = Math.floor(total / 60);
    var seconds = total % 60;
    return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  }

  function formatDate(value) {
    if (!value) return "";
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    try {
      return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(date);
    } catch (error) {
      return date.toLocaleString();
    }
  }

  function percent(correct, total) {
    return total ? Math.round((correct / total) * 100) : 0;
  }

  function bind(container) {
    if (container.__quizBound) return;
    container.__quizBound = true;
    container.addEventListener("click", onClick);
    container.addEventListener("change", onChange);
  }

  function rerender() {
    if (!ui.container) return;
    if (ui.kind === "mistakes") renderMistakes(ui.container, {});
    else renderPractice(ui.container, { subjectId: ui.subjectId });
  }

  function setConfig(patch) {
    ui.config = Object.assign({}, ui.config, patch);
    store.setJson(CONFIG_KEY, ui.config);
  }

  function configChips(items, current, action) {
    return items
      .map(function (item) {
        return (
          '<button type="button" class="qchip' +
          (String(item.value) === String(current) ? " is-active" : "") +
          '" data-quiz-action="' +
          action +
          '" data-value="' +
          esc(item.value) +
          '">' +
          esc(item.label) +
          "</button>"
        );
      })
      .join("");
  }

  function subjectChips() {
    var items = [{ value: "all", label: "كل المواد" }].concat(
      subjects.map(function (subject) {
        return { value: subject.id, label: subject.nameAr };
      }),
    );
    return items
      .map(function (item) {
        return (
          '<button type="button" class="qchip' +
          (ui.subjectId === item.value ? " is-active" : "") +
          '" data-quiz-action="subject" data-value="' +
          esc(item.value) +
          '">' +
          esc(item.label) +
          "</button>"
        );
      })
      .join("");
  }

  function lectureChips() {
    var lectures = lecturesFor(ui.subjectId);
    if (!lectures.length) return '<span class="muted">لا توجد محاضرات في هذا النطاق.</span>';
    var selected = ui.config.lectures || [];
    var allOn = selected.length === 0;
    return (
      '<button type="button" class="qchip' +
      (allOn ? " is-active" : "") +
      '" data-quiz-action="lectures-all">كل المحاضرات</button>' +
      lectures
        .map(function (lecture) {
          var on = selected.indexOf(Number(lecture)) !== -1;
          return (
            '<button type="button" class="qchip' +
            (on ? " is-active" : "") +
            '" data-quiz-action="lecture" data-value="' +
            lecture +
            '">محاضرة ' +
            lecture +
            "</button>"
          );
        })
        .join("")
    );
  }

  function builderCard() {
    var pool = poolFor(ui.subjectId, ui.config);
    var session = store.getJson(examKey(ui.subjectId), null);
    var canResume = session && !session.finished && Array.isArray(session.ids) && session.ids.length;
    var subjectName = ui.subjectId === "all" ? "كل المواد" : (subjectById(ui.subjectId) || {}).nameAr || "";
    return (
      '<div class="quiz-builder">' +
      '<section class="quiz-panel">' +
      "<h3>1. اختر المادة</h3>" +
      '<div class="qchips">' +
      subjectChips() +
      "</div>" +
      "</section>" +
      '<section class="quiz-panel">' +
      "<h3>2. نطاق المحاضرات</h3>" +
      '<div class="qchips">' +
      lectureChips() +
      "</div>" +
      "</section>" +
      '<section class="quiz-panel quiz-two-col">' +
      "<div><h3>3. مستوى الصعوبة</h3><div class=\"qchips\">" +
      configChips(
        Object.keys(DIFFICULTY_LABELS).map(function (value) {
          return { value: value, label: DIFFICULTY_LABELS[value] };
        }),
        ui.config.difficulty,
        "difficulty",
      ) +
      "</div></div>" +
      "<div><h3>4. نمط الاختبار</h3><div class=\"qchips\">" +
      configChips(
        Object.keys(MODE_LABELS).map(function (value) {
          return { value: value, label: MODE_LABELS[value] };
        }),
        ui.config.mode,
        "mode",
      ) +
      "</div></div>" +
      "</section>" +
      '<section class="quiz-panel quiz-two-col">' +
      "<div><h3>5. عدد الأسئلة</h3><div class=\"qchips\">" +
      configChips(
        Object.keys(COUNT_LABELS).map(function (value) {
          return { value: value, label: COUNT_LABELS[value] };
        }),
        String(ui.config.count),
        "count",
      ) +
      "</div></div>" +
      "<div><h3>6. الترتيب</h3>" +
      '<label class="quiz-switch"><input type="checkbox" data-quiz-shuffle ' +
      (ui.config.shuffle ? "checked" : "") +
      "><span>خلط الأسئلة عشوائيًا</span></label>" +
      "</div>" +
      "</section>" +
      '<div class="quiz-summary">' +
      "<div><strong>" +
      pool.length +
      "</strong><span>سؤال متاح في " +
      esc(subjectName) +
      "</span></div>" +
      "<div>" +
      '<button type="button" class="btn btn-primary" data-quiz-action="start" ' +
      (pool.length ? "" : "disabled") +
      ">" +
      ICONS.play +
      "<span>ابدأ الآن</span></button>" +
      (canResume
        ? '<button type="button" class="btn" data-quiz-action="resume">استكمل الجلسة السابقة</button>'
        : "") +
      "</div>" +
      "</div>" +
      (ui.message ? '<div class="quiz-note">' + ui.message + "</div>" : "") +
      '<div class="quiz-tools">' +
      '<button type="button" class="btn btn-sm" data-quiz-action="export">' +
      ICONS.download +
      "<span>تصدير التقدم</span></button>" +
      '<button type="button" class="btn btn-sm" data-quiz-action="import">' +
      ICONS.upload +
      "<span>استيراد التقدم</span></button>" +
      '<a class="btn btn-sm" href="#mistakes">' +
      ICONS.bolt +
      "<span>بنك أخطائي</span></a>" +
      "</div>" +
      '<input type="file" accept="application/json,.json" data-quiz-import hidden>' +
      "</div>"
    );
  }

  function renderPractice(container, options) {
    bind(container);
    ui.container = container;
    var subjectId = (options && options.subjectId) || "all";
    if (ui.kind !== "practice" || ui.subjectId !== subjectId) {
      ui.kind = "practice";
      ui.subjectId = subjectId;
      ui.screen = "builder";
      ui.session = null;
      ui.message = "";
      ui.mastered = 0;
    }
    if (ui.screen === "exam" && ui.session) {
      renderExam(container);
      return;
    }
    if (ui.screen === "result" && ui.session) {
      renderResult(container);
      return;
    }
    var subject = subjectId === "all" ? null : subjectById(subjectId);
    var backId = subjectId === "all" ? (subjects[0] || {}).id || "" : subjectId;
    container.innerHTML =
      '<div class="feature-page quiz-page">' +
      '<div class="feature-hero" style="--accent:' +
      (subject ? subject.accent : "#2563eb") +
      '">' +
      '<span class="eyebrow">' +
      ICONS.question +
      " بنك الأسئلة والامتحانات التفاعلية</span>" +
      "<h2>اختبر نفسك — " +
      esc(subject ? subject.nameAr : "كل المواد") +
      "</h2>" +
      '<p class="feature-sub">' +
      (subject ? "أسئلة من بنك " + esc(subject.nameAr) + " فقط." : "أسئلة من كل المواد المتاحة.") +
      " اختر المحاضرات والمستوى، ثم ابدأ التدريب الفوري أو محاكاة الميدترم (30 دقيقة).</p>" +
      '<div class="feature-actions">' +
      '<a class="btn btn-primary" href="#' +
      esc(backId) +
      '">' +
      ICONS.back +
      "<span>العودة للمادة</span></a>" +
      '<a class="btn" href="#mistakes">' +
      ICONS.bolt +
      "<span>بنك أخطائي</span></a>" +
      "</div>" +
      "</div>" +
      builderCard() +
      "</div>";
    startTimer();
  }

  function renderMistakes(container) {
    bind(container);
    ui.container = container;
    if (ui.kind !== "mistakes") {
      ui.kind = "mistakes";
      ui.subjectId = "mistakes";
      ui.screen = "builder";
      ui.session = null;
      ui.message = "";
      ui.mastered = 0;
    }
    if (ui.screen === "exam" && ui.session) {
      renderExam(container);
      return;
    }
    if (ui.screen === "result" && ui.session) {
      renderResult(container);
      return;
    }
    var entries = mistakeEntries();
    var grouped = {};
    entries.forEach(function (entry) {
      grouped[entry.subjectId] = (grouped[entry.subjectId] || 0) + 1;
    });
    var list = entries
      .map(function (entry) {
        var subject = subjectById(entry.subjectId);
        return (
          '<div class="mistake-row">' +
          '<div class="mistake-main">' +
          '<div class="mistake-meta"><span class="chip" style="--accent:' +
          (subject ? subject.accent : "#dc2626") +
          '">' +
          esc(subject ? subject.nameAr : entry.subjectId) +
          "</span><span>محاضرة " +
          esc(entry.lecture) +
          "</span><span>أخطأت " +
          entry.wrongCount +
          " مرة</span></div>" +
          '<p dir="auto">' +
          esc(entry.question.q) +
          "</p>" +
          (entry.lastAt ? '<span class="muted">آخر خطأ: ' + esc(formatDate(entry.lastAt)) + "</span>" : "") +
          "</div>" +
          '<button type="button" class="icon-btn" title="حذف من بنك الأخطاء" data-quiz-action="delete-mistake" data-value="' +
          esc(entry.id) +
          '">' +
          ICONS.trash +
          "</button>" +
          "</div>"
        );
      })
      .join("");
    var subjectBreakdown = Object.keys(grouped)
      .map(function (subjectId) {
        var subject = subjectById(subjectId);
        return (
          '<button type="button" class="qchip" data-quiz-action="mistakes-subject" data-value="' +
          esc(subjectId) +
          '">' +
          esc(subject ? subject.nameAr : subjectId) +
          " (" +
          grouped[subjectId] +
          ")</button>"
        );
      })
      .join("");
    container.innerHTML =
      '<div class="feature-page quiz-page">' +
      '<div class="feature-hero" style="--accent:#dc2626">' +
      '<span class="eyebrow">' +
      ICONS.bolt +
      " بنك أخطائي</span>" +
      "<h2>امتحن في أخطائك فقط</h2>" +
      '<p class="feature-sub">كل سؤال تخطئ فيه يُسجَّل هنا. أجب عنه صحيحًا مرتين متتاليتين ليُعتبر مُتقنًا ويُستبعد تلقائيًا.</p>' +
      '<div class="feature-meta"><span class="chip">' +
      entries.length +
      " سؤال في بنك الأخطاء</span><span class=\"chip\">" +
      Object.keys(grouped).length +
      " مواد</span></div>" +
      "</div>" +
      '<div class="mistakes-toolbar">' +
      '<button type="button" class="btn btn-primary" data-quiz-action="start-mistakes" data-value="all" ' +
      (entries.length ? "" : "disabled") +
      ">" +
      ICONS.play +
      "<span>امتحن كل الأخطاء</span></button>" +
      '<div class="qchips">' +
      subjectBreakdown +
      "</div>" +
      '<div class="quiz-tools">' +
      '<button type="button" class="btn btn-sm" data-quiz-action="export">' +
      ICONS.download +
      "<span>تصدير</span></button>" +
      '<button type="button" class="btn btn-sm" data-quiz-action="import">' +
      ICONS.upload +
      "<span>استيراد</span></button>" +
      '<button type="button" class="btn btn-sm btn-danger" data-quiz-action="clear-mistakes" ' +
      (entries.length ? "" : "disabled") +
      ">" +
      ICONS.trash +
      "<span>مسح الكل</span></button>" +
      "</div>" +
      '<input type="file" accept="application/json,.json" data-quiz-import hidden>' +
      "</div>" +
      (ui.message ? '<div class="quiz-note">' + ui.message + "</div>" : "") +
      (entries.length
        ? '<div class="mistake-list">' + list + "</div>"
        : '<div class="empty">' +
          ICONS.trophy +
          "<strong>لا توجد أخطاء مسجلة بعد</strong><span>ابدأ اختبارًا، وسيظهر هنا كل سؤال تخطئ فيه.</span>" +
          '<a class="btn btn-sm" href="#practice">' +
          ICONS.question +
          "<span>ابدأ أول اختبار</span></a></div>") +
      "</div>";
  }

  function sessionQuestions(session) {
    return session.ids
      .map(function (id) {
        return questionById[id];
      })
      .filter(Boolean);
  }

  function startSession(kind, subjectId, config, mistakeIds) {
    var pool;
    if (kind === "mistakes") {
      pool = (mistakeIds || []).map(function (id) {
        return questionById[id];
      });
      pool = pool.filter(Boolean);
      if (!pool.length) {
        ui.message = "لا توجد أسئلة في بنك الأخطاء ضمن هذا النطاق.";
        rerender();
        return;
      }
      config = Object.assign({}, config, { count: "all", mode: "practice" });
    } else {
      pool = poolFor(subjectId, config);
    }
    if (!pool.length) {
      ui.message = "لا توجد أسئلة مطابقة للفلاتر الحالية.";
      rerender();
      return;
    }
    if (config.shuffle) pool = shuffle(pool);
    var limit = config.count === "all" ? pool.length : Math.min(Number(config.count) || 20, pool.length);
    var chosen = pool.slice(0, limit);
    var session = {
      version: 1,
      kind: kind,
      subjectId: subjectId,
      mode: config.mode,
      ids: chosen.map(function (question) {
        return question.id;
      }),
      index: 0,
      answers: {},
      revealed: {},
      startedAt: new Date().toISOString(),
      deadline: config.mode === "timed" ? Date.now() + 30 * 60 * 1000 : null,
      finished: false,
      mastered: 0,
      score: null,
    };
    ui.session = session;
    ui.screen = "exam";
    ui.mastered = 0;
    ui.message = "";
    store.setJson(examKey(subjectId), session);
    rerender();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startFromMistakes(subjectId) {
    var entries = mistakeEntries().filter(function (entry) {
      return subjectId === "all" || entry.subjectId === subjectId;
    });
    startSession(
      "mistakes",
      "mistakes:" + subjectId,
      { count: "all", mode: "practice", shuffle: true },
      entries.map(function (entry) {
        return entry.id;
      }),
    );
  }

  function currentQuestion() {
    if (!ui.session) return null;
    return questionById[ui.session.ids[ui.session.index]] || null;
  }

  function answeredCount(session) {
    return Object.keys(session.answers).length;
  }

  function correctCount(session) {
    var count = 0;
    session.ids.forEach(function (id) {
      var question = questionById[id];
      if (!question) return;
      if (session.answers[id] === question.answer) count += 1;
    });
    return count;
  }

  function examHeader(session, question, total) {
    var subject = subjectById(question.subjectId);
    var timer =
      session.mode === "timed"
        ? '<span class="quiz-timer" data-quiz-timer>' +
          formatTime((session.deadline || Date.now()) - Date.now()) +
          "</span>"
        : "";
    return (
      '<div class="quiz-exam-head">' +
      '<div class="quiz-exam-title">' +
      '<a class="btn btn-sm" href="#' +
      (session.kind === "mistakes" ? "mistakes" : "practice/" + esc(session.subjectId)) +
      '" data-quiz-action="exit">' +
      ICONS.close +
      "<span>خروج</span></a>" +
      "<div><strong>" +
      esc(subject ? subject.nameAr : "") +
      "</strong><span>محاضرة " +
      esc(question.lecture) +
      " · " +
      esc(DIFFICULTY_LABELS[question.difficulty] || question.difficulty) +
      "</span></div>" +
      "</div>" +
      '<div class="quiz-exam-stats">' +
      '<span class="quiz-progress-label">السؤال ' +
      (ui.session.index + 1) +
      " من " +
      total +
      "</span>" +
      timer +
      (session.mode === "practice"
        ? '<span class="quiz-score">' + correctCount(session) + " صحيحة</span>"
        : '<span class="quiz-score">' + answeredCount(session) + " مُجابة</span>") +
      "</div>" +
      "</div>" +
      '<div class="quiz-progress"><span style="width:' +
      Math.round(((session.index + 1) / total) * 100) +
      '%"></span></div>'
    );
  }

  function optionClass(session, question, index) {
    var selected = session.answers[question.id];
    var revealed = session.revealed[question.id];
    if (revealed || (session.mode === "timed" && selected !== undefined)) {
      if (index === question.answer) return " is-correct";
      if (index === selected) return " is-wrong";
    }
    if (selected === index) return " is-selected";
    return "";
  }

  function renderExam(container) {
    var session = ui.session;
    var total = session.ids.length;
    var question = currentQuestion();
    if (!question) {
      finishSession();
      return;
    }
    var subject = subjectById(question.subjectId);
    var selected = session.answers[question.id];
    var revealed = session.revealed[question.id];
    var options = question.options
      .map(function (option, index) {
        return (
          '<button type="button" class="quiz-option' +
          optionClass(session, question, index) +
          '" data-quiz-action="answer" data-value="' +
          index +
          '" ' +
          (revealed ? "disabled" : "") +
          ">" +
          '<span class="quiz-option-letter">' +
          String.fromCharCode(65 + index) +
          "</span>" +
          '<span dir="auto">' +
          esc(option) +
          "</span>" +
          "</button>"
        );
      })
      .join("");
    var practice = session.mode === "practice";
    var isLast = session.index === total - 1;
    var answered = selected !== undefined;
    var explanation =
      revealed && question.explanation
        ? '<div class="quiz-explanation"><strong>التفسير</strong><p dir="auto">' +
          esc(question.explanation) +
          "</p></div>"
        : "";
    var toast =
      ui.mastered > 0
        ? '<div class="quiz-toast">تم إتقان ' + ui.mastered + " سؤال 🎉</div>"
        : "";
    container.innerHTML =
      '<div class="feature-page quiz-page">' +
      '<div class="quiz-exam" style="--accent:' +
      (subject ? subject.accent : "#2563eb") +
      '">' +
      toast +
      examHeader(session, question, total) +
      '<div class="quiz-card">' +
      '<div class="quiz-card-meta"><span class="chip">' +
      esc(subject ? subject.nameAr : "") +
      "</span><span class=\"chip\">محاضرة " +
      esc(question.lecture) +
      "</span><span class=\"chip\">" +
      esc(DIFFICULTY_LABELS[question.difficulty] || question.difficulty) +
      "</span></div>" +
      '<h3 class="quiz-question" dir="auto">' +
      esc(question.q) +
      "</h3>" +
      '<div class="quiz-options">' +
      options +
      "</div>" +
      explanation +
      (practice && !revealed
        ? '<p class="quiz-hint">اختر إجابة لعرض التصحيح والتفسير فورًا.</p>'
        : "") +
      "</div>" +
      '<div class="quiz-nav">' +
      '<button type="button" class="btn" data-quiz-action="prev" ' +
      (session.index === 0 ? "disabled" : "") +
      ">السابق</button>" +
      "<div>" +
      (practice && isLast
        ? '<button type="button" class="btn btn-primary" data-quiz-action="finish" ' +
          (answered ? "" : "disabled") +
          ">عرض النتيجة</button>"
        : practice
          ? '<button type="button" class="btn btn-primary" data-quiz-action="next" ' +
            (answered ? "" : "") +
            ">التالي</button>"
          : '<button type="button" class="btn btn-primary" data-quiz-action="next">' +
            (isLast ? "مراجعة وإنهاء" : "التالي") +
            "</button>") +
      "</div>" +
      '<button type="button" class="btn btn-danger" data-quiz-action="finish">إنهاء الاختبار</button>' +
      "</div>" +
      '<div class="quiz-dots">' +
      session.ids
        .map(function (id, index) {
          var q = questionById[id];
          var state = session.answers[id] !== undefined ? " is-answered" : "";
          if (session.revealed[id] && q) {
            state = session.answers[id] === q.answer ? " is-correct" : " is-wrong";
          }
          return (
            '<button type="button" class="quiz-dot' +
            state +
            (index === session.index ? " is-current" : "") +
            '" data-quiz-action="jump" data-value="' +
            index +
            '" aria-label="السؤال ' +
            (index + 1) +
            '"></button>'
          );
        })
        .join("") +
      "</div>" +
      "</div>" +
      "</div>";
    startTimer();
  }

  function finishSession(auto) {
    var session = ui.session;
    if (!session || session.finished) return;
    session.finished = true;
    session.finishedAt = new Date().toISOString();
    session.score = { correct: correctCount(session), total: session.ids.length, auto: Boolean(auto) };
    if (session.mode === "timed") {
      session.ids.forEach(function (id) {
        var question = questionById[id];
        if (!question) return;
        var answer = session.answers[id];
        if (answer === undefined) return;
        if (answer === question.answer) {
          if (recordCorrect(question)) ui.mastered += 1;
        } else {
          recordWrong(question);
        }
      });
    }
    store.setJson(examKey(session.subjectId), session);
    ui.screen = "result";
    clearTimer();
    rerender();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderResult(container) {
    var session = ui.session;
    var questions = sessionQuestions(session);
    var correct = correctCount(session);
    var total = session.ids.length;
    var unanswered = total - answeredCount(session);
    var score = percent(correct, total);
    var passed = score >= PASS_MARK;
    var wrong = [];
    session.ids.forEach(function (id) {
      var question = questionById[id];
      if (!question) return;
      var answer = session.answers[id];
      if (answer === question.answer) return;
      wrong.push({ question: question, answer: answer });
    });
    var wrongList = wrong
      .map(function (item) {
        var question = item.question;
        return (
          '<div class="quiz-review-item">' +
          '<div class="quiz-review-q"><span class="chip">محاضرة ' +
          esc(question.lecture) +
          "</span><p dir=\"auto\">" +
          esc(question.q) +
          "</p></div>" +
          '<div class="quiz-review-answer"><span class="quiz-mark is-correct">' +
          ICONS.check +
          " الصحيحة</span><p dir=\"auto\">" +
          esc(question.options[question.answer]) +
          "</p></div>" +
          (item.answer === undefined
            ? '<div class="quiz-review-answer"><span class="quiz-mark">لم تُجب</span></div>'
            : '<div class="quiz-review-answer"><span class="quiz-mark is-wrong">' +
              ICONS.close +
              " إجابتك</span><p dir=\"auto\">" +
              esc(question.options[item.answer]) +
              "</p></div>") +
          (question.explanation
            ? '<div class="quiz-explanation"><strong>التفسير</strong><p dir="auto">' +
              esc(question.explanation) +
              "</p></div>"
            : "") +
          "</div>"
        );
      })
      .join("");
    var subject = subjectById(session.kind === "mistakes" ? null : session.subjectId);
    container.innerHTML =
      '<div class="feature-page quiz-page">' +
      '<div class="quiz-result-hero ' +
      (passed ? "is-pass" : "is-fail") +
      '">' +
      '<span class="eyebrow">' +
      ICONS.trophy +
      " نتيجة الاختبار</span>" +
      '<div class="quiz-result-score"><strong>' +
      score +
      "%</strong><span>" +
      correct +
      " من " +
      total +
      " صحيحة</span></div>" +
      "<h2>" +
      (passed ? "أداء جيد، استمر!" : "تحتاج مراجعة إضافية") +
      "</h2>" +
      '<div class="quiz-result-stats">' +
      '<span class="chip">' +
      ICONS.check +
      " صحيحة " +
      correct +
      "</span>" +
      '<span class="chip">' +
      ICONS.close +
      " خاطئة " +
      (total - correct - unanswered) +
      "</span>" +
      '<span class="chip">' +
      ICONS.question +
      " بدون إجابة " +
      unanswered +
      "</span>" +
      (session.mode === "timed" ? '<span class="chip">' + ICONS.clock + " محاكاة 30 دقيقة</span>" : "") +
      "</div>" +
      (ui.mastered > 0 ? '<div class="quiz-toast">تم إتقان ' + ui.mastered + " سؤال 🎉</div>" : "") +
      "</div>" +
      '<div class="quiz-result-actions">' +
      '<button type="button" class="btn btn-primary" data-quiz-action="restart">إعادة بنفس الإعدادات</button>' +
      '<button type="button" class="btn" data-quiz-action="new">اختبار جديد</button>' +
      (wrong.length
        ?       '<button type="button" class="btn" data-quiz-action="retry-wrong">امتحن في الأخطاء</button>'
        : "") +
      '<a class="btn" href="#mistakes" data-quiz-action="go-mistakes">' + ICONS.bolt + "<span>بنك أخطائي</span></a>" +
      '<button type="button" class="btn btn-sm" data-quiz-action="export">' +
      ICONS.download +
      "<span>تصدير التقدم</span></button>" +
      '<input type="file" accept="application/json,.json" data-quiz-import hidden>' +
      "</div>" +
      (wrong.length
        ? '<section class="quiz-review"><h2>أسئلة تحتاج مراجعة</h2>' + wrongList + "</section>"
        : '<div class="empty">' + ICONS.trophy + "<strong>كل الإجابات صحيحة</strong><span>لا توجد أسئلة في قائمة المراجعة.</span></div>") +
      "</div>";
    startTimer();
  }

  function startTimer() {
    clearTimer();
    var session = ui.session;
    if (!session || session.mode !== "timed" || session.finished) return;
    var tick = function () {
      var current = ui.session;
      if (!current || current !== session || current.finished) {
        clearTimer();
        return;
      }
      var left = (session.deadline || Date.now()) - Date.now();
      var el = ui.container && ui.container.querySelector("[data-quiz-timer]");
      if (el) el.textContent = formatTime(left);
      if (left <= 0) {
        clearTimer();
        finishSession(true);
      }
    };
    tick();
    timerId = setInterval(tick, 1000);
  }

  function clearTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function answer(index) {
    var session = ui.session;
    var question = currentQuestion();
    if (!session || !question) return;
    if (session.mode === "practice" && session.revealed[question.id]) return;
    session.answers[question.id] = index;
    if (session.mode === "practice") {
      session.revealed[question.id] = true;
      if (index === question.answer) {
        if (recordCorrect(question)) ui.mastered += 1;
      } else {
        recordWrong(question);
      }
    }
    store.setJson(examKey(session.subjectId), session);
    rerender();
  }

  function nextQuestion() {
    var session = ui.session;
    if (!session) return;
    if (session.index < session.ids.length - 1) {
      session.index += 1;
      store.setJson(examKey(session.subjectId), session);
      rerender();
    } else if (session.mode === "timed") {
      finishSession();
    }
  }

  function prevQuestion() {
    var session = ui.session;
    if (!session || session.index === 0) return;
    session.index -= 1;
    store.setJson(examKey(session.subjectId), session);
    rerender();
  }

  function jumpTo(index) {
    var session = ui.session;
    if (!session) return;
    var value = Number(index);
    if (!Number.isInteger(value) || value < 0 || value >= session.ids.length) return;
    session.index = value;
    store.setJson(examKey(session.subjectId), session);
    rerender();
  }

  function retryWrong() {
    var session = ui.session;
    if (!session) return;
    var ids = session.ids.filter(function (id) {
      var question = questionById[id];
      return question && session.answers[id] !== question.answer;
    });
    if (!ids.length) return;
    startSession("mistakes", "mistakes:retry", { count: "all", mode: "practice", shuffle: true }, ids);
  }

  function restart() {
    var session = ui.session;
    if (!session) return;
    var subjectId = session.kind === "mistakes" ? "mistakes" : session.subjectId;
    ui.screen = "builder";
    store.remove(examKey(session.subjectId));
    rerender();
    if (session.kind === "mistakes") {
      startFromMistakes("all");
    } else {
      startSession("practice", subjectId, ui.config);
    }
  }

  function exportProgress() {
    var data = { version: 1, exportedAt: new Date().toISOString(), mistakes: getMistakes(), exams: {} };
    try {
      for (var index = 0; index < localStorage.length; index += 1) {
        var key = localStorage.key(index);
        if (key && key.indexOf("hub:examState:") === 0) {
          data.exams[key] = store.getJson(key, null);
        }
      }
      data.studied = store.getJson("hub:studied", {});
    } catch (error) {
      ui.message = "تعذّر الوصول إلى التخزين المحلي في هذا المتصفح.";
      rerender();
      return;
    }
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "hub-progress-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    ui.message = "تم تصدير ملف التقدم.";
    rerender();
  }

  function importProgress(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result || ""));
        if (!data || typeof data !== "object") throw new Error("invalid");
        var mistakes = data.mistakes && typeof data.mistakes === "object" ? data.mistakes : null;
        if (!mistakes && !data.exams) throw new Error("invalid");
        if (
          !window.confirm(
            "سيتم استبدال بنك الأخطاء وجلسات الاختبار المحفوظة بالبيانات الموجودة في الملف. هل تريد المتابعة؟",
          )
        ) {
          return;
        }
        if (mistakes) saveMistakes(mistakes);
        if (data.exams && typeof data.exams === "object") {
          Object.keys(data.exams).forEach(function (key) {
            if (key.indexOf("hub:examState:") !== 0) return;
            if (data.exams[key]) store.setJson(key, data.exams[key]);
          });
        }
        if (data.studied && typeof data.studied === "object") store.setJson("hub:studied", data.studied);
        ui.message = "تم استيراد التقدم بنجاح.";
        ui.screen = "builder";
        ui.session = null;
        rerender();
      } catch (error) {
        ui.message = "الملف غير صالح. تأكد من اختيار ملف تصدير التقدم.";
        rerender();
      }
    };
    reader.readAsText(file);
  }

  function clearMistakes() {
    if (!window.confirm("هل تريد مسح كل الأسئلة من بنك الأخطاء؟")) return;
    saveMistakes({});
    ui.message = "تم مسح بنك الأخطاء.";
    rerender();
  }

  function deleteMistake(id) {
    var mistakes = getMistakes();
    if (!mistakes[id]) return;
    delete mistakes[id];
    saveMistakes(mistakes);
    rerender();
  }

  function toggleLecture(value) {
    var lecture = Number(value);
    var selected = Array.isArray(ui.config.lectures) ? ui.config.lectures.slice() : [];
    var index = selected.indexOf(lecture);
    if (index === -1) selected.push(lecture);
    else selected.splice(index, 1);
    selected.sort(function (a, b) {
      return a - b;
    });
    setConfig({ lectures: selected });
    ui.message = "";
    rerender();
  }

  function onClick(event) {
    var trigger = event.target.closest("[data-quiz-action]");
    if (!trigger || trigger.closest("[data-quiz-import]")) return;
    var action = trigger.dataset.quizAction;
    var value = trigger.dataset.value;
    if (action === "subject") {
      ui.subjectId = value;
      setConfig({ lectures: [] });
      ui.message = "";
      rerender();
      return;
    }
    if (action === "lecture") {
      toggleLecture(value);
      return;
    }
    if (action === "lectures-all") {
      setConfig({ lectures: [] });
      rerender();
      return;
    }
    if (action === "difficulty") {
      setConfig({ difficulty: value });
      rerender();
      return;
    }
    if (action === "mode") {
      setConfig({ mode: value });
      rerender();
      return;
    }
    if (action === "count") {
      setConfig({ count: value === "all" ? "all" : Number(value) });
      rerender();
      return;
    }
    if (action === "start") {
      startSession(ui.kind === "mistakes" ? "mistakes" : "practice", ui.subjectId, ui.config);
      return;
    }
    if (action === "resume") {
      var session = store.getJson(examKey(ui.subjectId), null);
      if (!session || !Array.isArray(session.ids)) return;
      ui.session = session;
      ui.screen = session.finished ? "result" : "exam";
      ui.mastered = 0;
      rerender();
      return;
    }
    if (action === "answer") {
      answer(Number(value));
      return;
    }
    if (action === "next") {
      nextQuestion();
      return;
    }
    if (action === "prev") {
      prevQuestion();
      return;
    }
    if (action === "jump") {
      jumpTo(value);
      return;
    }
    if (action === "finish") {
      if (window.confirm("هل تريد إنهاء الاختبار وعرض النتيجة؟")) finishSession();
      return;
    }
    if (action === "restart") {
      restart();
      return;
    }
    if (action === "new") {
      ui.screen = "builder";
      ui.session = null;
      rerender();
      return;
    }
    if (action === "go-mistakes") {
      ui.screen = "builder";
      ui.session = null;
      ui.message = "";
      ui.mastered = 0;
      rerender();
      if (location.hash !== "#mistakes") location.hash = "#mistakes";
      return;
    }
    if (action === "retry-wrong") {
      retryWrong();
      return;
    }
    if (action === "exit") {
      if (ui.session && !ui.session.finished && !window.confirm("سيتم حفظ تقدمك. هل تريد الخروج؟")) {
        event.preventDefault();
        return;
      }
      ui.screen = "builder";
      ui.session = null;
      rerender();
      return;
    }
    if (action === "export") {
      exportProgress();
      return;
    }
    if (action === "import") {
      var input = ui.container.querySelector("[data-quiz-import]");
      if (input) input.click();
      return;
    }
    if (action === "clear-mistakes") {
      clearMistakes();
      return;
    }
    if (action === "delete-mistake") {
      deleteMistake(value);
      return;
    }
    if (action === "start-mistakes") {
      startFromMistakes(value || "all");
      return;
    }
    if (action === "mistakes-subject") {
      startFromMistakes(value);
      return;
    }
  }

  function onChange(event) {
    if (event.target.matches("[data-quiz-shuffle]")) {
      setConfig({ shuffle: event.target.checked });
      return;
    }
    if (event.target.matches("[data-quiz-import]")) {
      var file = event.target.files && event.target.files[0];
      event.target.value = "";
      importProgress(file);
    }
  }

  window.HubQuiz = {
    init: init,
    reset: function () {
      ui.screen = "builder";
      ui.session = null;
      ui.message = "";
      ui.mastered = 0;
      clearTimer();
    },
    renderPractice: renderPractice,
    renderMistakes: renderMistakes,
    exportProgress: exportProgress,
  };
})();
