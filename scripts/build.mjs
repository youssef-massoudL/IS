import fs from "node:fs";
import path from "node:path";

const SITE = path.resolve(import.meta.dirname, "..");
const MANIFEST = path.join(SITE, "data", "subjects.json");
const SCHEDULE = path.join(SITE, "data", "schedule.json");
const QUESTIONS_DIR = path.join(SITE, "data", "questions");
const FILES = path.join(SITE, "files");
const COMMITTEES = path.join(FILES, "committees");
const EMBED = path.join(SITE, "assets", "data.js");
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const fix = args.has("--fix");

if (!fs.existsSync(MANIFEST)) {
  console.error(`missing manifest: ${MANIFEST}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const problems = [];
const referenced = new Set();
const touched = [];
let classificationChanged = 0;

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EXTENDED_ARABIC_INDIC = "۰۱۲۳۴۵۶۷۸۹";

const asciiDigits = (value) =>
  String(value).replace(/[٠-٩۰-۹]/g, (digit) => {
    const standard = ARABIC_INDIC.indexOf(digit);
    if (standard !== -1) return String(standard);
    return String(EXTENDED_ARABIC_INDIC.indexOf(digit));
  });

const normalizeAr = (value) =>
  asciiDigits(String(value || "").toLowerCase())
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");

const itemText = (item) =>
  `${item.title || ""} ${item.original || ""} ${item.id || ""} ${item.path || ""}`;

const hasAny = (haystack, words) => words.some((word) => haystack.includes(normalizeAr(word)));

const KIND_KEYWORDS = {
  lecture: ["محاضرة", "محاضرات", "lecture", "lec"],
  summary: ["ملخص", "ملخصات", "summary", "خلاصة"],
  questions: ["أسئلة", "اسئلة", "questions", "question", "امتحان", "بنك أسئلة"],
  solution: ["حل", "إجابة", "اجابة", "solved", "solution", "answers"],
  review: ["مراجعة", "مراجعات", "ميدترم", "midterm", "revision", "شامل"],
  book: ["كتاب", "كتب", "book", "مرجع", "reference"],
};

const REVIEW_RANGE_PATTERNS = [
  /\b\d{1,2}\s*[-_]\s*to\s*[-_]\s*\d{1,2}\b/,
  /\b\d{1,2}\s+to\s+\d{1,2}\b/,
  /first[-_\s]*\d{1,2}[-_\s]*lectures?/,
  /\b\d{1,2}[-_\s]*lectures?\b/,
  /\b\d{1,2}\s*[-–]\s*\d{1,2}\s*lectures?\b/,
];

const ARABIC_ORDINALS = [
  ["الحاديه عشر", 11],
  ["العاشره", 10],
  ["التاسعه", 9],
  ["الثامنه", 8],
  ["السابعه", 7],
  ["السادسه", 6],
  ["الخامسه", 5],
  ["الرابعه", 4],
  ["الثالثه", 3],
  ["الثانيه", 2],
  ["الاولي", 1],
  ["الاول", 1],
];

function isReviewItem(subjectId, sectionId, item, haystack) {
  if (item.midtermReview === false) return false;
  if (subjectId === "midterm-revision" || sectionId === "midterm-revision") return true;
  if (String(item.path || "").toLowerCase().includes("/midterm-revision/")) return true;
  return REVIEW_RANGE_PATTERNS.some((pattern) => pattern.test(haystack));
}

function extractLectureNumber(item, haystack) {
  let match = haystack.match(/lec(?:ture)?[-_\s]*0*(\d{1,2})/);
  if (match) return Number(match[1]);

  match = haystack.match(/محاضر(?:ه|ات)?\s*0*(\d{1,2})/);
  if (match) return Number(match[1]);

  for (const [word, number] of ARABIC_ORDINALS) {
    if (haystack.includes(word)) return number;
  }
  return null;
}

function detectLectureSpan(item, subjectId, sectionId, haystack) {
  if (
    subjectId === "computer-networks" &&
    sectionId === "lectures" &&
    /lect(?:ure)?[-_\s]*0*3[-_\s]*0*4/.test(haystack)
  ) {
    return [3, 4];
  }

  const match = haystack.match(/lec(?:ture)?[-_\s]*0*(\d{1,2})[-_\s]+0*(\d{1,2})/);
  if (match && Number(match[1]) !== Number(match[2])) {
    return [Number(match[1]), Number(match[2])];
  }
  return null;
}

function inferKind(sectionId, haystack) {
  if (hasAny(haystack, ["book", "books", "كتاب", "كتب", "reference", "مرجع", "مراجع"])) {
    return "book";
  }

  if (
    hasAny(haystack, ["unsolved", "بدون حل", "غير محلول", "غير محلوله", "بدون اجابه", "بدون إجابة"])
  ) {
    return "questions";
  }

  const questionish = hasAny(haystack, [
    "question",
    "questions",
    "quiz",
    "mcq",
    "أسئلة",
    "اسئلة",
    "امتحان",
    "امتحانات",
    "بنك",
    "بنك أسئلة",
  ]);
  const solutionish = hasAny(haystack, [
    "solved",
    "solution",
    "solutions",
    "answers",
    "answer",
    "محلول",
    "محلوله",
    "إجابة",
    "اجابة",
    "حل",
    "حلول",
  ]);

  if (questionish && !solutionish) return "questions";
  if (solutionish) return "solution";

  if (
    sectionId === "summaries" ||
    hasAny(haystack, [
      "summary",
      "summaries",
      "ملخص",
      "ملخصات",
      "mind-map",
      "mindmap",
      "خريطة ذهنية",
      "handwritten",
      "ملاحظات",
    ])
  ) {
    return "summary";
  }

  if (
    sectionId === "lectures" ||
    hasAny(haystack, ["lecture", "lectures", "محاضرة", "محاضرات"])
  ) {
    return "lecture";
  }

  return "summary";
}

function buildKeywords(subject, section, item, kind, lecture) {
  const values = [];
  const seen = new Set();

  const push = (value) => {
    const text = String(value ?? "").trim();
    if (!text) return;
    const key = normalizeAr(text);
    if (!key || seen.has(key)) return;
    seen.add(key);
    values.push(text);
  };

  for (const keyword of KIND_KEYWORDS[kind] || []) push(keyword);
  push(subject.nameAr);
  push(subject.name);
  push(subject.id);
  push(section.name);
  push(section.nameEn);
  push(section.id);

  if (lecture) {
    push(`محاضرة ${lecture}`);
    push(`lecture ${lecture}`);
    push(`lec ${lecture}`);
    push(String(lecture));
  }

  push(item.ext);

  const tokens = `${item.title || ""} ${item.original || ""} ${item.id || ""}`.split(
    /[^0-9A-Za-z\u0600-\u06FF]+/,
  );
  for (const token of tokens) {
    if (values.length >= 36) break;
    if (token.trim().length >= 2) push(token);
  }

  return values;
}

function classifyItem(subject, section, item) {
  const haystack = normalizeAr(itemText(item));
  const review = isReviewItem(subject.id, section.id, item, haystack);
  const span = review ? null : detectLectureSpan(item, subject.id, section.id, haystack);
  const lecture = review ? null : span
    ? span[0]
    : extractLectureNumber(item, haystack);
  const kind = review ? "review" : inferKind(section.id, haystack);
  const classification = { lecture, kind, keywords: buildKeywords(subject, section, item, kind, lecture) };
  if (span) classification.lectureSpan = span;
  return classification;
}

for (const subject of manifest.subjects) {
  for (const section of subject.sections) {
    for (const file of section.files) {
      const absolute = path.join(SITE, file.path.replace(/\//g, path.sep));
      referenced.add(path.resolve(absolute));

      const classification = classifyItem(subject, section, file);
      const changed =
        classification.lecture !== file.lecture ||
        classification.kind !== file.kind ||
        JSON.stringify(classification.lectureSpan ?? null) !==
          JSON.stringify(file.lectureSpan ?? null) ||
        JSON.stringify(classification.keywords) !== JSON.stringify(file.keywords);

      if (changed) {
        classificationChanged += 1;
        if (checkOnly) problems.push(`classification out of date: ${file.path}`);
      }

      file.lecture = classification.lecture;
      file.kind = classification.kind;
      file.keywords = classification.keywords;
      if (classification.lectureSpan) file.lectureSpan = classification.lectureSpan;
      else delete file.lectureSpan;

      if (!fs.existsSync(absolute)) {
        problems.push(`missing file: ${file.path} (${subject.id}/${section.id})`);
        continue;
      }

      const stat = fs.statSync(absolute);
      const ext = path.extname(absolute).slice(1).toLowerCase();

      if (file.size !== stat.size) {
        problems.push(`size mismatch: ${file.path} (${file.size} -> ${stat.size})`);
        if (fix) {
          file.size = stat.size;
          touched.push(file.path);
        }
      }

      if (file.ext !== ext) {
        problems.push(`extension mismatch: ${file.path} (${file.ext} -> ${ext})`);
        if (fix) {
          file.ext = ext;
          touched.push(file.path);
        }
      }

      if (!file.title || !file.title.trim()) problems.push(`empty title: ${file.path}`);
    }
  }
}

const onDisk = [];
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (path.resolve(full) === path.resolve(COMMITTEES)) continue;
      walk(full);
    } else onDisk.push(path.resolve(full));
  }
};
walk(FILES);

for (const absolute of onDisk) {
  if (!referenced.has(absolute)) {
    const rel = path.relative(SITE, absolute).replace(/\\/g, "/");
    problems.push(`not in manifest: ${rel}`);
  }
}

const manifestDirty = (fix && touched.length > 0) || (classificationChanged > 0 && !checkOnly);
if (manifestDirty) {
  manifest.updated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

const readJson = (file, label) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    problems.push(`${label}: ${error.message}`);
    return null;
  }
};

const schedule = fs.existsSync(SCHEDULE) ? readJson(SCHEDULE, "data/schedule.json") : null;

for (const midterm of schedule?.midterms || []) {
  if (!midterm.hallsFile) continue;
  const absolute = path.join(SITE, midterm.hallsFile.replace(/\//g, path.sep));
  if (!fs.existsSync(absolute)) problems.push(`missing hallsFile: ${midterm.hallsFile} (${midterm.subjectId})`);
}

const questions = {};
if (fs.existsSync(QUESTIONS_DIR)) {
  const entries = fs
    .readdirSync(QUESTIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const key = entry.name.slice(0, -5);
    const bank = readJson(path.join(QUESTIONS_DIR, entry.name), `data/questions/${entry.name}`);
    if (bank) questions[key] = bank;
  }
}

const embed =
  [
    `window.__SITE_DATA__ = ${JSON.stringify(manifest, null, 2)};`,
    `window.__SITE_SCHEDULE__ = ${JSON.stringify(schedule, null, 2)};`,
    `window.__SITE_QUESTIONS__ = ${JSON.stringify(questions, null, 2)};`,
    "",
  ].join("\n");

const currentEmbed = fs.existsSync(EMBED) ? fs.readFileSync(EMBED, "utf8") : null;
if (currentEmbed !== embed) {
  if (checkOnly) problems.push("assets/data.js is out of date");
  else fs.writeFileSync(EMBED, embed, "utf8");
}

const files = manifest.subjects.reduce((sum, s) => sum + s.sections.reduce((n, sec) => n + sec.files.length, 0), 0);
const bytes = manifest.subjects.reduce(
  (sum, s) => sum + s.sections.reduce((n, sec) => n + sec.files.reduce((m, f) => m + (f.size || 0), 0), 0),
  0,
);
const questionCount = Object.values(questions).reduce(
  (sum, bank) =>
    sum +
    (Array.isArray(bank) ? bank.length : Array.isArray(bank?.questions) ? bank.questions.length : 0),
  0,
);

console.log(`subjects ${manifest.subjects.length} · entries ${files} · ${(bytes / 1048576).toFixed(1)} MB`);
console.log(`schedule: ${schedule ? "yes" : "no"} · question banks: ${Object.keys(questions).length} (${questionCount} questions)`);
if (classificationChanged) {
  console.log(
    checkOnly
      ? `classification is out of date for ${classificationChanged} entries`
      : `classified ${classificationChanged} entries and saved the manifest`,
  );
}
if (fix && touched.length) console.log(`fixed ${touched.length} size/extension field(s) and saved the manifest`);

if (!problems.length) {
  console.log("manifest is in sync with files/, schedule and embedded data");
  process.exit(0);
}

console.log(`\n${problems.length} problem(s):`);
for (const problem of problems) console.log("  - " + problem);
console.log(checkOnly ? "\nfailing because --check was passed" : "\nrun with --fix to update sizes, or edit data/subjects.json");
process.exit(checkOnly ? 1 : 0);
