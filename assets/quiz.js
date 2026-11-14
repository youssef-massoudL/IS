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
    sync: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.6"/><path d="M14 14h3v3h-3zM20 14h1M14 20h1M20 20h1M17 20h1M20 17h1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
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
  var CORRECTED_KEY = "hub:corrected";
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
    mistakesView: "active",
    mistakesSubject: "all",
    mistakesExamType: "all",
    mistakesLecture: "all",
    retryingId: null,
    retryFeedback: null,
  };
  var timerId = null;

  var DIFFICULTY_LABELS = { all: "كل المستويات", easy: "سهل", medium: "متوسط", hard: "صعب" };
  var MODE_LABELS = {
    practice: "تدريب حر (بدون وقت)",
    timed: "محاكاة ميدترم (30 دقيقة)",
  };
  var REVEAL_LABELS = {
    after: "بعد انتهاء الامتحان",
    instant: "فوراً بعد كل سؤال",
  };
  var COUNT_LABELS = { 10: "10", 20: "20", 30: "30", 50: "50", all: "الكل" };

  function defaultConfig() {
    return {
      difficulty: "all",
      mode: "practice",
      revealMode: "after",
      count: 20,
      shuffle: true,
      lectures: [],
    };
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
    try {
      window.dispatchEvent(new CustomEvent("hub:mistakes-updated"));
    } catch (error) {
      return;
    }
  }

  function getCorrected() {
    var value = store.getJson(CORRECTED_KEY, {});
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function saveCorrected(value) {
    store.setJson(CORRECTED_KEY, value);
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
          selectedAnswer:
            entry.selectedAnswer === undefined ? undefined : Number(entry.selectedAnswer),
          correctAnswer:
            entry.correctAnswer === undefined
              ? question.answer
              : Number(entry.correctAnswer),
          examType: entry.examType || "اختبار",
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

  function correctedEntries() {
    var corrected = getCorrected();
    return Object.keys(corrected)
      .map(function (id) {
        var entry = corrected[id];
        var question = getMistakeQuestion(id);
        if (!question) return null;
        return {
          id: id,
          wrongCount: Number(entry.wrongCount) || 1,
          previousSelectedAnswer:
            entry.previousSelectedAnswer === undefined
              ? undefined
              : Number(entry.previousSelectedAnswer),
          correctAnswer:
            entry.correctAnswer === undefined
              ? question.answer
              : Number(entry.correctAnswer),
          examType: entry.examType || "اختبار",
          subjectId: entry.subjectId || question.subjectId,
          lecture: entry.lecture || question.lecture,
          correctedAt: entry.correctedAt || "",
          lastWrongAt: entry.lastWrongAt || "",
          question: question,
        };
      })
      .filter(Boolean)
      .sort(function (a, b) {
        return String(b.correctedAt).localeCompare(String(a.correctedAt));
      });
  }

  function recordWrong(question, meta) {
    var mistakes = getMistakes();
    var corrected = getCorrected();
    var existing = mistakes[question.id] || {};
    var previousCorrected = corrected[question.id] || {};
    var now = new Date().toISOString();
    var selectedAnswer = meta && meta.selectedAnswer !== undefined ? meta.selectedAnswer : existing.selectedAnswer;
    var examType = (meta && meta.examType) || existing.examType || previousCorrected.examType || "اختبار";
    var wrongCount =
      (Number(existing.wrongCount) || 0) +
      (Number(previousCorrected.wrongCount) || 0) +
      1;
    mistakes[question.id] = {
      wrongCount: wrongCount,
      selectedAnswer: selectedAnswer,
      correctAnswer: question.answer,
      examType: examType,
      subjectId: question.subjectId,
      lecture: question.lecture,
      firstAt: existing.firstAt || previousCorrected.lastWrongAt || now,
      lastAt: now,
    };
    if (previousCorrected && Object.keys(previousCorrected).length) delete corrected[question.id];
    saveMistakes(mistakes);
    saveCorrected(corrected);
  }

  function recordCorrect(question) {
    var mistakes = getMistakes();
    var corrected = getCorrected();
    var existing = mistakes[question.id];
    if (!existing) return false;
    var now = new Date().toISOString();
    corrected[question.id] = {
      wrongCount: Number(existing.wrongCount) || 1,
      previousSelectedAnswer: existing.selectedAnswer,
      correctAnswer: question.answer,
      examType: existing.examType || "اختبار",
      subjectId: existing.subjectId || question.subjectId,
      lecture: existing.lecture || question.lecture,
      lastWrongAt: existing.lastAt || now,
      correctedAt: now,
    };
    delete mistakes[question.id];
    saveMistakes(mistakes);
    saveCorrected(corrected);
    return true;
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
      '<section class="quiz-panel">' +
      "<h3>إظهار الإجابات</h3><div class=\"qchips\">" +
      configChips(
        Object.keys(REVEAL_LABELS).map(function (value) {
          return {
            value: value,
            label: REVEAL_LABELS[value] + (value === "after" ? " (الافتراضي)" : ""),
          };
        }),
        ui.config.revealMode,
        "reveal-mode",
      ) +
      "</div>" +
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

  function subjectName(subjectId) {
    var subject = subjectById(subjectId);
    return subject ? subject.nameAr : subjectId;
  }

  function subjectAccent(subjectId) {
    var subject = subjectById(subjectId);
    return subject ? subject.accent : "#dc2626";
  }

  function optionText(question, index) {
    if (index === undefined || index === null || !question.options[index]) return "غير مسجل";
    return question.options[index];
  }

  function rawMistakeEntries() {
    return ui.mistakesView === "corrected" ? correctedEntries() : mistakeEntries();
  }

  function currentMistakeViewEntries() {
    return rawMistakeEntries().filter(function (entry) {
      if (ui.mistakesSubject !== "all" && entry.subjectId !== ui.mistakesSubject) return false;
      if (ui.mistakesExamType !== "all" && entry.examType !== ui.mistakesExamType) return false;
      if (ui.mistakesLecture !== "all" && String(entry.lecture) !== String(ui.mistakesLecture)) {
        return false;
      }
      return true;
    });
  }

  function filterChips(entries, key, action, labelPrefix) {
    var values = [];
    entries.forEach(function (entry) {
      var value = String(entry[key]);
      if (values.indexOf(value) === -1) values.push(value);
    });
    values.sort(function (a, b) {
      var an = Number(a);
      var bn = Number(b);
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
      return a.localeCompare(b, "ar");
    });
    return values
      .map(function (value) {
        var selected =
          key === "lecture" ? ui.mistakesLecture === value : ui.mistakesExamType === value;
        return (
          '<button type="button" class="qchip' +
          (selected ? " is-active" : "") +
          '" data-quiz-action="' +
          action +
          '" data-value="' +
          esc(value) +
          '">' +
          esc(labelPrefix ? labelPrefix + " " + value : value) +
          "</button>"
        );
      })
      .join("");
  }

  function retryForm(entry, feedback) {
    var question = entry.question;
    return (
      '<div class="mistake-retry">' +
      '<div class="quiz-options">' +
      question.options
        .map(function (option, index) {
          var state = "";
          if (feedback) {
            if (index === entry.correctAnswer || index === question.answer) state = " is-correct";
            else if (index === feedback.selected) state = " is-wrong";
          }
          return (
            '<button type="button" class="quiz-option' +
            state +
            '" data-quiz-action="retry-single-answer" data-id="' +
            esc(entry.id) +
            '" data-value="' +
            index +
            '">' +
            '<span class="quiz-option-letter">' +
            String.fromCharCode(65 + index) +
            "</span>" +
            '<span dir="auto">' +
            esc(option) +
            "</span>" +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      "</div>"
    );
  }

  function renderMistakeCard(entry) {
    var question = entry.question;
    var feedback = ui.retryFeedback && ui.retryFeedback.id === entry.id ? ui.retryFeedback : null;
    return (
      '<article class="mistake-card" data-mistake-id="' +
      esc(entry.id) +
      '" style="--accent:' +
      subjectAccent(entry.subjectId) +
      '">' +
      '<div class="mistake-badges">' +
      '<span class="chip">' +
      esc(subjectName(entry.subjectId)) +
      "</span>" +
      '<span class="chip">محاضرة ' +
      esc(entry.lecture) +
      "</span>" +
      '<span class="chip">' +
      esc(entry.examType) +
      "</span>" +
      '<span class="chip is-wrong">أخطأت ' +
      entry.wrongCount +
      " مرة</span>" +
      "</div>" +
      '<p class="mistake-question" dir="auto">' +
      esc(question.q) +
      "</p>" +
      '<div class="mistake-compare">' +
      '<div class="mistake-answer is-wrong"><span>اختيارك</span><p dir="auto">' +
      esc(optionText(question, entry.selectedAnswer)) +
      "</p></div>" +
      '<div class="mistake-answer is-correct"><span>الصحيح (الغلط كان فين)</span><p dir="auto">' +
      esc(optionText(question, entry.correctAnswer === undefined ? question.answer : entry.correctAnswer)) +
      "</p></div>" +
      "</div>" +
      '<div class="mistake-explanation"><strong>الشرح</strong><p dir="auto">' +
      esc(question.explanation || "لا يوجد شرح متاح لهذا السؤال.") +
      "</p></div>" +
      (feedback
        ? '<div class="retry-feedback ' +
          (feedback.correct ? "is-correct" : "is-wrong") +
          '">' +
          (feedback.correct
            ? "أحسنت! تم نقل السؤال إلى تبويب تصحيح."
            : "لسه غلط — راجع الشرح وحاول تاني.") +
          "</div>"
        : "") +
      '<div class="mistake-actions">' +
      '<button type="button" class="btn btn-sm" data-quiz-action="retry-single" data-value="' +
      esc(entry.id) +
      '">' +
      (ui.retryingId === entry.id ? "إغلاق المحاولة" : "حل السؤال تاني") +
      "</button>" +
      "</div>" +
      (ui.retryingId === entry.id ? retryForm(entry, feedback) : "") +
      "</article>"
    );
  }

  function correctedCard(entry) {
    var question = entry.question;
    return (
      '<article class="mistake-card is-corrected" style="--accent:' +
      subjectAccent(entry.subjectId) +
      '">' +
      '<div class="mistake-badges">' +
      '<span class="chip">' +
      esc(subjectName(entry.subjectId)) +
      "</span>" +
      '<span class="chip">محاضرة ' +
      esc(entry.lecture) +
      "</span>" +
      '<span class="chip">' +
      esc(entry.examType) +
      "</span>" +
      '<span class="chip is-correct">تم التصحيح ' +
      esc(formatDate(entry.correctedAt)) +
      "</span>" +
      "</div>" +
      '<p class="mistake-question" dir="auto">' +
      esc(question.q) +
      "</p>" +
      '<div class="mistake-compare">' +
      '<div class="mistake-answer is-wrong"><span>إجابتك السابقة</span><p dir="auto">' +
      esc(optionText(question, entry.previousSelectedAnswer)) +
      "</p></div>" +
      '<div class="mistake-answer is-correct"><span>الإجابة الصحيحة</span><p dir="auto">' +
      esc(optionText(question, entry.correctAnswer === undefined ? question.answer : entry.correctAnswer)) +
      "</p></div>" +
      "</div>" +
      '<div class="mistake-explanation"><strong>الشرح</strong><p dir="auto">' +
      esc(question.explanation || "لا يوجد شرح متاح لهذا السؤال.") +
      "</p></div>" +
      "</article>"
    );
  }

  function renderCorrectedGroups(entries) {
    if (!entries.length) {
      return (
        '<div class="empty">' +
        ICONS.trophy +
        "<strong>لا توجد أسئلة مصححة بعد</strong><span>حل سؤالًا من أخطائك بشكل صحيح مرة واحدة لينتقل إلى هنا.</span></div>"
      );
    }
    var tree = {};
    entries.forEach(function (entry) {
      tree[entry.subjectId] = tree[entry.subjectId] || {};
      tree[entry.subjectId][entry.examType] = tree[entry.subjectId][entry.examType] || {};
      var lectureKey = String(entry.lecture);
      tree[entry.subjectId][entry.examType][lectureKey] =
        tree[entry.subjectId][entry.examType][lectureKey] || [];
      tree[entry.subjectId][entry.examType][lectureKey].push(entry);
    });
    return Object.keys(tree)
      .map(function (subjectId) {
        var examTypes = tree[subjectId];
        return (
          '<section class="corrected-subject">' +
          '<h3 class="corrected-subject-head"><span class="dot" style="background:' +
          subjectAccent(subjectId) +
          '"></span>' +
          esc(subjectName(subjectId)) +
          "</h3>" +
          Object.keys(examTypes)
            .map(function (examType) {
              var lectures = examTypes[examType];
              return (
                '<div class="corrected-exam">' +
                '<h4 class="corrected-exam-head">' +
                esc(examType) +
                "</h4>" +
                Object.keys(lectures)
                  .sort(function (a, b) {
                    return Number(a) - Number(b);
                  })
                  .map(function (lecture) {
                    var items = lectures[lecture];
                    return (
                      '<div class="corrected-lecture">' +
                      '<h5 class="corrected-lecture-head">محاضرة ' +
                      esc(lecture) +
                      '<span class="count">' +
                      items.length +
                      "</span></h5>" +
                      items.map(correctedCard).join("") +
                      "</div>"
                    );
                  })
                  .join("") +
                "</div>"
              );
            })
            .join("") +
          "</section>"
        );
      })
      .join("");
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
    var activeEntries = mistakeEntries();
    var corrected = correctedEntries();
    var baseEntries = ui.mistakesView === "corrected" ? corrected : activeEntries;
    var viewEntries = currentMistakeViewEntries();
    var subjectCounts = {};
    baseEntries.forEach(function (entry) {
      subjectCounts[entry.subjectId] = (subjectCounts[entry.subjectId] || 0) + 1;
    });
    var subjectTabs =
      '<button type="button" class="qchip' +
      (ui.mistakesSubject === "all" ? " is-active" : "") +
      '" data-quiz-action="mistakes-subject-tab" data-value="all">كل المواد (' +
      baseEntries.length +
      ")</button>" +
      subjects
        .map(function (subject) {
          return (
            '<button type="button" class="qchip' +
            (ui.mistakesSubject === subject.id ? " is-active" : "") +
            '" data-quiz-action="mistakes-subject-tab" data-value="' +
            esc(subject.id) +
            '">' +
            esc(subject.nameAr) +
            " (" +
            (subjectCounts[subject.id] || 0) +
            ")</button>"
          );
        })
        .join("");
    var subjectFiltered = baseEntries.filter(function (entry) {
      return ui.mistakesSubject === "all" || entry.subjectId === ui.mistakesSubject;
    });
    var examTypeChips = filterChips(subjectFiltered, "examType", "mistakes-exam-type", "");
    var lectureSource = subjectFiltered.filter(function (entry) {
      return ui.mistakesExamType === "all" || entry.examType === ui.mistakesExamType;
    });
    var lectureChips = filterChips(lectureSource, "lecture", "mistakes-lecture", "محاضرة");
    var filters =
      ui.mistakesView === "corrected"
        ? '<div class="mistakes-filters">' +
          '<div class="filter-row"><span>نوع الاختبار</span><div class="qchips">' +
          '<button type="button" class="qchip' +
          (ui.mistakesExamType === "all" ? " is-active" : "") +
          '" data-quiz-action="mistakes-exam-type" data-value="all">الكل</button>' +
          examTypeChips +
          "</div></div>" +
          '<div class="filter-row"><span>المحاضرة</span><div class="qchips">' +
          '<button type="button" class="qchip' +
          (ui.mistakesLecture === "all" ? " is-active" : "") +
          '" data-quiz-action="mistakes-lecture" data-value="all">الكل</button>' +
          lectureChips +
          "</div></div>" +
          "</div>"
        : "";
    var tools =
      '<div class="quiz-tools">' +
      '<button type="button" class="btn btn-sm btn-primary" data-quiz-action="open-sync">' +
      ICONS.sync +
      "<span>نقل تقدمي للموبايل</span></button>" +
      '<button type="button" class="btn btn-sm" data-quiz-action="export">' +
      ICONS.download +
      "<span>تصدير</span></button>" +
      '<button type="button" class="btn btn-sm" data-quiz-action="import">' +
      ICONS.upload +
      "<span>استيراد</span></button>" +
      "</div>";
    var toolsTop =
      ui.mistakesView === "corrected"
        ? '<div class="mistakes-tools-top">' + tools + "</div>"
        : "";
    var activeList = viewEntries.map(renderMistakeCard).join("");
    var correctedList = renderCorrectedGroups(viewEntries);
    var isEmpty = !viewEntries.length;
    container.innerHTML =
      '<div class="feature-page quiz-page">' +
      '<div class="feature-hero" style="--accent:#dc2626">' +
      '<span class="eyebrow">' +
      ICONS.bolt +
      " بنك أخطائي</span>" +
      "<h2>راجع أخطاءك وثبّت الصح</h2>" +
      '<p class="feature-sub">كل سؤال تخطئ فيه يُسجَّل هنا باختيارك والإجابة الصحيحة والشرح. حلّه صحيحًا مرة واحدة لينتقل إلى تبويب تصحيح.</p>' +
      '<div class="feature-meta"><span class="chip">' +
      activeEntries.length +
      " في الأخطاء</span><span class=\"chip\">" +
      corrected.length +
      " في التصحيح</span><span class=\"chip\">" +
      Object.keys(subjectCounts).length +
      " مواد</span></div>" +
      "</div>" +
      '<div class="mistakes-toolbar">' +
      '<div class="mistakes-view-tabs" role="tablist" aria-label="عرض بنك الأخطاء">' +
      '<button type="button" class="qchip' +
      (ui.mistakesView === "active" ? " is-active" : "") +
      '" data-quiz-action="mistakes-view" data-value="active">أخطائي (' +
      activeEntries.length +
      ")</button>" +
      '<button type="button" class="qchip' +
      (ui.mistakesView === "corrected" ? " is-active" : "") +
      '" data-quiz-action="mistakes-view" data-value="corrected">تصحيح (' +
      corrected.length +
      ")</button>" +
      "</div>" +
      '<div class="qchips mistakes-subject-tabs">' +
      subjectTabs +
      "</div>" +
      toolsTop +
      filters +
      '<div class="mistakes-actions">' +
      (ui.mistakesView === "active" && viewEntries.length
        ? '<button type="button" class="btn btn-primary" data-quiz-action="start-mistakes" data-value="all">' +
          ICONS.play +
          "<span>امتحن في أخطاء التبويب الحالي (" +
          viewEntries.length +
          ")</span></button>"
        : "") +
      (ui.mistakesView === "active" ? tools : "") +
      "</div>" +
      '<input type="file" accept="application/json,.json" data-quiz-import hidden>' +
      "</div>" +
      (ui.message ? '<div class="quiz-note">' + ui.message + "</div>" : "") +
      (ui.mistakesView === "active"
        ? isEmpty
          ? '<div class="empty">' +
            ICONS.trophy +
            "<strong>لا توجد أخطاء في هذا التبويب</strong><span>ابدأ اختبارًا، وسيظهر هنا كل سؤال تخطئ فيه.</span>" +
            '<a class="btn btn-sm" href="#practice">' +
            ICONS.question +
            "<span>ابدأ أول اختبار</span></a></div>"
          : '<div class="mistake-list">' + activeList + "</div>"
        : correctedList) +
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
    var revealMode = config.revealMode || "after";
    var examTypeLabel;
    if (kind === "mistakes") {
      examTypeLabel = "اختبار أخطائي";
    } else if (config.mode === "timed") {
      examTypeLabel =
        "محاكاة ميدترم" + (revealMode === "instant" ? " (تصحيح فوري)" : " (بعد الانتهاء)");
    } else {
      examTypeLabel =
        revealMode === "instant" ? "تدريب فوري" : "تدريب حر (بعد الانتهاء)";
    }
    var session = {
      version: 1,
      kind: kind,
      subjectId: subjectId,
      mode: config.mode,
      revealMode: revealMode,
      examTypeLabel: examTypeLabel,
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

  function startFromMistakes() {
    var entries = currentMistakeViewEntries();
    if (!entries.length) return;
    startSession(
      "mistakes",
      "mistakes:filtered",
      {
        count: "all",
        mode: "practice",
        shuffle: true,
        revealMode: ui.config.revealMode || "after",
      },
      entries.map(function (entry) {
        return entry.id;
      }),
    );
  }

  function retrySingleAnswer(id, selected) {
    var question = getMistakeQuestion(id);
    if (!question) return;
    var entry =
      mistakeEntries().find(function (item) {
        return item.id === id;
      }) || {};
    if (selected === question.answer) {
      var moved = recordCorrect(question);
      if (moved) ui.mastered += 1;
      ui.retryFeedback = {
        id: id,
        selected: selected,
        correct: true,
        movedToCorrected: moved,
      };
      ui.retryingId = null;
      ui.message = "";
    } else {
      recordWrong(question, {
        selectedAnswer: selected,
        examType: entry.examType || "إعادة حل سؤال",
      });
      ui.retryFeedback = {
        id: id,
        selected: selected,
        correct: false,
        movedToCorrected: false,
      };
      ui.retryingId = id;
      ui.message = "";
    }
    rerender();
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
      (session.revealMode === "instant"
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
    if (revealed) {
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
    var instant = session.revealMode === "instant";
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
      (instant && !revealed
        ? '<p class="quiz-hint">اختر إجابة لعرض التصحيح والتفسير فورًا.</p>'
        : !instant && !revealed
          ? '<p class="quiz-hint">ستظهر الإجابات بعد انتهاء الامتحان.</p>'
          : "") +
      "</div>" +
      '<div class="quiz-nav">' +
      '<button type="button" class="btn" data-quiz-action="prev" ' +
      (session.index === 0 ? "disabled" : "") +
      ">السابق</button>" +
      "<div>" +
      (instant && isLast
        ? '<button type="button" class="btn btn-primary" data-quiz-action="finish" ' +
          (answered ? "" : "disabled") +
          ">عرض النتيجة</button>"
        : instant
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
    if (session.revealMode !== "instant") {
      session.ids.forEach(function (id) {
        var question = questionById[id];
        if (!question) return;
        var answer = session.answers[id];
        if (answer === undefined) return;
        if (answer === question.answer) {
          if (recordCorrect(question)) ui.mastered += 1;
        } else {
          recordWrong(question, {
            selectedAnswer: answer,
            examType: session.examTypeLabel,
          });
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
    if (session.revealed[question.id]) return;
    session.answers[question.id] = index;
    if (session.revealMode === "instant") {
      session.revealed[question.id] = true;
      if (index === question.answer) {
        if (recordCorrect(question)) ui.mastered += 1;
      } else {
        recordWrong(question, {
          selectedAnswer: index,
          examType: session.examTypeLabel,
        });
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
    } else if (session.mode === "timed" || session.revealMode !== "instant") {
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

  function buildSyncPayload() {
    return {
      v: 2,
      ts: Date.now(),
      mistakes: getMistakes(),
      corrected: getCorrected(),
      config: Object.assign({}, ui.config || defaultConfig()),
      studied: store.getJson("hub:studied", {}),
    };
  }

  function bytesToBase64Url(bytes) {
    var binary = "";
    var chunk = 0x8000;
    for (var index = 0; index < bytes.length; index += chunk) {
      binary += String.fromCharCode.apply(
        null,
        bytes.subarray ? bytes.subarray(index, index + chunk) : bytes.slice(index, index + chunk),
      );
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function base64UrlToBytes(value) {
    var base64 = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  async function encodeSyncPayload(data) {
    var json = new TextEncoder().encode(JSON.stringify(data));
    if (typeof CompressionStream === "function") {
      try {
        var compressed = new Blob([json])
          .stream()
          .pipeThrough(new CompressionStream("deflate-raw"));
        var buffer = await new Response(compressed).arrayBuffer();
        return "HUB2:" + bytesToBase64Url(new Uint8Array(buffer));
      } catch (error) {
        void error;
      }
    }
    return "HUB1:" + bytesToBase64Url(json);
  }

  async function decodeSyncPayload(value) {
    var code = String(value || "").trim();
    var hashIndex = code.indexOf("#sync=");
    if (hashIndex !== -1) code = code.slice(hashIndex + 6);
    else if (code.indexOf("sync=") === 0) code = code.slice(5);
    if (code.indexOf("HUB2:") === 0) {
      if (typeof DecompressionStream !== "function") {
        throw new Error("compressed");
      }
      var compressedBytes = base64UrlToBytes(code.slice(5));
      var stream = new Blob([compressedBytes])
        .stream()
        .pipeThrough(new DecompressionStream("deflate-raw"));
      var buffer = await new Response(stream).arrayBuffer();
      return JSON.parse(new TextDecoder().decode(buffer));
    }
    if (code.indexOf("HUB1:") === 0) {
      return JSON.parse(new TextDecoder().decode(base64UrlToBytes(code.slice(5))));
    }
    throw new Error("invalid");
  }

  function buildSyncUrl(code) {
    if (location.protocol === "file:") return "";
    return location.origin + location.pathname + location.search + "#sync=" + code;
  }

  function qrSvg(text) {
    try {
      var qr = window.qrcode(0, "L");
      qr.addData(text);
      qr.make();
      return qr.createSvgTag({
        cellSize: 4,
        margin: 8,
        scalable: true,
        alt: "رمز QR لنقل التقدم",
      });
    } catch (error) {
      return "";
    }
  }

  function mergeMistakes(current, incoming) {
    var result = Object.assign({}, current);
    Object.keys(incoming || {}).forEach(function (id) {
      var before = result[id];
      var after = incoming[id];
      if (!after || typeof after !== "object") return;
      if (!before) {
        result[id] = after;
        return;
      }
      var newest =
        String(after.lastAt || "") >= String(before.lastAt || "") ? after : before;
      var merged = Object.assign({}, before, after, newest);
      merged.wrongCount = Math.max(
        Number(before.wrongCount) || 1,
        Number(after.wrongCount) || 1,
      );
      merged.lastAt = newest.lastAt || before.lastAt || after.lastAt || "";
      result[id] = merged;
    });
    return result;
  }

  function mergeCorrected(current, incoming) {
    var result = Object.assign({}, current);
    Object.keys(incoming || {}).forEach(function (id) {
      var before = result[id];
      var after = incoming[id];
      if (!after || typeof after !== "object") return;
      if (!before) {
        result[id] = after;
        return;
      }
      var newest =
        String(after.correctedAt || "") >= String(before.correctedAt || "") ? after : before;
      var merged = Object.assign({}, before, after, newest);
      merged.wrongCount = Math.max(
        Number(before.wrongCount) || 1,
        Number(after.wrongCount) || 1,
      );
      merged.correctedAt = newest.correctedAt || before.correctedAt || after.correctedAt || "";
      result[id] = merged;
    });
    return result;
  }

  function mergeStudied(current, incoming) {
    var result = Object.assign({}, current || {});
    Object.keys(incoming || {}).forEach(function (key) {
      if (incoming[key]) result[key] = true;
    });
    return result;
  }

  function reconcileMistakes(mistakes, corrected) {
    Object.keys(corrected || {}).forEach(function (id) {
      if (!mistakes[id]) return;
      var wrongAt = String(mistakes[id].lastAt || "");
      var correctAt = String(corrected[id].correctedAt || "");
      if (correctAt >= wrongAt) delete mistakes[id];
      else delete corrected[id];
    });
  }

  function applySyncData(data, mode) {
    var incomingMistakes =
      data.mistakes && typeof data.mistakes === "object" && !Array.isArray(data.mistakes)
        ? data.mistakes
        : {};
    var incomingCorrected =
      data.corrected && typeof data.corrected === "object" && !Array.isArray(data.corrected)
        ? data.corrected
        : {};
    var incomingStudied =
      data.studied && typeof data.studied === "object" && !Array.isArray(data.studied)
        ? data.studied
        : {};
    var mistakes;
    var corrected;
    var studied;
    if (mode === "replace") {
      mistakes = Object.assign({}, incomingMistakes);
      corrected = Object.assign({}, incomingCorrected);
      studied = Object.assign({}, incomingStudied);
    } else {
      mistakes = mergeMistakes(getMistakes(), incomingMistakes);
      corrected = mergeCorrected(getCorrected(), incomingCorrected);
      studied = mergeStudied(store.getJson("hub:studied", {}), incomingStudied);
    }
    reconcileMistakes(mistakes, corrected);
    saveMistakes(mistakes);
    saveCorrected(corrected);
    store.setJson("hub:studied", studied);
    if (data.config && typeof data.config === "object" && !Array.isArray(data.config)) {
      ui.config = Object.assign(defaultConfig(), mode === "replace" ? data.config : ui.config, data.config);
      store.setJson(CONFIG_KEY, ui.config);
    }
    return {
      mistakes: Object.keys(mistakes).length,
      corrected: Object.keys(corrected).length,
      studied: Object.keys(studied).length,
    };
  }

  function syncSummary(data) {
    var mistakes = data && data.mistakes && typeof data.mistakes === "object" ? data.mistakes : {};
    var corrected = data && data.corrected && typeof data.corrected === "object" ? data.corrected : {};
    var studied = data && data.studied && typeof data.studied === "object" ? data.studied : {};
    return (
      Object.keys(mistakes).length +
      " خطأ · " +
      Object.keys(corrected).length +
      " مصحح · " +
      Object.keys(studied).length +
      " عنصر مذاكرة"
    );
  }

  function syncStatus(overlay, message, isError) {
    var status = overlay.querySelector("[data-sync-status]");
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
  }

  function ensureSyncModal() {
    var overlay = document.getElementById("hub-sync-modal");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "hub-sync-modal";
    overlay.className = "hub-sync-overlay";
    overlay.hidden = true;
    overlay.addEventListener("click", onSyncClick);
    overlay.addEventListener("keydown", onSyncKeydown);
    document.body.appendChild(overlay);
    return overlay;
  }

  function syncMarkup(code, url, svg) {
    var shareValue = url || code;
    var tooLarge = Boolean(url && url.length > 2200);
    var qrBlock = svg
      ? '<div class="sync-qr">' + svg + "</div>"
      : '<div class="sync-qr is-unavailable">' +
        ICONS.sync +
        "<span>" +
        (tooLarge
          ? "البيانات كبيرة على رمز QR — استخدم نسخ الكود أو ملف النسخ الاحتياطي."
          : url
            ? "تعذّر توليد رمز QR في هذا المتصفح."
            : "افتح الموقع عبر رابط ويب لتوليد رمز QR، أو استخدم نسخ الكود.") +
        "</span></div>";
    return (
      '<div class="sync-dialog" role="dialog" aria-modal="true" aria-labelledby="sync-title">' +
      '<header class="sync-head">' +
      '<div><span class="eyebrow">' +
      ICONS.sync +
      " نقل التقدم</span><h2 id=\"sync-title\">نقل تقدمي للموبايل</h2>" +
      "<p>انقل بنك أخطائك وقائمة التصحيح وإعدادات الاختبار وعناصر المذاكرة بين الأجهزة. البيانات تبقى داخل متصفحك.</p></div>" +
      '<button type="button" class="sync-close" data-sync-close aria-label="إغلاق">' +
      ICONS.close +
      "</button></header>" +
      '<div class="sync-grid">' +
      '<section class="sync-panel">' +
      "<h3>إرسال من هذا الجهاز</h3>" +
      '<div class="sync-qr-wrap">' +
      qrBlock +
      "</div>" +
      '<label class="sync-label" for="sync-share-value">رابط أو كود النقل</label>' +
      '<textarea id="sync-share-value" class="sync-code" data-sync-share readonly dir="ltr">' +
      esc(shareValue) +
      "</textarea>" +
      '<div class="sync-panel-actions">' +
      '<button type="button" class="btn btn-primary btn-sm" data-sync-copy>' +
      ICONS.sync +
      "<span>نسخ رابط / كود النقل</span></button>" +
      '<button type="button" class="btn btn-sm" data-sync-download>' +
      ICONS.download +
      "<span>تحميل نسخة احتياطية (JSON)</span></button>" +
      "</div>" +
      (tooLarge
        ? '<p class="sync-note">البيانات كبيرة على رمز QR — استخدم نسخ الكود أو ملف النسخ الاحتياطي.</p>'
        : "") +
      "</section>" +
      '<section class="sync-panel">' +
      "<h3>استقبال على هذا الجهاز</h3>" +
      '<label class="sync-label" for="sync-import-value">الصق كود HUB1/HUB2 أو رابط النقل</label>' +
      '<textarea id="sync-import-value" class="sync-code" data-sync-input dir="ltr" placeholder="HUB2:..."></textarea>' +
      '<div class="sync-modes" role="group" aria-label="طريقة التطبيق">' +
      '<button type="button" class="qchip is-active" data-sync-mode="merge">دمج مع الحالي (موصى به)</button>' +
      '<button type="button" class="qchip" data-sync-mode="replace">استبدال الكل</button>' +
      "</div>" +
      '<button type="button" class="btn btn-primary sync-apply" data-sync-apply>' +
      ICONS.check +
      "<span>تطبيق النقل</span></button>" +
      '<p class="sync-status" data-sync-status aria-live="polite"></p>' +
      "</section>" +
      "</div>" +
      "</div>"
    );
  }

  async function openSync(options) {
    options = options || {};
    var overlay = ensureSyncModal();
    var data = buildSyncPayload();
    var code;
    try {
      code = await encodeSyncPayload(data);
    } catch (error) {
      ui.message = "تعذّر تجهيز كود النقل.";
      rerender();
      return;
    }
    var url = buildSyncUrl(code);
    var svg = url && url.length <= 2200 ? qrSvg(url) : "";
    overlay.innerHTML = syncMarkup(code, url, svg);
    overlay.hidden = false;
    document.documentElement.style.overflow = "hidden";
    if (options.importCode) {
      var input = overlay.querySelector("[data-sync-input]");
      input.value = options.importCode;
      try {
        var incoming = await decodeSyncPayload(options.importCode);
        syncStatus(overlay, "تم قراءة كود النقل: " + syncSummary(incoming) + " — اختر دمج أو استبدال.", false);
      } catch (error) {
        syncStatus(overlay, "تعذّر قراءة كود النقل. تأكد من نسخه كاملًا.", true);
      }
      input.focus();
    } else {
      overlay.querySelector("[data-sync-close]")?.focus();
    }
  }

  function closeSync() {
    var overlay = document.getElementById("hub-sync-modal");
    if (!overlay) return;
    overlay.hidden = true;
    overlay.innerHTML = "";
    document.documentElement.style.overflow = "";
  }

  function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(value);
    }
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy") ? resolve() : reject(new Error("copy"));
      } catch (error) {
        reject(error);
      } finally {
        area.remove();
      }
    });
  }

  async function applySyncFromModal(overlay) {
    var input = overlay.querySelector("[data-sync-input]");
    var raw = input ? input.value.trim() : "";
    if (!raw) {
      syncStatus(overlay, "الصق كود النقل أو رابطه أولًا.", true);
      input?.focus();
      return;
    }
    var modeEl = overlay.querySelector("[data-sync-mode].is-active");
    var mode = modeEl && modeEl.dataset.syncMode === "replace" ? "replace" : "merge";
    var data;
    try {
      data = await decodeSyncPayload(raw);
    } catch (error) {
      syncStatus(overlay, "الكود غير صالح أو غير مكتمل. انسخ الكود كاملًا وحاول مرة أخرى.", true);
      return;
    }
    if (!data || typeof data !== "object") {
      syncStatus(overlay, "لا تحتوي البيانات على تقدم صالح.", true);
      return;
    }
    if (
      mode === "replace" &&
      !window.confirm("سيتم استبدال بنك الأخطاء وقائمة التصحيح وعناصر المذاكرة وإعدادات الاختبار بالبيانات المستلمة. هل تريد المتابعة؟")
    ) {
      return;
    }
    var counts = applySyncData(data, mode);
    ui.message =
      (mode === "replace" ? "تم استبدال التقدم" : "تم دمج التقدم") +
      ": " +
      counts.mistakes +
      " خطأ، " +
      counts.corrected +
      " مصحح.";
    syncStatus(overlay, "تم تطبيق النقل بنجاح. سيُحدَّث بنك الأخطاء الآن.", false);
    setTimeout(function () {
      closeSync();
      ui.screen = "builder";
      ui.session = null;
      rerender();
    }, 650);
  }

  function onSyncClick(event) {
    var overlay = event.currentTarget;
    if (event.target === overlay || event.target.closest("[data-sync-close]")) {
      closeSync();
      return;
    }
    var modeButton = event.target.closest("[data-sync-mode]");
    if (modeButton) {
      overlay.querySelectorAll("[data-sync-mode]").forEach(function (button) {
        button.classList.toggle("is-active", button === modeButton);
      });
      return;
    }
    if (event.target.closest("[data-sync-copy]")) {
      var share = overlay.querySelector("[data-sync-share]");
      if (!share) return;
      copyText(share.value)
        .then(function () {
          syncStatus(overlay, "تم نسخ رابط / كود النقل.", false);
        })
        .catch(function () {
          share.focus();
          share.select();
          syncStatus(overlay, "تعذّر النسخ تلقائيًا. الكود محدد، اضغط Ctrl+C.", true);
        });
      return;
    }
    if (event.target.closest("[data-sync-download]")) {
      exportProgress();
      syncStatus(overlay, "تم تجهيز ملف النسخة الاحتياطية.", false);
      return;
    }
    if (event.target.closest("[data-sync-apply]")) {
      applySyncFromModal(overlay);
    }
  }

  function onSyncKeydown(event) {
    if (event.key === "Escape") closeSync();
  }

  function exportProgress() {
    var data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      mistakes: getMistakes(),
      corrected: getCorrected(),
      exams: {},
    };
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
        var corrected = data.corrected && typeof data.corrected === "object" ? data.corrected : null;
        if (!mistakes && !corrected && !data.exams) throw new Error("invalid");
        if (
          !window.confirm(
            "سيتم استبدال بنك الأخطاء وقائمة التصحيح وجلسات الاختبار المحفوظة بالبيانات الموجودة في الملف. هل تريد المتابعة؟",
          )
        ) {
          return;
        }
        if (mistakes) saveMistakes(mistakes);
        if (corrected) saveCorrected(corrected);
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
    if (action === "reveal-mode") {
      setConfig({ revealMode: value });
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
      session.revealMode = session.revealMode || "after";
      if (!session.examTypeLabel) {
        session.examTypeLabel =
          session.mode === "timed" ? "محاكاة ميدترم" : "تدريب حر (بعد الانتهاء)";
      }
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
    if (action === "open-sync") {
      openSync();
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
    if (action === "start-mistakes") {
      startFromMistakes(value || ui.mistakesSubject || "all");
      return;
    }
    if (action === "mistakes-view") {
      ui.mistakesView = value === "corrected" ? "corrected" : "active";
      ui.mistakesExamType = "all";
      ui.mistakesLecture = "all";
      ui.retryingId = null;
      ui.retryFeedback = null;
      rerender();
      return;
    }
    if (action === "mistakes-subject-tab") {
      ui.mistakesSubject = value || "all";
      ui.mistakesExamType = "all";
      ui.mistakesLecture = "all";
      ui.retryingId = null;
      ui.retryFeedback = null;
      rerender();
      return;
    }
    if (action === "mistakes-exam-type") {
      ui.mistakesExamType = value || "all";
      ui.mistakesLecture = "all";
      rerender();
      return;
    }
    if (action === "mistakes-lecture") {
      ui.mistakesLecture = value || "all";
      rerender();
      return;
    }
    if (action === "retry-single") {
      ui.retryingId = ui.retryingId === value ? null : value;
      ui.retryFeedback = null;
      rerender();
      return;
    }
    if (action === "retry-single-answer") {
      retrySingleAnswer(trigger.dataset.id, Number(value));
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
      closeSync();
      ui.screen = "builder";
      ui.session = null;
      ui.message = "";
      ui.mastered = 0;
      clearTimer();
    },
    renderPractice: renderPractice,
    renderMistakes: renderMistakes,
    exportProgress: exportProgress,
    openSync: openSync,
    closeSync: closeSync,
    openSyncImport: function (payload) {
      return openSync({ importCode: payload });
    },
  };
})();
