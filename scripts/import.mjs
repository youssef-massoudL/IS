import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const SITE = path.resolve(import.meta.dirname, "..");
const SOURCE = path.resolve(SITE, "..");
const FILES = path.join(SITE, "files");
const OUT = path.join(SITE, "data", "subjects.json");

const SUBJECTS = [
  { id: "computer-networks", name: "Computer Networks", nameAr: "شبكات الحاسب", accent: "#2563eb", icon: "lan", source: "Computer Networks" },
  { id: "database-2", name: "Database II", nameAr: "قواعد البيانات", accent: "#7c3aed", icon: "database", source: "Database II" },
  { id: "information-theory", name: "Information Theory", nameAr: "نظرية المعلومات", accent: "#0891b2", icon: "insights", source: "Information Theory" },
  { id: "research-methods", name: "Research Methods", nameAr: "مناهج البحث", accent: "#059669", icon: "science", source: "Research Methods" },
  { id: "system-analysis", name: "System Analysis", nameAr: "تحليل النظم", accent: "#d97706", icon: "schema", source: "System Analysis" },
  { id: "midterm-revision", name: "Midterm Revision", nameAr: "مراجعة الميد", accent: "#dc2626", icon: "bolt", source: "مراجعة الميد" },
];

const SECTIONS = {
  books: { nameAr: "الكتب", nameEn: "Books" },
  lectures: { nameAr: "المحاضرات", nameEn: "Lectures" },
  "original-pptx": { nameAr: "العروض الأصلية", nameEn: "Original PPTX" },
  questions: { nameAr: "الأسئلة", nameEn: "Questions" },
  summaries: { nameAr: "الملخصات", nameEn: "Summaries" },
  "midterm-revision": { nameAr: "مراجعة الميد", nameEn: "Midterm Revision" },
  "simplified-explanations": { nameAr: "شرح مبسط", nameEn: "Simplified Explanations" },
  general: { nameAr: "عام", nameEn: "General" },
  "computer-networks": { nameAr: "Computer Networks", nameEn: "Computer Networks" },
  database: { nameAr: "Database", nameEn: "Database" },
  "information-theory": { nameAr: "Information Theory", nameEn: "Information Theory" },
  research: { nameAr: "Research Methods", nameEn: "Research Methods" },
  "system-analysis": { nameAr: "System Analysis", nameEn: "System Analysis" },
};

const SECTION_ORDER = [
  "lectures", "original-pptx", "books", "questions", "summaries",
  "simplified-explanations", "midterm-revision", "computer-networks",
  "database", "information-theory", "research", "system-analysis", "general",
];

const ARABIC = {
  "شرح مبسط": "simplified",
  "درجات الميد": "midterm-grades",
  "محاضرات الميد": "midterm-lectures",
  "طلاب الفرقه الثالثه نظم معلومات": "students-list",
};

const stripNoise = (value) =>
  value.replace(/\s*-\s*copy$/i, "").replace(/\s*\(\d+\)$/i, "").trim();

const slugify = (value) =>
  stripNoise(value)
    .toLowerCase()
    .replace(/[\u0640]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const arabicSlug = (value) => {
  for (const [key, slug] of Object.entries(ARABIC)) {
    if (value.trim().startsWith(key)) return slug;
  }
  return slugify(value) || "file";
};

const prettify = (value) =>
  stripNoise(value)
    .replace(/_/g, " ")
    .replace(/([a-z])(\d)/gi, "$1 $2")
    .replace(/(\d)([a-z])/gi, "$1 $2")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word, index) =>
      index > 0 && /^(and|or|of|to|in|the|a|by|for)$/i.test(word)
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");

const pad = (value) => value.split(/[-–]/).map((part) => part.padStart(2, "0")).join("–");

const arabicMatch = (base) => Object.keys(ARABIC).find((key) => base.trim().startsWith(key));

const titleFor = (sectionId, rawStem) => {
  const base = stripNoise(rawStem).replace(/_/g, " ").replace(/\s+/g, " ").trim();
  const found = arabicMatch(base);
  const numbers = base.match(/\d+(?:\s*[-–]\s*\d+)?/);
  const num = numbers ? pad(numbers[0].replace(/\s*[-–]\s*/g, "–")) : null;

  if (sectionId === "simplified-explanations") {
    return num ? `شرح مبسط — المحاضرة ${num}` : found ?? prettify(base);
  }

  if (found) {
    return found;
  }

  if (sectionId === "lectures" || sectionId === "original-pptx") {
    if (!num) return prettify(base);
    return `${num.includes("–") ? "المحاضرات" : "المحاضرة"} ${num}`;
  }

  if (sectionId === "questions") {
    const unsolved = /unsolved/i.test(base);
    const solved = !unsolved && /solved/i.test(base);
    const status = solved ? "محلولة" : unsolved ? "غير محلولة" : "";
    return `أسئلة${num ? ` المحاضرة ${num}` : ""}${status ? ` — ${status}` : ""}`.trim();
  }

  if (sectionId === "summaries") {
    const who = /youssef nageh/i.test(base) ? " — Youssef Nageh" : "";
    return `ملخص${num ? ` المحاضرة ${num}` : ""}${who}`;
  }

  return prettify(base);
};

const firstNumber = (title) => {
  const match = title.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 9999;
};

const sortFiles = (a, b) => {
  const byNumber = firstNumber(a.title) - firstNumber(b.title);
  if (byNumber) return byNumber;
  const rank = (title) => (/غير محلولة/.test(title) ? 1 : /محلولة/.test(title) ? 0 : 2);
  const byRank = rank(a.title) - rank(b.title);
  if (byRank) return byRank;
  return a.title.localeCompare(b.title, "ar", { numeric: true });
};

const hashFile = (file) => crypto.createHash("md5").update(fs.readFileSync(file)).digest("hex");
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

const canon = new Map();
const subjects = [];
let copied = 0;

for (const subject of SUBJECTS) {
  const base = path.join(SOURCE, subject.source);
  if (!fs.existsSync(base)) throw new Error(`missing source: ${base}`);

  const sections = new Map();

  for (const full of walk(base)) {
    if (/\.exe$/i.test(full)) continue;

    const rel = path.relative(base, full);
    const lastDir = path.dirname(rel).split(path.sep).pop();
    const sectionId = lastDir && lastDir !== "." ? slugify(lastDir) : "general";
    const ext = path.extname(full).toLowerCase();
    const stem = path.basename(full, ext);
    const hash = hashFile(full);

    let target;
    if (canon.has(hash)) {
      target = canon.get(hash);
    } else {
      const outDir = path.join(FILES, subject.id, sectionId);
      fs.mkdirSync(outDir, { recursive: true });
      let slug = arabicSlug(stem);
      let dest = path.join(outDir, `${slug}${ext}`);
      let n = 2;
      while (fs.existsSync(dest)) dest = path.join(outDir, `${slug}-${n++}${ext}`);
      fs.copyFileSync(full, dest);
      target = path.posix.join("files", subject.id, sectionId, path.basename(dest));
      canon.set(hash, target);
      copied += 1;
    }

    if (!sections.has(sectionId)) sections.set(sectionId, []);
    sections.get(sectionId).push({
      id: path.basename(target, ext),
      title: titleFor(sectionId, stem),
      original: path.basename(full),
      path: target,
      ext: ext.replace(".", ""),
      size: fs.statSync(full).size,
      youtube: "",
    });
  }

  const sectionList = [...sections.entries()]
    .sort((a, b) => SECTION_ORDER.indexOf(a[0]) - SECTION_ORDER.indexOf(b[0]))
    .map(([id, files]) => ({
      id,
      name: SECTIONS[id]?.nameAr ?? prettify(id),
      nameEn: SECTIONS[id]?.nameEn ?? prettify(id),
      files: files.sort(sortFiles),
    }));

  subjects.push({
    id: subject.id,
    name: subject.name,
    nameAr: subject.nameAr,
    accent: subject.accent,
    icon: subject.icon,
    youtube: "",
    sections: sectionList,
  });
}

const manifest = {
  title: "سنة تالتة — الترم الأول",
  subtitle: "نظم المعلومات · ملازم ومحاضرات ومراجعات",
  updated: new Date().toISOString().slice(0, 10),
  subjects,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n", "utf8");

const total = subjects.reduce((sum, s) => sum + s.sections.reduce((n, sec) => n + sec.files.length, 0), 0);
console.log(`subjects: ${subjects.length}, entries: ${total}, unique files: ${copied}`);
for (const s of subjects) {
  const n = s.sections.reduce((sum, sec) => sum + sec.files.length, 0);
  console.log(`  ${s.id.padEnd(22)} ${String(n).padStart(3)} entries · ${s.sections.map((x) => x.id).join(", ")}`);
}
