import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { execFileSync } from "node:child_process";

const LOCAL_ROOT = path.resolve(import.meta.dirname, "..");

function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadDotEnv(path.join(LOCAL_ROOT, ".env"));

function normalizeGitHubRepo(raw) {
  return (
    String(raw || "youssef-massoudL/IS")
      .trim()
      .replace(/^https?:\/\/github\.com\//i, "")
      .replace(/\.git$/i, "")
      .replace(/^\/+|\/+$/g, "") || "youssef-massoudL/IS"
  );
}

const BOT_TOKEN = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
const ADMIN_ID = String(process.env.TELEGRAM_ADMIN_ID || "").trim();
const GITHUB_TOKEN = String(process.env.GITHUB_TOKEN || "")
  .trim()
  .replace(/^["']|["']$/g, "");
const GITHUB_REPO = normalizeGitHubRepo(process.env.GITHUB_REPO);
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY || "").trim();
const GEMINI_MODEL = String(process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();
const GEMINI_FALLBACK_MODELS = [
  ...new Set([
    GEMINI_MODEL,
    ...String(process.env.GEMINI_FALLBACK_MODELS || "gemini-3.8-flash,gemini-3.8-flash-lite")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean),
  ]),
];

if (!BOT_TOKEN || !ADMIN_ID) {
  console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_ID in environment / .env");
  process.exit(1);
}

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

const pending = new Map();
const mediaGroups = new Map();

const SECTION_META = {
  lectures: { name: "المحاضرات", nameEn: "Lectures" },
  summaries: { name: "الملخصات", nameEn: "Summaries" },
  questions: { name: "الأسئلة", nameEn: "Questions" },
  books: { name: "الكتب", nameEn: "Books" },
  "midterm-revision": { name: "المراجعات والملفات الشاملة", nameEn: "Comprehensive Reviews" },
};

const SLOT_CONFIG = {
  lecture: { sectionId: "lectures", kind: "lecture", label: "المحاضرة", icon: "📖" },
  summary: { sectionId: "summaries", kind: "summary", label: "الملخص", icon: "📝" },
  questions: { sectionId: "questions", kind: "questions", label: "الأسئلة", icon: "❓" },
  solution: { sectionId: "questions", kind: "solution", label: "حل الأسئلة", icon: "✅" },
};

function sanitizeError(msg) {
  let text = String(msg || "");
  if (GITHUB_TOKEN) text = text.replaceAll(GITHUB_TOKEN, "***");
  if (BOT_TOKEN) text = text.replaceAll(BOT_TOKEN, "***");
  if (GEMINI_API_KEY) text = text.replaceAll(GEMINI_API_KEY, "***");
  return text;
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function runGit(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function runNode(cwd, args) {
  return execFileSync(process.execPath, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function ensureRepo() {
  if (!GITHUB_TOKEN) {
    return LOCAL_ROOT;
  }
  const workDir = path.join(os.tmpdir(), "is-study-bot-repo");
  const remoteUrl = `https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git`;

  if (!fs.existsSync(path.join(workDir, ".git"))) {
    fs.rmSync(workDir, { recursive: true, force: true });
    execFileSync("git", ["clone", "--depth", "1", "--branch", GITHUB_BRANCH, remoteUrl, workDir], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } else {
    runGit(workDir, ["remote", "set-url", "origin", remoteUrl]);
    runGit(workDir, ["fetch", "origin", GITHUB_BRANCH, "--depth", "1"]);
    runGit(workDir, ["reset", "--hard", `origin/${GITHUB_BRANCH}`]);
    runGit(workDir, ["clean", "-fd"]);
  }

  runGit(workDir, ["config", "user.name", "Study Site Bot"]);
  runGit(workDir, ["config", "user.email", "study-bot@users.noreply.github.com"]);
  return workDir;
}

function readManifest(repoDir) {
  return JSON.parse(fs.readFileSync(path.join(repoDir, "data", "subjects.json"), "utf8"));
}

function slugify(name) {
  return (
    name
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "") || "file"
  );
}

function cleanTitleFromFilename(filename) {
  return path
    .basename(filename, path.extname(filename))
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstNumber(value) {
  const match = String(value || "").match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 9999;
}

function normalizeCompare(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, " ")
    .trim();
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function findExistingMatches(manifest, fileName, fileSize) {
  const ext = path.extname(fileName).toLowerCase() || ".pdf";
  const slug = slugify(path.basename(fileName, ext));
  const defaultTitle = cleanTitleFromFilename(fileName);
  const normOriginal = normalizeCompare(fileName);
  const normTitle = normalizeCompare(defaultTitle);

  const byPath = new Map();

  for (const subject of manifest.subjects || []) {
    for (const section of subject.sections || []) {
      for (const file of section.files || []) {
        const reasons = [];
        if (file.original && normalizeCompare(file.original) === normOriginal) {
          reasons.push("same filename");
        }
        const baseNoExt = path.basename(file.path || "", path.extname(file.path || ""));
        if (file.id === slug || baseNoExt === slug) {
          reasons.push("same file ID/slug");
        }
        if (file.title && normTitle && normalizeCompare(file.title) === normTitle) {
          reasons.push("same title");
        }
        const fileExt = `.${String(file.ext || path.extname(file.path || "").slice(1)).toLowerCase()}`;
        if (Number.isFinite(fileSize) && fileSize > 0 && file.size === fileSize && fileExt === ext) {
          reasons.push("same size & type");
        }
        if (!reasons.length) continue;

        const key = file.path || `${subject.id}/${section.id}/${file.id}`;
        const existing = byPath.get(key);
        const candidate = {
          subjectId: subject.id,
          subjectNameAr: subject.nameAr || subject.name || subject.id,
          sectionId: section.id,
          sectionName: section.name || section.id,
          file,
          reasons,
          isPrimary: subject.id !== "midterm-revision",
          score: reasons.length + (subject.id !== "midterm-revision" ? 0.5 : 0),
        };
        if (!existing) {
          byPath.set(key, candidate);
        } else if (candidate.isPrimary !== existing.isPrimary) {
          if (candidate.isPrimary) byPath.set(key, candidate);
        } else if (candidate.score > existing.score) {
          byPath.set(key, candidate);
        }
      }
    }
  }

  return Array.from(byPath.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function isArabicEntry(file) {
  const tag = String(file?.docTag || "");
  const title = String(file?.title || "");
  return tag === "نسخة عربية" || tag === "عربي" || /النسخة العربية|نسخة عربية/i.test(title);
}

function sortFiles(files) {
  files.sort((a, b) => {
    const lecA = Number.isInteger(a?.lecture) ? a.lecture : firstNumber(a?.title);
    const lecB = Number.isInteger(b?.lecture) ? b.lecture : firstNumber(b?.title);
    if (lecA !== lecB) return lecA - lecB;
    const arA = isArabicEntry(a) ? 1 : 0;
    const arB = isArabicEntry(b) ? 1 : 0;
    if (arA !== arB) return arA - arB;
    return String(a?.title || "").localeCompare(String(b?.title), "ar", { numeric: true });
  });
}

function detectLectureFromText(text) {
  const normalized = normalizeDigits(String(text || "")).toLowerCase();
  let match = normalized.match(/lec(?:ture)?[-_\s]*0*(\d{1,2})/);
  if (match) return Number(match[1]);
  match = normalized.match(/محاضر(?:ة|ه|ات)?[-_\s]*0*(\d{1,2})/);
  if (match) return Number(match[1]);
  match = normalized.match(/(?:week|الأسبوع|الاسبوع|اسبوع)[-_\s]*0*(\d{1,2})/);
  if (match) return Number(match[1]);
  return null;
}

function subjectMaxLecture(subject) {
  let max = 0;
  for (const sec of subject?.sections || []) {
    for (const f of sec.files || []) {
      if (Number.isInteger(f.lecture) && f.lecture > max) max = f.lecture;
      if (Array.isArray(f.lectureSpan)) {
        for (const n of f.lectureSpan) {
          if (Number.isInteger(n) && n > max) max = n;
        }
      }
    }
  }
  return max;
}

function getFilesInLectureSlot(subject, lectureNum, slotKind) {
  if (!subject || !Number.isInteger(lectureNum)) return [];
  const matches = [];
  for (const sec of subject.sections || []) {
    if (sec.id === "midterm-revision") continue;
    for (const f of sec.files || []) {
      const applies =
        f.lecture === lectureNum ||
        (Array.isArray(f.lectureSpan) && f.lectureSpan.includes(lectureNum));
      if (!applies) continue;
      if (slotKind && f.kind !== slotKind) continue;
      matches.push({
        subjectId: subject.id,
        subjectNameAr: subject.nameAr || subject.name || subject.id,
        sectionId: sec.id,
        sectionName: sec.name || sec.id,
        file: f,
      });
    }
  }
  return matches;
}

function buildSmartLectureTitle(slotKind, lectureNum, isArabic = false) {
  const numStr = Number.isInteger(lectureNum) ? String(lectureNum).padStart(2, "0") : "";
  let base = "";
  if (slotKind === "summary") base = numStr ? `ملخص المحاضرة ${numStr}` : "ملخص";
  else if (slotKind === "questions") base = numStr ? `أسئلة المحاضرة ${numStr}` : "أسئلة";
  else if (slotKind === "solution") base = numStr ? `حل أسئلة المحاضرة ${numStr}` : "حل الأسئلة";
  else base = numStr ? `المحاضرة ${numStr}` : "محاضرة";
  return isArabic ? `${base} — النسخة العربية` : base;
}

function ensureSubjectSection(subject, sectionId) {
  let sec = subject.sections.find((s) => s.id === sectionId);
  if (!sec) {
    const meta = SECTION_META[sectionId] || { name: sectionId, nameEn: sectionId };
    sec = { id: sectionId, name: meta.name, nameEn: meta.nameEn, files: [] };
    subject.sections.push(sec);
  }
  return sec;
}

async function tg(method, body) {
  const res = await fetch(`${API_BASE}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram ${method} failed: ${data.description || res.status}`);
  }
  return data.result;
}

async function downloadTelegramFile(fileId, destPath) {
  const fileInfo = await tg("getFile", { file_id: fileId });
  const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`;
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error(`Failed to download file: HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buffer);
  return buffer.length;
}

function addEntryToSection(section, entry) {
  if (!section.files.some((f) => f.path === entry.path)) {
    section.files.push({ ...entry });
    sortFiles(section.files);
  }
}

function findEntriesByPath(manifest, relPath) {
  const matches = [];
  for (const subject of manifest.subjects || []) {
    for (const section of subject.sections || []) {
      const files = section.files || [];
      for (let i = 0; i < files.length; i++) {
        if (files[i].path === relPath) {
          matches.push({ subject, section, file: files[i], index: i });
        }
      }
    }
  }
  return matches;
}

function searchManifestFiles(manifest, query) {
  const q = normalizeCompare(query);
  const results = [];
  for (const subject of manifest.subjects || []) {
    for (const section of subject.sections || []) {
      for (const file of section.files || []) {
        const hay = normalizeCompare(`${file.title} ${file.original || ""} ${file.path} ${file.id}`);
        if (!q || hay.includes(q)) {
          results.push({
            subjectId: subject.id,
            subjectNameAr: subject.nameAr || subject.name,
            sectionId: section.id,
            sectionName: section.name || section.id,
            file,
          });
        }
      }
    }
  }
  return results;
}

function isValidYouTubeUrl(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return host === "youtu.be" || host.endsWith("youtube.com");
  } catch {
    return false;
  }
}

function isValidHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function removeEmptyParents(dirPath, stopDir) {
  let current = path.resolve(dirPath);
  const stop = path.resolve(stopDir);
  while (current.startsWith(stop) && current !== stop) {
    try {
      const entries = fs.readdirSync(current);
      if (entries.length > 0) break;
      fs.rmdirSync(current);
      current = path.dirname(current);
    } catch {
      break;
    }
  }
}

function commitAndPush(repoDir, manifest, commitMsg) {
  const manifestPath = path.join(repoDir, "data", "subjects.json");
  manifest.updated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  runNode(repoDir, [path.join("scripts", "build.mjs"), "--fix"]);
  runNode(repoDir, [path.join("scripts", "build.mjs"), "--check"]);

  runGit(repoDir, ["add", "-A"]);
  const status = runGit(repoDir, ["status", "--porcelain"]);
  if (!status) {
    return { commit: "no-changes", changed: false };
  }

  runGit(repoDir, ["commit", "-m", commitMsg]);
  runGit(repoDir, ["push", "origin", GITHUB_BRANCH]);
  const commit = runGit(repoDir, ["rev-parse", "--short", "HEAD"]);
  return { commit, changed: true };
}

function normalizeQuestionText(q) {
  return String(q || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function extractQuestionsWithGemini(filePath, subjectId, title) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = {
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".md": "text/plain",
  };
  const mimeType = mimeMap[ext];
  if (!mimeType) {
    return { items: [], skipped: `unsupported file type (${ext})` };
  }

  const prompt = [
    `Extract all multiple-choice (mcq) and true/false (tf) questions from this document ("${title}") for subject "${subjectId}".`,
    `Return ONLY a JSON array of objects matching this exact schema:`,
    `[`,
    `  {`,
    `    "lecture": <integer lecture number if clear from document, otherwise null>,`,
    `    "difficulty": "easy" | "medium" | "hard",`,
    `    "type": "mcq" | "tf",`,
    `    "q": "<question text>",`,
    `    "options": ["<choice 0>", "<choice 1>", ...],`,
    `    "answer": <0-based integer index of the correct option>,`,
    `    "explanation": "<short English explanation>. <short Arabic explanation>"`,
    `  }`,
    `]`,
    `Rules:`,
    `- For True/False questions, use "type": "tf" and "options": ["True", "False"].`,
    `- Keep original question wording accurate; do not invent questions not in the document.`,
    `- Ensure "answer" is a valid 0-based index into "options".`,
    `- If no questions are found in the document, return [].`,
  ].join("\n");

  const fileBytes = fs.readFileSync(filePath);
  const payload = JSON.stringify({
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: fileBytes.toString("base64") } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });

  const retryableStatuses = new Set([429, 500, 502, 503, 504]);
  const maxAttemptsPerModel = 4;
  let primaryError = null;
  let lastError = null;
  let data = null;

  for (const model of GEMINI_FALLBACK_MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt += 1) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });

        if (res.ok) {
          data = await res.json();
          break;
        }

        const errText = await res.text().catch(() => "");
        const err = new Error(`Gemini API (${model}) HTTP ${res.status}: ${errText.slice(0, 200)}`);
        if (!primaryError) primaryError = err;
        if (res.status !== 404 || !lastError) lastError = err;

        if (retryableStatuses.has(res.status) && attempt < maxAttemptsPerModel) {
          const delayMs = 1500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 500);
          await sleep(delayMs);
          continue;
        }

        // Fall through to next fallback model on 404 or exhausted retries
        if (res.status === 404 || retryableStatuses.has(res.status)) {
          break;
        }
        throw err;
      } catch (err) {
        if (!primaryError) primaryError = err;
        lastError = err;
        if (attempt < maxAttemptsPerModel && !String(err.message || "").includes("HTTP 400") && !String(err.message || "").includes("HTTP 401") && !String(err.message || "").includes("HTTP 403")) {
          const delayMs = 1500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 500);
          await sleep(delayMs);
          continue;
        }
        break;
      }
    }
    if (data) break;
  }

  if (!data) {
    throw primaryError || lastError || new Error("Gemini API request failed");
  }

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  const parsed = JSON.parse(rawText);
  if (!Array.isArray(parsed)) {
    throw new Error("Gemini response was not a JSON array");
  }
  return { items: parsed };
}

async function updateQuestionBankFromUpload(repoDir, filePath, subjectId, title, defaultLecture = null) {
  const questionsDir = path.join(repoDir, "data", "questions");
  const bankPath = path.join(questionsDir, `${subjectId}.json`);
  const existing = fs.existsSync(bankPath) ? JSON.parse(fs.readFileSync(bankPath, "utf8")) : [];
  if (!Array.isArray(existing)) {
    return { added: 0, total: 0, note: "question bank file is not an array" };
  }

  const ext = path.extname(filePath).toLowerCase();
  let rawItems = [];
  if (ext === ".json") {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    rawItems = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.questions) ? parsed.questions : [];
  } else {
    if (!GEMINI_API_KEY) {
      return { added: 0, total: existing.length, note: "skipped (GEMINI_API_KEY not set)" };
    }
    const extracted = await extractQuestionsWithGemini(filePath, subjectId, title);
    if (extracted.skipped) {
      return { added: 0, total: existing.length, note: extracted.skipped };
    }
    rawItems = extracted.items;
  }

  const seenQ = new Set(existing.map((item) => normalizeQuestionText(item.q)));
  const seenIds = new Set(existing.map((item) => String(item.id || "")));
  const prefix = subjectId.split("-").map((p) => p[0]).join("") || "q";
  let nextNum = existing.length + 1;
  let added = 0;

  for (const raw of rawItems) {
    if (!raw || typeof raw.q !== "string" || !raw.q.trim()) continue;
    const normQ = normalizeQuestionText(raw.q);
    if (seenQ.has(normQ)) continue;
    const options = Array.isArray(raw.options) ? raw.options.map((o) => String(o).trim()).filter(Boolean) : [];
    const answer = Number(raw.answer);
    if (options.length < 2 || !Number.isInteger(answer) || answer < 0 || answer >= options.length) continue;

    let id = typeof raw.id === "string" && raw.id.trim() && !seenIds.has(raw.id.trim()) ? raw.id.trim() : "";
    while (!id || seenIds.has(id)) {
      id = `${prefix}-tg-${String(nextNum++).padStart(3, "0")}`;
    }

    const difficulty = ["easy", "medium", "hard"].includes(raw.difficulty) ? raw.difficulty : "medium";
    const type = ["mcq", "tf"].includes(raw.type) ? raw.type : options.length === 2 ? "tf" : "mcq";
    const lecture =
      Number.isInteger(raw.lecture) && raw.lecture > 0
        ? raw.lecture
        : Number.isInteger(defaultLecture) && defaultLecture > 0
          ? defaultLecture
          : null;
    const explanation = typeof raw.explanation === "string" ? raw.explanation.trim() : "";

    existing.push({
      id,
      subjectId,
      lecture,
      difficulty,
      type,
      q: raw.q.trim(),
      options,
      answer,
      explanation,
    });
    seenQ.add(normQ);
    seenIds.add(id);
    added++;
  }

  if (added > 0) {
    fs.mkdirSync(questionsDir, { recursive: true });
    fs.writeFileSync(bankPath, JSON.stringify(existing, null, 2) + "\n", "utf8");

    const indexPath = path.join(repoDir, "index.html");
    if (fs.existsSync(indexPath)) {
      const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
      const html = fs.readFileSync(indexPath, "utf8");
      const updatedHtml = html.replace(/assets\/data\.js\?v=[^"'\s>]+/, `assets/data.js?v=${stamp}`);
      if (updatedHtml !== html) fs.writeFileSync(indexPath, updatedHtml, "utf8");
    }
  }

  return { added, total: existing.length };
}

async function publishUpload(job) {
  const repoDir = ensureRepo();
  const manifest = readManifest(repoDir);
  const subject = manifest.subjects.find((s) => s.id === job.subjectId);
  if (!subject) throw new Error(`Unknown subject: ${job.subjectId}`);

  const nowIso = new Date().toISOString();
  const addedToSet = new Set();
  const relPaths = [];
  const savedItems = [];
  let commitAction = "Add";

  if (job.mode === "replace" && job.replaceTarget) {
    const relPath = job.replaceTarget.file.path;
    const dest = path.join(repoDir, relPath.replace(/\//g, path.sep));
    const size = await downloadTelegramFile(job.fileId, dest);
    const ext = path.extname(relPath).slice(1).toLowerCase() || "pdf";

    for (const s of manifest.subjects) {
      for (const sec of s.sections || []) {
        let updatedInSec = false;
        for (const f of sec.files || []) {
          if (f.path === relPath) {
            f.title = job.title;
            f.original = job.fileName;
            f.size = size;
            f.ext = ext;
            f.addedAt = nowIso;
            if (job.docTag !== undefined) {
              if (job.docTag) f.docTag = job.docTag;
              else delete f.docTag;
            }
            if (job.lectureNum !== undefined) {
              f.lecture = Number.isInteger(job.lectureNum) && job.lectureNum > 0 ? job.lectureNum : null;
              f.lectureLocked = true;
            }
            if (job.slotKind) {
              f.kind = job.slotKind;
              f.kindLocked = true;
            }
            if (job.info !== undefined) {
              if (job.info) f.info = job.info;
              else delete f.info;
            }
            updatedInSec = true;
          }
        }
        if (updatedInSec) {
          sortFiles(sec.files);
          addedToSet.add(`${s.id}/${sec.id} (replaced)`);
        }
      }
    }
    relPaths.push(relPath);
    savedItems.push({ path: dest, title: job.title, docTag: job.docTag || job.replaceTarget.file.docTag || "" });
    commitAction = "Update";
  } else {
    const uploadItems =
      job.isBatch && Array.isArray(job.files) && job.files.length > 0
        ? job.files
        : [
            {
              fileId: job.fileId,
              fileName: job.fileName,
              title: job.title,
              docTag: job.docTag,
              info: job.info,
            },
          ];

    const primarySectionId = job.mode === "hero" ? "midterm-revision" : job.sectionId;
    const outDir = path.join(repoDir, "files", subject.id, primarySectionId);
    fs.mkdirSync(outDir, { recursive: true });

    for (const item of uploadItems) {
      const ext = path.extname(item.fileName).toLowerCase() || ".pdf";
      const slug = slugify(path.basename(item.fileName, ext));

      let dest = path.join(outDir, `${slug}${ext}`);
      let counter = 2;
      while (fs.existsSync(dest)) {
        dest = path.join(outDir, `${slug}-${counter++}${ext}`);
      }

      const size = await downloadTelegramFile(item.fileId, dest);
      const relPath = path.posix.join("files", subject.id, primarySectionId, path.basename(dest));
      const entryId = path.basename(dest, ext);

      const baseEntry = {
        id: entryId,
        title: item.title,
        original: item.fileName,
        path: relPath,
        ext: ext.slice(1),
        size,
        youtube: "",
        addedAt: nowIso,
      };
      const effectiveTag = item.docTag !== undefined ? item.docTag : job.docTag;
      const effectiveInfo = item.info !== undefined ? item.info : job.info;
      if (effectiveTag) baseEntry.docTag = effectiveTag;
      if (effectiveInfo) baseEntry.info = effectiveInfo;

      if (job.lectureNum !== undefined) {
        baseEntry.lecture = Number.isInteger(job.lectureNum) && job.lectureNum > 0 ? job.lectureNum : null;
        baseEntry.lectureLocked = true;
      }
      if (job.slotKind) {
        baseEntry.kind = job.slotKind;
        baseEntry.kindLocked = true;
      }
      if (job.mode !== "hero" && job.mode !== "both" && Number.isInteger(job.lectureNum) && job.lectureNum > 0) {
        baseEntry.midtermReview = false;
      }

      if (job.mode === "section" || job.mode === "both") {
        const sec = ensureSubjectSection(subject, job.sectionId);
        addEntryToSection(sec, baseEntry);
        addedToSet.add(`${subject.id}/${sec.id}`);
      }

      if (job.mode === "hero" || job.mode === "both") {
        const subjMid = ensureSubjectSection(subject, "midterm-revision");
        const heroEntry =
          job.mode === "both"
            ? {
                ...baseEntry,
                lecture: null,
                kind: "review",
                midtermReview: true,
              }
            : baseEntry;
        if (job.mode === "both") {
          delete heroEntry.lectureLocked;
          delete heroEntry.kindLocked;
        }
        addEntryToSection(subjMid, heroEntry);
        addedToSet.add(`${subject.id}/midterm-revision`);
      }

      relPaths.push(relPath);
      savedItems.push({ path: dest, title: item.title, docTag: effectiveTag || "" });
    }
  }

  let questionBank = null;
  for (const saved of savedItems) {
    const isQuestionsUpload =
      job.sectionId === "questions" ||
      job.slotKind === "questions" ||
      job.slotKind === "solution" ||
      saved.docTag === "أسئلة" ||
      saved.path.toLowerCase().includes(`${path.sep}questions${path.sep}`);
    if (isQuestionsUpload) {
      try {
        const qbRes = await updateQuestionBankFromUpload(
          repoDir,
          saved.path,
          subject.id,
          saved.title,
          job.lectureNum,
        );
        if (!questionBank) questionBank = { ...qbRes };
        else {
          questionBank.added += qbRes.added || 0;
          questionBank.total = qbRes.total || questionBank.total;
          if (qbRes.note) questionBank.note = qbRes.note;
        }
      } catch (err) {
        questionBank = { added: 0, total: 0, note: `failed (${sanitizeError(err.message)})` };
      }
    }
  }

  const commitLabel =
    savedItems.length > 1
      ? `${commitAction} ${savedItems.length} files${Number.isInteger(job.lectureNum) ? ` (Lec ${job.lectureNum})` : ""} (${subject.id})`
      : `${commitAction} ${job.title} (${subject.id})`;
  const { commit } = commitAndPush(repoDir, manifest, commitLabel);
  return {
    relPath: relPaths[0] || "",
    relPaths,
    addedTo: [...addedToSet],
    commit,
    questionBank,
  };
}

function renameFileInRepo(relPath, newTitle) {
  const repoDir = ensureRepo();
  const manifest = readManifest(repoDir);
  const matches = findEntriesByPath(manifest, relPath);
  if (matches.length === 0) throw new Error(`File not found in manifest: ${relPath}`);

  const oldTitle = matches[0].file.title;
  const touchedSections = [];
  for (const m of matches) {
    m.file.title = newTitle;
    sortFiles(m.section.files);
    touchedSections.push(`${m.subject.id}/${m.section.id}`);
  }

  const { commit } = commitAndPush(repoDir, manifest, `Rename "${oldTitle}" to "${newTitle}"`);
  return { oldTitle, newTitle, relPath, touchedSections, commit };
}

function setYouTubeInRepo(relPath, youtubeUrl) {
  const repoDir = ensureRepo();
  const manifest = readManifest(repoDir);
  const matches = findEntriesByPath(manifest, relPath);
  if (matches.length === 0) throw new Error(`File not found in manifest: ${relPath}`);

  const title = matches[0].file.title;
  const touchedSections = [];
  for (const m of matches) {
    m.file.youtube = youtubeUrl;
    touchedSections.push(`${m.subject.id}/${m.section.id}`);
  }

  const action = youtubeUrl ? "Set YouTube link" : "Clear YouTube link";
  const { commit } = commitAndPush(repoDir, manifest, `${action} for ${title}`);
  return { title, youtubeUrl, touchedSections, commit };
}

function getSubjectYouTubeLinks(repoDir, subject) {
  const schedulePath = path.join(repoDir, "data", "schedule.json");
  let links = [];
  if (fs.existsSync(schedulePath)) {
    const schedule = JSON.parse(fs.readFileSync(schedulePath, "utf8"));
    const meta = schedule?.coursesMeta?.[subject.id];
    if (Array.isArray(meta?.youtubeLinks)) {
      links = meta.youtubeLinks.filter((l) => l && l.url);
    } else if (meta?.youtube) {
      links = [{ url: meta.youtube, title: meta.youtubeTitle || "شرح المادة" }];
    }
  }
  if (!links.length && subject.youtube) {
    links = [{ url: subject.youtube, title: "شرح المادة" }];
  }
  return links;
}

function setSubjectYouTubeInRepo(subjectId, youtubeUrl, linkTitle = "شرح المادة") {
  const repoDir = ensureRepo();
  const manifest = readManifest(repoDir);
  const subject = manifest.subjects.find((s) => s.id === subjectId);
  if (!subject) throw new Error(`Unknown subject: ${subjectId}`);

  const schedulePath = path.join(repoDir, "data", "schedule.json");
  if (fs.existsSync(schedulePath)) {
    const schedule = JSON.parse(fs.readFileSync(schedulePath, "utf8"));
    const meta = schedule?.coursesMeta?.[subjectId];
    if (meta) {
      if (!youtubeUrl) {
        delete meta.youtube;
        delete meta.youtubeTitle;
        meta.youtubeLinks = [];
      } else {
        if (!Array.isArray(meta.youtubeLinks)) meta.youtubeLinks = [];
        const existingIdx = meta.youtubeLinks.findIndex((l) => l && l.url === youtubeUrl);
        if (existingIdx >= 0) {
          meta.youtubeLinks[existingIdx].title = linkTitle || "شرح المادة";
        } else {
          meta.youtubeLinks.push({ url: youtubeUrl, title: linkTitle || "شرح المادة" });
        }
      }
      fs.writeFileSync(schedulePath, JSON.stringify(schedule, null, 2) + "\n", "utf8");
    }
  }

  subject.youtube = youtubeUrl || "";
  const action = youtubeUrl ? `Add YouTube link to ${subject.nameAr || subject.id}` : `Clear YouTube links for ${subject.nameAr || subject.id}`;
  const { commit } = commitAndPush(repoDir, manifest, action);
  return { subjectName: subject.nameAr || subject.name, youtubeUrl, linkTitle, commit };
}

function getSubjectExternalLinks(repoDir, subjectId) {
  const schedulePath = path.join(repoDir, "data", "schedule.json");
  if (!fs.existsSync(schedulePath)) return [];
  const schedule = JSON.parse(fs.readFileSync(schedulePath, "utf8"));
  const links = schedule?.coursesMeta?.[subjectId]?.links;
  return Array.isArray(links) ? links.filter((l) => l && l.url) : [];
}

function addSubjectLinkInRepo(subjectId, url, title = "فتح الرابط") {
  const repoDir = ensureRepo();
  const manifest = readManifest(repoDir);
  const subject = manifest.subjects.find((s) => s.id === subjectId);
  if (!subject) throw new Error(`Unknown subject: ${subjectId}`);

  const schedulePath = path.join(repoDir, "data", "schedule.json");
  if (!fs.existsSync(schedulePath)) throw new Error("data/schedule.json not found");
  const schedule = JSON.parse(fs.readFileSync(schedulePath, "utf8"));
  if (!schedule.coursesMeta) schedule.coursesMeta = {};
  if (!schedule.coursesMeta[subjectId]) schedule.coursesMeta[subjectId] = {};
  const meta = schedule.coursesMeta[subjectId];
  if (!Array.isArray(meta.links)) meta.links = [];

  const cleanTitle = String(title || "").trim() || "فتح الرابط";
  const existingIdx = meta.links.findIndex((l) => l && l.url === url);
  if (existingIdx >= 0) {
    meta.links[existingIdx].title = cleanTitle;
  } else {
    meta.links.push({ title: cleanTitle, url });
  }
  fs.writeFileSync(schedulePath, JSON.stringify(schedule, null, 2) + "\n", "utf8");

  const { commit } = commitAndPush(repoDir, manifest, `Add link "${cleanTitle}" to ${subject.nameAr || subjectId}`);
  return { subjectName: subject.nameAr || subject.name, url, title: cleanTitle, total: meta.links.length, commit };
}

function removeSubjectLinkInRepo(subjectId, kind, removeIdx) {
  const repoDir = ensureRepo();
  const manifest = readManifest(repoDir);
  const subject = manifest.subjects.find((s) => s.id === subjectId);
  if (!subject) throw new Error(`Unknown subject: ${subjectId}`);

  const schedulePath = path.join(repoDir, "data", "schedule.json");
  if (!fs.existsSync(schedulePath)) throw new Error("data/schedule.json not found");
  const schedule = JSON.parse(fs.readFileSync(schedulePath, "utf8"));
  const meta = schedule?.coursesMeta?.[subjectId];
  if (!meta) throw new Error("Subject metadata not found.");

  let removedLabel = "all links";
  if (kind === "all") {
    meta.links = [];
    meta.youtubeLinks = [];
    delete meta.youtube;
    delete meta.youtubeTitle;
    subject.youtube = "";
  } else if (kind === "yt") {
    if (!Array.isArray(meta.youtubeLinks) || !meta.youtubeLinks[removeIdx]) {
      throw new Error("YouTube link not found.");
    }
    const removed = meta.youtubeLinks.splice(removeIdx, 1)[0];
    removedLabel = removed?.title || removed?.url || "YouTube link";
    subject.youtube = meta.youtubeLinks[0]?.url || "";
  } else {
    if (!Array.isArray(meta.links) || !meta.links[removeIdx]) {
      throw new Error("Link not found.");
    }
    const removed = meta.links.splice(removeIdx, 1)[0];
    removedLabel = removed?.title || removed?.url || "link";
  }
  fs.writeFileSync(schedulePath, JSON.stringify(schedule, null, 2) + "\n", "utf8");

  const remaining = (Array.isArray(meta.links) ? meta.links.length : 0) + (Array.isArray(meta.youtubeLinks) ? meta.youtubeLinks.length : 0);
  const { commit } = commitAndPush(repoDir, manifest, `Remove link (${removedLabel}) from ${subject.nameAr || subjectId}`);
  return { subjectName: subject.nameAr || subject.name, removedLabel, remaining, commit };
}

// ---------------------------------------------------------------------------
// Weekly tasks & news (/task)
// ---------------------------------------------------------------------------

const TASK_KINDS = [
  { key: "assignment", label: "📝 تسليم (Assignment)" },
  { key: "quiz", label: "⚡ كويز (Quiz)" },
  { key: "presentation", label: "🎤 عرض (Presentation)" },
  { key: "project", label: "🛠 مشروع (Project)" },
  { key: "news", label: "📢 خبر / تنبيه (News)" },
];

const TASK_ROLES = [
  { key: "doctor", label: "👨‍🏫 دكتور" },
  { key: "ta", label: "🧑‍💻 معيد" },
  { key: "admin", label: "🏛 إدارة / عام" },
];

const TASK_ROLE_LABELS = { doctor: "دكتور", ta: "معيد", admin: "إدارة" };

function normalizeDigits(value) {
  return String(value ?? "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

function cairoDateOf(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const pick = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

function cairoDateStr(offsetDays = 0) {
  return cairoDateOf(new Date(Date.now() + Number(offsetDays || 0) * 86400000));
}

function addDaysIso(isoDate, days) {
  const [year, month, day] = String(isoDate).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + Number(days || 0)));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function isValidIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function parseSectionsInput(raw) {
  const clean = normalizeDigits(raw)
    .replace(/[–—−]/g, "-")
    .replace(/[،,]/g, " ")
    .trim();
  if (!clean) return null;

  const values = new Set();
  for (const token of clean.split(/\s+/).filter(Boolean)) {
    const range = /^(\d+)-(\d+)$/.exec(token);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start < 1 || end > 11 || start > end) return null;
      for (let n = start; n <= end; n += 1) values.add(n);
      continue;
    }
    if (!/^\d+$/.test(token)) return null;
    const n = Number(token);
    if (n < 1 || n > 11) return null;
    values.add(n);
  }
  return values.size ? [...values].sort((a, b) => a - b) : null;
}

function isWeeklyTaskExpired(task, todayIso = cairoDateStr(0)) {
  if (!task) return false;
  if (task.expiresAt && isValidIsoDate(task.expiresAt)) {
    return todayIso > task.expiresAt;
  }
  if (task.dueDate && isValidIsoDate(task.dueDate)) {
    return todayIso > addDaysIso(task.dueDate, 2);
  }
  if (task.createdAt) {
    const createdIso = cairoDateOf(task.createdAt);
    if (createdIso) return todayIso > addDaysIso(createdIso, 14);
  }
  return false;
}

function suggestTaskAuthors(schedule, subjectId, role, sections) {
  if (!schedule || !subjectId || subjectId === "general" || role === "admin") return [];
  if (role === "doctor") {
    const doctors = schedule?.coursesMeta?.[subjectId]?.doctors || [];
    return [...new Set(doctors.filter(Boolean))];
  }
  if (role !== "ta") return [];

  const timetable = schedule?.sectionsTimetable || {};
  const sectionKeys =
    sections === "all" || !sections
      ? Object.keys(timetable)
      : (Array.isArray(sections) ? sections : [sections]).map(String);
  const names = [];
  for (const key of sectionKeys) {
    for (const entry of timetable[key] || []) {
      if (entry?.subjectId !== subjectId) continue;
      const name = String(entry.instructor || "").trim();
      if (name && !names.includes(name)) names.push(name);
      if (names.length >= 6) return names;
    }
  }
  return names.slice(0, 6);
}

function taskKindLabel(kind) {
  return TASK_KINDS.find((item) => item.key === kind)?.label || kind || "—";
}

function taskSectionsLabel(sections) {
  if (sections === "all" || !sections) return "كل السكاشن (1–11)";
  if (Array.isArray(sections)) return `سكاشن ${sections.join("، ")}`;
  return String(sections);
}

function taskSubjectName(subjects, subjectId) {
  if (!subjectId || subjectId === "general") return "عام — القسم";
  const subject = (subjects || []).find((item) => item.id === subjectId);
  return subject?.nameAr || subject?.name || subjectId;
}

function formatTaskPreviewHtml(task, subjectName) {
  const lines = [
    `<b>${escapeHtml(task.title || "")}</b>`,
    `• المادة: ${escapeHtml(subjectName || "عام — القسم")}`,
    `• النوع: ${escapeHtml(taskKindLabel(task.kind))}`,
    `• السكاشن: ${escapeHtml(taskSectionsLabel(task.sections))}`,
    `• المصدر: ${escapeHtml(TASK_ROLE_LABELS[task.authorRole] || task.authorRole || "—")}${
      task.authorName ? ` — ${escapeHtml(task.authorName)}` : ""
    }`,
    `• آخر موعد: ${task.dueDate ? `<code>${escapeHtml(task.dueDate)}</code>` : "<i>بدون تاريخ</i>"}`,
  ];
  if (task.details) lines.push(`• التفاصيل: ${escapeHtml(task.details)}`);
  return lines.join("\n");
}

function readScheduleInRepo(repoDir) {
  const schedulePath = path.join(repoDir, "data", "schedule.json");
  if (!fs.existsSync(schedulePath)) throw new Error("data/schedule.json not found");
  return JSON.parse(fs.readFileSync(schedulePath, "utf8"));
}

function getWeeklyTasksFromRepo(repoDir) {
  const schedule = readScheduleInRepo(repoDir);
  return Array.isArray(schedule.weeklyTasks) ? schedule.weeklyTasks : [];
}

function addWeeklyTaskInRepo(taskData) {
  const repoDir = ensureRepo();
  const manifest = readManifest(repoDir);
  const schedulePath = path.join(repoDir, "data", "schedule.json");
  if (!fs.existsSync(schedulePath)) throw new Error("data/schedule.json not found");
  const schedule = JSON.parse(fs.readFileSync(schedulePath, "utf8"));
  if (!Array.isArray(schedule.weeklyTasks)) schedule.weeklyTasks = [];

  const title = String(taskData.title || "").trim();
  if (!title) throw new Error("Task title is required.");

  let id = `task-${cairoDateStr(0).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8)}`;
  while (schedule.weeklyTasks.some((task) => task?.id === id)) {
    id = `task-${cairoDateStr(0).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8)}`;
  }

  const task = {
    id,
    subjectId: taskData.subjectId || "general",
    kind: taskData.kind || "news",
    title,
    details: String(taskData.details || "").trim(),
    authorRole: taskData.authorRole || "admin",
    authorName: String(taskData.authorName || "").trim(),
    sections: taskData.sections === "all" ? "all" : Array.isArray(taskData.sections) ? [...taskData.sections] : "all",
    dueDate: taskData.dueDate || null,
    expiresAt: taskData.expiresAt || null,
    createdAt: new Date().toISOString(),
  };

  schedule.weeklyTasks.push(task);
  fs.writeFileSync(schedulePath, JSON.stringify(schedule, null, 2) + "\n", "utf8");

  const { commit } = commitAndPush(repoDir, manifest, `Add weekly task: ${task.title.slice(0, 50)}`);
  return { task, total: schedule.weeklyTasks.length, commit };
}

function removeWeeklyTaskInRepo(taskId) {
  const repoDir = ensureRepo();
  const manifest = readManifest(repoDir);
  const schedulePath = path.join(repoDir, "data", "schedule.json");
  if (!fs.existsSync(schedulePath)) throw new Error("data/schedule.json not found");
  const schedule = JSON.parse(fs.readFileSync(schedulePath, "utf8"));
  if (!Array.isArray(schedule.weeklyTasks)) schedule.weeklyTasks = [];

  const idx = schedule.weeklyTasks.findIndex((task) => task?.id === taskId);
  if (idx < 0) throw new Error("Weekly task not found (it may have already been removed).");
  const [removed] = schedule.weeklyTasks.splice(idx, 1);
  fs.writeFileSync(schedulePath, JSON.stringify(schedule, null, 2) + "\n", "utf8");

  const { commit } = commitAndPush(repoDir, manifest, `Remove weekly task: ${String(removed.title || taskId).slice(0, 50)}`);
  return { removed, remaining: schedule.weeklyTasks.length, commit };
}

function pruneExpiredTasksInRepo() {
  const repoDir = ensureRepo();
  const manifest = readManifest(repoDir);
  const schedulePath = path.join(repoDir, "data", "schedule.json");
  if (!fs.existsSync(schedulePath)) throw new Error("data/schedule.json not found");
  const schedule = JSON.parse(fs.readFileSync(schedulePath, "utf8"));
  const tasks = Array.isArray(schedule.weeklyTasks) ? schedule.weeklyTasks : [];
  const kept = tasks.filter((task) => !isWeeklyTaskExpired(task));
  const removedCount = tasks.length - kept.length;
  if (removedCount === 0) {
    return { removedCount: 0, remaining: kept.length, commit: "no-changes" };
  }

  schedule.weeklyTasks = kept;
  fs.writeFileSync(schedulePath, JSON.stringify(schedule, null, 2) + "\n", "utf8");
  const { commit } = commitAndPush(repoDir, manifest, `Prune ${removedCount} expired weekly task(s)`);
  return { removedCount, remaining: kept.length, commit };
}

function taskCancelRow() {
  return [{ text: "❌ Cancel", callback_data: "cancel" }];
}

function taskSubjectsKeyboard(subjects) {
  const rows = (subjects || []).map((subject, idx) => [
    { text: subject.nameAr || subject.name || subject.id, callback_data: `task:subj:${idx}` },
  ]);
  rows.push([{ text: "🏛 عام — القسم كله", callback_data: "task:subj:general" }]);
  rows.push(taskCancelRow());
  return { inline_keyboard: rows };
}

function taskKindsKeyboard() {
  const rows = TASK_KINDS.map((kind) => [{ text: kind.label, callback_data: `task:kind:${kind.key}` }]);
  rows.push(taskCancelRow());
  return { inline_keyboard: rows };
}

function taskSectionsKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "👥 كل السكاشن (1–11)", callback_data: "task:sec:all" }],
      [{ text: "🎯 سكاشن معينة", callback_data: "task:sec:custom" }],
      taskCancelRow(),
    ],
  };
}

function taskRolesKeyboard() {
  const rows = TASK_ROLES.map((role) => [{ text: role.label, callback_data: `task:role:${role.key}` }]);
  rows.push(taskCancelRow());
  return { inline_keyboard: rows };
}

function taskAuthorsKeyboard(suggestions) {
  const rows = (suggestions || []).map((name, idx) => [{ text: name, callback_data: `task:author:pick:${idx}` }]);
  rows.push([{ text: "⏭ تخطي الاسم", callback_data: "task:author:skip" }]);
  rows.push(taskCancelRow());
  return { inline_keyboard: rows };
}

function taskDueKeyboard() {
  return {
    inline_keyboard: [
      [{ text: `📌 اليوم (${cairoDateStr(0)})`, callback_data: "task:due:today" }],
      [{ text: `📅 غداً (${cairoDateStr(1)})`, callback_data: "task:due:tomorrow" }],
      [{ text: `🗓 بعد 3 أيام (${cairoDateStr(3)})`, callback_data: "task:due:3d" }],
      [{ text: `🗓 بعد أسبوع (${cairoDateStr(7)})`, callback_data: "task:due:7d" }],
      [{ text: "⏭ بدون تاريخ محدد", callback_data: "task:due:skip" }],
      taskCancelRow(),
    ],
  };
}

async function askTaskSubjectStep(chatId, job) {
  job.step = "task_subject";
  await tg("sendMessage", {
    chat_id: chatId,
    text: "1️⃣ <b>اختر المادة</b> الخاصة بالمهمة أو الخبر:",
    parse_mode: "HTML",
    reply_markup: taskSubjectsKeyboard(job.subjects),
  });
}

async function askTaskKindStep(chatId, job) {
  job.step = "task_kind";
  await tg("sendMessage", {
    chat_id: chatId,
    text: "2️⃣ <b>اختر النوع:</b>",
    parse_mode: "HTML",
    reply_markup: taskKindsKeyboard(),
  });
}

async function askTaskSectionsStep(chatId, job) {
  job.step = "task_sections_pick";
  await tg("sendMessage", {
    chat_id: chatId,
    text: "3️⃣ <b>السكاشن المستهدفة:</b>",
    parse_mode: "HTML",
    reply_markup: taskSectionsKeyboard(),
  });
}

async function askTaskSectionsCustomStep(chatId, job) {
  job.step = "task_sections";
  await tg("sendMessage", {
    chat_id: chatId,
    text:
      "🎯 اكتب أرقام السكاشن (مثال: <code>1, 2, 3</code> أو <code>4-6</code>).\n" +
      "المسموح من 1 إلى 11.",
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [taskCancelRow()] },
  });
}

async function askTaskRoleStep(chatId, job) {
  job.step = "task_role";
  await tg("sendMessage", {
    chat_id: chatId,
    text: "4️⃣ <b>صاحب المهمة:</b>",
    parse_mode: "HTML",
    reply_markup: taskRolesKeyboard(),
  });
}

async function askTaskAuthorStep(chatId, job) {
  job.step = "task_author";
  job.suggestedAuthors = suggestTaskAuthors(job.schedule, job.draft.subjectId, job.draft.authorRole, job.draft.sections);
  const hasSuggestions = job.suggestedAuthors.length > 0;
  await tg("sendMessage", {
    chat_id: chatId,
    text: hasSuggestions
      ? "5️⃣ <b>اسم الدكتور / المعيد</b>\nاختر من الأزرار أو اكتب الاسم بنفسك:"
      : "5️⃣ <b>اسم الدكتور / المعيد</b>\nاكتب الاسم أو اضغط تخطي:",
    parse_mode: "HTML",
    reply_markup: taskAuthorsKeyboard(job.suggestedAuthors),
  });
}

async function askTaskTitleStep(chatId, job) {
  job.step = "task_title";
  await tg("sendMessage", {
    chat_id: chatId,
    text: "6️⃣ ✏️ <b>اكتب عنوان المهمة أو الخبر</b>\nمثال: كويز على المحاضرة 5 و 6",
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [taskCancelRow()] },
  });
}

async function askTaskDetailsStep(chatId, job) {
  job.step = "task_details";
  await tg("sendMessage", {
    chat_id: chatId,
    text: "7️⃣ 📄 <b>تفاصيل إضافية</b> (القاعة، المطلوب تسليمه، رابط...) أو اضغط تخطي:",
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "⏭ تخطي التفاصيل", callback_data: "task:details:skip" }],
        taskCancelRow(),
      ],
    },
  });
}

async function askTaskDueStep(chatId, job) {
  job.step = "task_due";
  await tg("sendMessage", {
    chat_id: chatId,
    text: "8️⃣ 📅 <b>آخر موعد</b>\nاختر بسرعة أو اكتب التاريخ بصيغة <code>YYYY-MM-DD</code>:",
    parse_mode: "HTML",
    reply_markup: taskDueKeyboard(),
  });
}

async function askTaskConfirmStep(chatId, job) {
  job.step = "task_confirm";
  await tg("sendMessage", {
    chat_id: chatId,
    text:
      "✅ <b>معاينة قبل النشر</b>\n\n" +
      formatTaskPreviewHtml(job.draft, taskSubjectName(job.subjects, job.draft.subjectId)),
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ نشر على الموقع", callback_data: "task:confirm:save" }],
        taskCancelRow(),
      ],
    },
  });
}

function taskListKeyboard(tasks) {
  const rows = (tasks || []).map((task, idx) => {
    const title = String(task?.title || "مهمة").replace(/\s+/g, " ").trim();
    const short = title.length > 36 ? `${title.slice(0, 33)}...` : title;
    return [{ text: `🗑 ${short}`, callback_data: `task:del:${idx}` }];
  });
  rows.push([{ text: "➕ إضافة مهمة جديدة", callback_data: "task:menu:add" }]);
  rows.push(taskCancelRow());
  return { inline_keyboard: rows };
}

async function handleTaskCallback(chatId, job, data) {
  if (job.flow !== "task") {
    await tg("sendMessage", { chat_id: chatId, text: "Session expired. Send /task to start again." });
    return;
  }

  if (data === "task:menu:add") {
    job.draft = {
      subjectId: null,
      kind: null,
      sections: "all",
      authorRole: null,
      authorName: "",
      title: "",
      details: "",
      dueDate: null,
      expiresAt: null,
    };
    await askTaskSubjectStep(chatId, job);
    return;
  }

  if (data === "task:menu:list") {
    const tasks = Array.isArray(job.currentTasks) ? job.currentTasks : [];
    if (tasks.length === 0) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "📋 لا توجد مهام حالياً.",
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [[{ text: "➕ إضافة مهمة", callback_data: "task:menu:add" }], taskCancelRow()] },
      });
      return;
    }
    const summary = tasks
      .map((task, idx) => {
        const expired = isWeeklyTaskExpired(task) ? " <b>[منتهي]</b>" : "";
        const subject = taskSubjectName(job.subjects, task.subjectId);
        const due = task.dueDate ? ` · ${escapeHtml(task.dueDate)}` : "";
        return `${idx + 1}. <b>${escapeHtml(task.title || "بدون عنوان")}</b>${expired}\n   • ${escapeHtml(subject)} · ${escapeHtml(
          taskKindLabel(task.kind),
        )} · ${escapeHtml(taskSectionsLabel(task.sections))}${due}`;
      })
      .join("\n\n");
    await tg("sendMessage", {
      chat_id: chatId,
      text: `📋 <b>المهام الحالية (${tasks.length}):</b>\n\n${summary}\n\nاختر مهمة لحذفها:`,
      parse_mode: "HTML",
      reply_markup: taskListKeyboard(tasks),
    });
    return;
  }

  if (data === "task:menu:prune") {
    pending.delete(chatId);
    await tg("sendMessage", { chat_id: chatId, text: "🧹 جاري تنظيف المهام المنتهية والنشر..." });
    const res = pruneExpiredTasksInRepo();
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        res.removedCount > 0
          ? `✅ <b>تم التنظيف!</b>\n• تم حذف: ${res.removedCount}\n• المتبقي: ${res.remaining}\n• Commit: <code>${escapeHtml(res.commit)}</code>`
          : `ℹ️ لا توجد مهام منتهية.\n• المتبقي: ${res.remaining}`,
      parse_mode: "HTML",
      reply_markup: START_KEYBOARD,
    });
    return;
  }

  if (data.startsWith("task:subj:")) {
    const raw = data.slice("task:subj:".length);
    if (raw === "general") {
      job.draft.subjectId = "general";
    } else {
      const idx = Number.parseInt(raw, 10);
      const subject = job.subjects?.[idx];
      if (!subject) return;
      job.draft.subjectId = subject.id;
    }
    await askTaskKindStep(chatId, job);
    return;
  }

  if (data.startsWith("task:kind:")) {
    const kind = data.slice("task:kind:".length);
    if (!TASK_KINDS.some((item) => item.key === kind)) return;
    job.draft.kind = kind;
    await askTaskSectionsStep(chatId, job);
    return;
  }

  if (data === "task:sec:all") {
    job.draft.sections = "all";
    await askTaskRoleStep(chatId, job);
    return;
  }

  if (data === "task:sec:custom") {
    await askTaskSectionsCustomStep(chatId, job);
    return;
  }

  if (data.startsWith("task:role:")) {
    const role = data.slice("task:role:".length);
    if (!TASK_ROLES.some((item) => item.key === role)) return;
    job.draft.authorRole = role;
    await askTaskAuthorStep(chatId, job);
    return;
  }

  if (data.startsWith("task:author:pick:")) {
    const idx = Number.parseInt(data.slice("task:author:pick:".length), 10);
    const name = job.suggestedAuthors?.[idx];
    if (!name) return;
    job.draft.authorName = name;
    await askTaskTitleStep(chatId, job);
    return;
  }

  if (data === "task:author:skip") {
    job.draft.authorName = "";
    await askTaskTitleStep(chatId, job);
    return;
  }

  if (data === "task:details:skip") {
    job.draft.details = "";
    await askTaskDueStep(chatId, job);
    return;
  }

  if (data.startsWith("task:due:")) {
    const option = data.slice("task:due:".length);
    const offsets = { today: 0, tomorrow: 1, "3d": 3, "7d": 7 };
    if (option === "skip") {
      job.draft.dueDate = null;
    } else if (Object.prototype.hasOwnProperty.call(offsets, option)) {
      job.draft.dueDate = cairoDateStr(offsets[option]);
    } else {
      return;
    }
    await askTaskConfirmStep(chatId, job);
    return;
  }

  if (data === "task:confirm:save") {
    pending.delete(chatId);
    await tg("sendMessage", { chat_id: chatId, text: "⏳ جاري النشر على الموقع..." });
    const res = addWeeklyTaskInRepo(job.draft);
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `✅ <b>تم نشر المهمة!</b>\n` +
        `• العنوان: ${escapeHtml(res.task.title)}\n` +
        `• المادة: ${escapeHtml(taskSubjectName(job.subjects, res.task.subjectId))}\n` +
        `• إجمالي المهام: ${res.total}\n` +
        `• Commit: <code>${escapeHtml(res.commit)}</code>\n\n` +
        `ستظهر في قسم "أخبار ومطلوب الأسبوع" خلال دقيقة.`,
      parse_mode: "HTML",
      reply_markup: START_KEYBOARD,
    });
    return;
  }

  if (data.startsWith("task:del:")) {
    const idx = Number.parseInt(data.slice("task:del:".length), 10);
    const task = job.currentTasks?.[idx];
    if (!task) {
      await tg("sendMessage", { chat_id: chatId, text: "المهمة غير موجودة. أرسل /task من جديد." });
      return;
    }
    job.deleteTargetId = task.id;
    job.deleteTargetTitle = task.title;
    job.deleteTargetIdx = idx;
    await tg("sendMessage", {
      chat_id: chatId,
      text: `⚠️ <b>تأكيد الحذف</b>\n\nهل تريد حذف:\n<b>${escapeHtml(task.title || "بدون عنوان")}</b>؟`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ تأكيد الحذف", callback_data: `task:del_confirm:${idx}` }],
          taskCancelRow(),
        ],
      },
    });
    return;
  }

  if (data.startsWith("task:del_confirm:")) {
    const idx = Number.parseInt(data.slice("task:del_confirm:".length), 10);
    const taskId = job.deleteTargetId || job.currentTasks?.[idx]?.id;
    if (!taskId) {
      await tg("sendMessage", { chat_id: chatId, text: "المهمة غير موجودة. أرسل /task من جديد." });
      return;
    }
    pending.delete(chatId);
    await tg("sendMessage", { chat_id: chatId, text: "⏳ جاري حذف المهمة والنشر..." });
    const res = removeWeeklyTaskInRepo(taskId);
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `✅ <b>تم حذف المهمة!</b>\n` +
        `• العنوان: ${escapeHtml(res.removed.title || taskId)}\n` +
        `• المتبقي: ${res.remaining}\n` +
        `• Commit: <code>${escapeHtml(res.commit)}</code>`,
      parse_mode: "HTML",
      reply_markup: START_KEYBOARD,
    });
  }
}

function setInfoInRepo(relPath, infoText) {
  const repoDir = ensureRepo();
  const manifest = readManifest(repoDir);
  const matches = findEntriesByPath(manifest, relPath);
  if (matches.length === 0) throw new Error(`File not found in manifest: ${relPath}`);

  const title = matches[0].file.title;
  const touchedSections = [];
  for (const m of matches) {
    if (infoText) m.file.info = infoText;
    else delete m.file.info;
    touchedSections.push(`${m.subject.id}/${m.section.id}`);
  }

  const action = infoText ? "Set info note" : "Clear info note";
  const { commit } = commitAndPush(repoDir, manifest, `${action} for ${title}`);
  return { title, infoText, touchedSections, commit };
}

function setDocTagInRepo(relPath, docTag) {
  const repoDir = ensureRepo();
  const manifest = readManifest(repoDir);
  const matches = findEntriesByPath(manifest, relPath);
  if (matches.length === 0) throw new Error(`File not found in manifest: ${relPath}`);

  const title = matches[0].file.title;
  const touchedSections = [];
  for (const m of matches) {
    if (docTag) m.file.docTag = docTag;
    else delete m.file.docTag;
    touchedSections.push(`${m.subject.id}/${m.section.id}`);
  }

  const action = docTag ? `Set label "${docTag}"` : "Clear label";
  const { commit } = commitAndPush(repoDir, manifest, `${action} for ${title}`);
  return { title, docTag, touchedSections, commit };
}

function moveFileInRepo(source, destSubjectId, destSectionId) {
  const repoDir = ensureRepo();
  const manifest = readManifest(repoDir);

  const srcSubj = manifest.subjects.find((s) => s.id === source.subjectId);
  const srcSec = srcSubj?.sections.find((s) => s.id === source.sectionId);
  const srcIdx = srcSec?.files.findIndex((f) => f.path === source.file.path) ?? -1;
  if (!srcSubj || !srcSec || srcIdx === -1) {
    throw new Error("Source file no longer exists in manifest.");
  }
  if (source.subjectId === destSubjectId && source.sectionId === destSectionId) {
    throw new Error("Source and destination are the same.");
  }

  const dstSubj = manifest.subjects.find((s) => s.id === destSubjectId);
  if (!dstSubj) throw new Error(`Unknown destination subject: ${destSubjectId}`);
  let dstSec = dstSubj.sections.find((s) => s.id === destSectionId);
  if (!dstSec) {
    dstSec = { id: destSectionId, name: destSectionId, nameEn: destSectionId, files: [] };
    dstSubj.sections.push(dstSec);
  }

  const entry = { ...srcSec.files[srcIdx] };
  const oldRelPath = entry.path;
  let newRelPath = oldRelPath;

  // Move physical file if moving into a non-virtual subject folder and no other section needs the old path
  const otherRefs = findEntriesByPath(manifest, oldRelPath).filter(
    (m) => !(m.subject.id === source.subjectId && m.section.id === source.sectionId),
  );

  if (destSubjectId !== "midterm-revision" && otherRefs.length === 0) {
    const oldAbs = path.join(repoDir, oldRelPath.replace(/\//g, path.sep));
    const ext = path.extname(oldRelPath) || `.${entry.ext || "pdf"}`;
    const base = path.basename(oldRelPath, ext);
    const outDir = path.join(repoDir, "files", destSubjectId, destSectionId);
    fs.mkdirSync(outDir, { recursive: true });

    let destAbs = path.join(outDir, `${base}${ext}`);
    let counter = 2;
    while (fs.existsSync(destAbs) && path.resolve(destAbs) !== path.resolve(oldAbs)) {
      destAbs = path.join(outDir, `${base}-${counter++}${ext}`);
    }

    if (fs.existsSync(oldAbs) && path.resolve(destAbs) !== path.resolve(oldAbs)) {
      fs.renameSync(oldAbs, destAbs);
      removeEmptyParents(path.dirname(oldAbs), path.join(repoDir, "files"));
    }
    newRelPath = path.posix.join("files", destSubjectId, destSectionId, path.basename(destAbs));
    entry.path = newRelPath;
    entry.id = path.basename(destAbs, ext);
  }

  srcSec.files.splice(srcIdx, 1);
  addEntryToSection(dstSec, entry);

  const { commit } = commitAndPush(
    repoDir,
    manifest,
    `Move ${entry.title} from ${source.subjectId}/${source.sectionId} to ${destSubjectId}/${destSectionId}`,
  );
  return { title: entry.title, oldRelPath, newRelPath, dest: `${destSubjectId}/${destSectionId}`, commit };
}

function deleteFileInRepo(relPath, subjectId, sectionId, deleteAll) {
  const repoDir = ensureRepo();
  const manifest = readManifest(repoDir);
  const matches = findEntriesByPath(manifest, relPath);
  if (matches.length === 0) throw new Error(`File not found in manifest: ${relPath}`);

  const title = matches[0].file.title;
  const removedFrom = [];

  for (const subject of manifest.subjects || []) {
    for (const section of subject.sections || []) {
      const shouldRemove = deleteAll || (subject.id === subjectId && section.id === sectionId);
      if (!shouldRemove) continue;
      const before = section.files.length;
      section.files = section.files.filter((f) => f.path !== relPath);
      if (section.files.length < before) {
        removedFrom.push(`${subject.id}/${section.id}`);
      }
    }
  }

  const remaining = findEntriesByPath(manifest, relPath);
  let deletedFromDisk = false;
  if (remaining.length === 0) {
    const absPath = path.join(repoDir, relPath.replace(/\//g, path.sep));
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
      removeEmptyParents(path.dirname(absPath), path.join(repoDir, "files"));
      deletedFromDisk = true;
    }
  }

  const { commit } = commitAndPush(repoDir, manifest, `Delete ${title} (${removedFrom.join(", ")})`);
  return { title, relPath, removedFrom, deletedFromDisk, commit };
}

function getRepoStatus() {
  const repoDir = ensureRepo();
  const manifest = readManifest(repoDir);
  const logLine = runGit(repoDir, ["log", "-1", "--format=%h|%s|%cr|%ci"]);
  const [sha, message, relTime, isoTime] = logLine.split("|");

  const uniquePaths = new Set();
  let totalEntries = 0;
  for (const s of manifest.subjects || []) {
    for (const sec of s.sections || []) {
      for (const f of sec.files || []) {
        totalEntries++;
        if (f.path) uniquePaths.add(f.path);
      }
    }
  }

  return {
    repo: GITHUB_REPO,
    branch: GITHUB_BRANCH,
    sha,
    message,
    relTime,
    isoTime,
    updated: manifest.updated,
    subjectsCount: (manifest.subjects || []).length,
    uniqueFiles: uniquePaths.size,
    totalEntries,
  };
}

function getRecentCommits(limit = 5) {
  const repoDir = ensureRepo();
  const raw = runGit(repoDir, ["log", `-n`, String(limit), "--format=%h|%s|%cr"]);
  return raw
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [sha, message, relTime] = line.split("|");
      return { sha, message, relTime };
    });
}

function revertCommitInRepo(sha) {
  const repoDir = ensureRepo();
  runGit(repoDir, ["revert", "--no-edit", sha]);
  runNode(repoDir, [path.join("scripts", "build.mjs"), "--check"]);
  runGit(repoDir, ["push", "origin", GITHUB_BRANCH]);
  const newSha = runGit(repoDir, ["rev-parse", "--short", "HEAD"]);
  return { revertedSha: sha, newSha };
}

function setLectureAndKindInRepo(relPath, lectureNum, slotKind) {
  const repoDir = ensureRepo();
  const manifest = readManifest(repoDir);
  const matches = findEntriesByPath(manifest, relPath);
  if (matches.length === 0) throw new Error(`File not found in manifest: ${relPath}`);

  const title = matches[0].file.title;
  const touchedSections = [];
  for (const m of matches) {
    if (lectureNum !== undefined) {
      m.file.lecture = Number.isInteger(lectureNum) && lectureNum > 0 ? lectureNum : null;
      m.file.lectureLocked = true;
    }
    if (slotKind) {
      m.file.kind = slotKind;
      m.file.kindLocked = true;
    }
    if (m.section.id !== "midterm-revision" && Number.isInteger(m.file.lecture) && m.file.lecture > 0) {
      m.file.midtermReview = false;
    }
    sortFiles(m.section.files);
    touchedSections.push(`${m.subject.id}/${m.section.id}`);
  }

  const lecLabel = Number.isInteger(lectureNum) && lectureNum > 0 ? `Lec ${lectureNum}` : "General";
  const { commit } = commitAndPush(repoDir, manifest, `Set ${title} -> ${lecLabel}${slotKind ? ` (${slotKind})` : ""}`);
  return { title, lectureNum, slotKind, touchedSections, commit };
}

function subjectKeyboard(subjects) {
  return {
    inline_keyboard: subjects
      .filter((s) => s.id !== "midterm-revision")
      .map((s) => [{ text: `${s.nameAr} (${s.name})`, callback_data: `subj:${s.id}` }]),
  };
}

function destinationKeyboard(subject) {
  const rows = [
    [
      { text: "📖 محاضرة (Lecture)", callback_data: "dest:slot:lecture" },
      { text: "📝 ملخص (Summary)", callback_data: "dest:slot:summary" },
    ],
    [
      { text: "❓ أسئلة (Questions)", callback_data: "dest:slot:questions" },
      { text: "✅ حل أسئلة (Solution)", callback_data: "dest:slot:solution" },
    ],
    [
      { text: "⭐ Hero Review", callback_data: "dest:hero" },
      { text: "📚 Summary + Hero", callback_data: "dest:both:summaries" },
    ],
  ];
  const coreIds = new Set(["lectures", "summaries", "questions", "midterm-revision"]);
  for (const sec of subject.sections || []) {
    if (coreIds.has(sec.id)) continue;
    rows.push([{ text: `📁 ${sec.name} (${sec.id})`, callback_data: `dest:sec:${sec.id}` }]);
  }
  if (!(subject.sections || []).some((s) => s.id === "books")) {
    rows.push([{ text: "📕 كتاب / مرجع (Books)", callback_data: "dest:sec:books" }]);
  }
  rows.push([{ text: "❌ Cancel", callback_data: "cancel" }]);
  return { inline_keyboard: rows };
}

function lectureNumberKeyboard(subject, slotKind, detectedLecture = null, prefix = "lec") {
  const maxLec = subjectMaxLecture(subject);
  const count = Math.max(8, Math.min(16, maxLec + 2));
  const rows = [];

  if (Number.isInteger(detectedLecture) && detectedLecture > 0) {
    const existingCount = getFilesInLectureSlot(subject, detectedLecture, slotKind).length;
    const suffix = existingCount > 0 ? ` (${existingCount})` : "";
    rows.push([{ text: `✨ Detected: Lec ${detectedLecture}${suffix}`, callback_data: `${prefix}:${detectedLecture}` }]);
  }

  for (let start = 1; start <= count; start += 4) {
    const row = [];
    for (let n = start; n < start + 4 && n <= count; n += 1) {
      const existingCount = getFilesInLectureSlot(subject, n, slotKind).length;
      const suffix = existingCount > 0 ? ` (${existingCount})` : "";
      row.push({ text: `Lec ${n}${suffix}`, callback_data: `${prefix}:${n}` });
    }
    rows.push(row);
  }

  rows.push([
    { text: "🔢 Type # (أخرى)", callback_data: `${prefix}:custom` },
    { text: "📁 General (بدون رقم)", callback_data: `${prefix}:none` },
  ]);
  rows.push([{ text: "❌ Cancel", callback_data: "cancel" }]);
  return { inline_keyboard: rows };
}

function slotActionKeyboard(existingMatches) {
  const rows = [
    [{ text: "🇸🇦 Add beneath as Arabic Version (نسخة عربية)", callback_data: "slotact:arabic" }],
    [{ text: "➕ Add beneath as 2nd file (Extra)", callback_data: "slotact:second" }],
  ];
  existingMatches.slice(0, 3).forEach((m, idx) => {
    const label = String(m.file.title || "file");
    const short = label.length > 30 ? label.slice(0, 27) + "..." : label;
    rows.push([{ text: `🔄 Replace "${short}"`, callback_data: `slotact:replace:${idx}` }]);
  });
  rows.push([{ text: "❌ Cancel", callback_data: "cancel" }]);
  return { inline_keyboard: rows };
}

function batchModeKeyboard(job) {
  const rows = [];
  if (job.files.length === 2 && Number.isInteger(job.lectureNum)) {
    const mainTitle = buildSmartLectureTitle(job.slotKind, job.lectureNum, false);
    const arTitle = buildSmartLectureTitle(job.slotKind, job.lectureNum, true);
    rows.push([{ text: `🇸🇦 #1 "${mainTitle}" + #2 "${arTitle}"`, callback_data: "batch:arabic" }]);
  }
  rows.push([{ text: "📄 Use filenames as titles", callback_data: "batch:filenames" }]);
  rows.push([{ text: "✏️ Send custom titles (line by line)", callback_data: "batch:custom" }]);
  rows.push([{ text: "❌ Cancel", callback_data: "cancel" }]);
  return { inline_keyboard: rows };
}

function docTagKeyboard(prefix = "tag") {
  return {
    inline_keyboard: [
      [
        { text: "📝 ملخص", callback_data: `${prefix}:ملخص` },
        { text: "❓ أسئلة", callback_data: `${prefix}:أسئلة` },
      ],
      [
        { text: "🇸🇦 نسخة عربية", callback_data: `${prefix}:نسخة عربية` },
        { text: "📌 مراجعة", callback_data: `${prefix}:مراجعة` },
      ],
      [{ text: "🚫 بدون شارة", callback_data: `${prefix}:none` }],
      [{ text: "❌ Cancel", callback_data: "cancel" }],
    ],
  };
}

function uploadInfoKeyboard(existingInfo) {
  const rows = [];
  if (existingInfo) {
    const preview = existingInfo.length > 28 ? existingInfo.slice(0, 25) + "..." : existingInfo;
    rows.push([{ text: `✅ Keep "${preview}"`, callback_data: "upload_info:keep" }]);
  }
  rows.push([{ text: "⏭ Skip (No Info Icon)", callback_data: "upload_info:skip" }]);
  rows.push([{ text: "❌ Cancel", callback_data: "cancel" }]);
  return { inline_keyboard: rows };
}

async function askInfoStep(chatId, job) {
  job.step = "upload_info";
  const existing = job.mode === "replace" ? job.replaceTarget?.file?.info || "" : "";
  await tg("sendMessage", {
    chat_id: chatId,
    text:
      `ℹ️ <b>Optional Info Icon (ⓘ)</b>\n` +
      `Send a short note so students know what this file covers (e.g. "ملخص أول 4 محاضرات"), or tap <b>Skip</b>:`,
    parse_mode: "HTML",
    reply_markup: uploadInfoKeyboard(existing),
  });
}

function titleKeyboard(defaultTitle, job = null) {
  const rows = [];
  if (job && Number.isInteger(job.lectureNum) && job.slotKind) {
    const smartTitle = buildSmartLectureTitle(job.slotKind, job.lectureNum, false);
    const arabicTitle = buildSmartLectureTitle(job.slotKind, job.lectureNum, true);
    if (job.variant === "arabic") {
      rows.push([{ text: `🇸🇦 Use "${arabicTitle}"`, callback_data: "title:arabic" }]);
    }
    rows.push([{ text: `✅ Use "${smartTitle}"`, callback_data: "title:smart" }]);
    if (job.variant !== "arabic") {
      rows.push([{ text: `🇸🇦 Arabic: "${arabicTitle}"`, callback_data: "title:arabic" }]);
    }
    if (defaultTitle && defaultTitle !== smartTitle && defaultTitle !== arabicTitle) {
      const preview = defaultTitle.length > 35 ? defaultTitle.slice(0, 32) + "..." : defaultTitle;
      rows.push([{ text: `📄 Use "${preview}"`, callback_data: "title:default" }]);
    }
  } else {
    const preview = defaultTitle.length > 35 ? defaultTitle.slice(0, 32) + "..." : defaultTitle;
    rows.push([{ text: `✅ Use "${preview}"`, callback_data: "title:default" }]);
  }
  rows.push([{ text: "❌ Cancel", callback_data: "cancel" }]);
  return { inline_keyboard: rows };
}

function duplicateKeyboard(matches) {
  const rows = matches.map((m, idx) => {
    const label = `${m.file.title} (${m.subjectNameAr})`;
    const shortLabel = label.length > 34 ? label.slice(0, 31) + "..." : label;
    return [{ text: `🔄 Replace #${idx + 1}: ${shortLabel}`, callback_data: `dup:replace:${idx}` }];
  });
  rows.push([{ text: "➕ Add as New File Anyway", callback_data: "dup:add_new" }]);
  rows.push([{ text: "❌ Cancel", callback_data: "cancel" }]);
  return { inline_keyboard: rows };
}

function replaceTitleKeyboard(existingTitle, defaultTitle) {
  const shortExisting = existingTitle.length > 30 ? existingTitle.slice(0, 27) + "..." : existingTitle;
  const rows = [
    [{ text: `✅ Keep "${shortExisting}"`, callback_data: "title:keep" }],
  ];
  if (defaultTitle && defaultTitle !== existingTitle) {
    const shortDefault = defaultTitle.length > 30 ? defaultTitle.slice(0, 27) + "..." : defaultTitle;
    rows.push([{ text: `📝 Use "${shortDefault}"`, callback_data: "title:default" }]);
  }
  rows.push([{ text: "❌ Cancel", callback_data: "cancel" }]);
  return { inline_keyboard: rows };
}

const START_KEYBOARD = {
  keyboard: [[{ text: "🚀 Start" }, { text: "❌ Cancel" }]],
  resize_keyboard: true,
  is_persistent: true,
};

const PAGE_SIZE = 8;

const ACTION_TITLES = {
  files: "📂 Browse Files",
  rename: "✏️ Rename a File",
  lecture: "🔢 Set Lecture # & Type",
  youtube: "🎥 Set YouTube Link",
  info: "ℹ️ Edit Info Note",
  label: "🏷 Edit Label",
  move: "📦 Move a File",
  delete: "🗑 Delete a File",
};

function pickSubjectKeyboard(subjects, prefix = "pick:subj") {
  const rows = subjects.map((s, idx) => [
    { text: `${s.nameAr || s.name} (${s.sections.reduce((n, sec) => n + sec.files.length, 0)})`, callback_data: `${prefix}:${idx}` },
  ]);
  rows.push([{ text: "❌ Cancel", callback_data: "cancel" }]);
  return { inline_keyboard: rows };
}

function pickSectionKeyboard(subject, prefix = "pick:sec") {
  const rows = (subject.sections || []).map((sec, idx) => [
    { text: `📁 ${sec.name || sec.id} (${(sec.files || []).length})`, callback_data: `${prefix}:${idx}` },
  ]);
  rows.push([{ text: "❌ Cancel", callback_data: "cancel" }]);
  return { inline_keyboard: rows };
}

function pickFilesKeyboard(files, page = 0) {
  const totalPages = Math.max(1, Math.ceil(files.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const start = safePage * PAGE_SIZE;
  const slice = files.slice(start, start + PAGE_SIZE);

  const rows = slice.map((f, idx) => {
    const yt = f.youtube ? "🎥 " : "";
    const label = `${yt}${f.title}`;
    const shortLabel = label.length > 42 ? label.slice(0, 39) + "..." : label;
    return [{ text: shortLabel, callback_data: `pick:file:${start + idx}` }];
  });

  if (totalPages > 1) {
    const nav = [];
    if (safePage > 0) nav.push({ text: "⬅️ Prev", callback_data: `pick:page:${safePage - 1}` });
    nav.push({ text: `${safePage + 1}/${totalPages}`, callback_data: "noop" });
    if (safePage < totalPages - 1) nav.push({ text: "Next ➡️", callback_data: `pick:page:${safePage + 1}` });
    rows.push(nav);
  }
  rows.push([{ text: "❌ Cancel", callback_data: "cancel" }]);
  return { inline_keyboard: rows };
}

function searchResultsKeyboard(results) {
  const rows = results.slice(0, 15).map((r, idx) => {
    const label = `${r.file.title} — ${r.subjectNameAr}`;
    const shortLabel = label.length > 42 ? label.slice(0, 39) + "..." : label;
    return [{ text: shortLabel, callback_data: `pick:search:${idx}` }];
  });
  rows.push([{ text: "❌ Cancel", callback_data: "cancel" }]);
  return { inline_keyboard: rows };
}

function editKindKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📖 محاضرة (Lecture)", callback_data: "edit_kind:lecture" },
        { text: "📝 ملخص (Summary)", callback_data: "edit_kind:summary" },
      ],
      [
        { text: "❓ أسئلة (Questions)", callback_data: "edit_kind:questions" },
        { text: "✅ حل أسئلة (Solution)", callback_data: "edit_kind:solution" },
      ],
      [
        { text: "⭐ مراجعة (Review)", callback_data: "edit_kind:review" },
        { text: "📕 كتاب (Book)", callback_data: "edit_kind:book" },
      ],
      [{ text: "⏭ Keep current type", callback_data: "edit_kind:keep" }],
      [{ text: "❌ Cancel", callback_data: "cancel" }],
    ],
  };
}

function fileActionsKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "✏️ Rename", callback_data: "act:rename" },
        { text: "🔢 Lecture #", callback_data: "act:lecture" },
      ],
      [
        { text: "🏷 Label", callback_data: "act:label" },
        { text: "ℹ️ Info", callback_data: "act:info" },
      ],
      [
        { text: "🎥 YouTube", callback_data: "act:youtube" },
        { text: "📦 Move", callback_data: "act:move" },
      ],
      [
        { text: "🗑 Delete", callback_data: "act:delete" },
        { text: "❌ Close", callback_data: "cancel" },
      ],
    ],
  };
}

function rollbackKeyboard(commits) {
  const rows = commits.map((c, idx) => {
    const label = `↩️ ${c.sha} — ${c.message}`;
    const shortLabel = label.length > 44 ? label.slice(0, 41) + "..." : label;
    return [{ text: shortLabel, callback_data: `rb:pick:${idx}` }];
  });
  rows.push([{ text: "❌ Cancel", callback_data: "cancel" }]);
  return { inline_keyboard: rows };
}

async function startPickerOrSearch(chatId, action, query) {
  const repoDir = ensureRepo();
  const manifest = readManifest(repoDir);

  if (query) {
    const results = searchManifestFiles(manifest, query);
    if (results.length === 0) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: `No files matched <code>${escapeHtml(query)}</code>.`,
        parse_mode: "HTML",
      });
      return;
    }
    pending.set(chatId, {
      flow: "pick",
      action,
      step: "pick_search",
      subjects: manifest.subjects,
      searchResults: results.slice(0, 15),
    });
    const extra = results.length > 15 ? `\n<i>Showing first 15 of ${results.length} matches.</i>` : "";
    await tg("sendMessage", {
      chat_id: chatId,
      text: `${ACTION_TITLES[action]}\nSelect a file:${extra}`,
      parse_mode: "HTML",
      reply_markup: searchResultsKeyboard(results),
    });
    return;
  }

  pending.set(chatId, {
    flow: "pick",
    action,
    step: "pick_subj",
    subjects: manifest.subjects,
  });
  await tg("sendMessage", {
    chat_id: chatId,
    text: `${ACTION_TITLES[action]}\n\nChoose a subject:`,
    reply_markup: pickSubjectKeyboard(manifest.subjects),
  });
}

async function proceedWithPickedFile(chatId, job, target) {
  job.pickTarget = target;
  const f = target.file;

  if (job.action === "files") {
    const ytLine = f.youtube ? `\n• YouTube: ${escapeHtml(f.youtube)}` : "\n• YouTube: <i>none</i>";
    const labelLine = f.docTag ? `\n• Label: <code>${escapeHtml(f.docTag)}</code>` : "\n• Label: <i>none</i>";
    const infoLine = f.info ? `\n• Info (ⓘ): ${escapeHtml(f.info)}` : "\n• Info (ⓘ): <i>none</i>";
    const lecLine = Number.isInteger(f.lecture) ? `Lec ${f.lecture}` : "<i>General / none</i>";
    const kindLine = f.kind ? escapeHtml(f.kind) : "<i>auto</i>";
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `📄 <b>${escapeHtml(f.title)}</b>\n` +
        `• Subject: ${escapeHtml(target.subjectNameAr)} / ${escapeHtml(target.sectionName)}\n` +
        `• Lecture: ${lecLine} · Type: ${kindLine}\n` +
        `• Path: <code>${escapeHtml(f.path)}</code>\n` +
        `• Size: ${formatBytes(f.size)}` +
        labelLine +
        infoLine +
        ytLine,
      parse_mode: "HTML",
      reply_markup: fileActionsKeyboard(),
    });
    return;
  }

  if (job.action === "lecture") {
    const subj = job.subjects?.find((s) => s.id === target.subjectId) || { id: target.subjectId, sections: [] };
    job.step = "edit_lec_num";
    const curLec = Number.isInteger(f.lecture) ? `Lec ${f.lecture}` : "<i>none</i>";
    const detected = detectLectureFromText(`${f.title} ${f.original || ""}`);
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `🔢 <b>Set Lecture # &amp; Type</b>\n` +
        `File: <b>${escapeHtml(f.title)}</b>\n` +
        `Current: ${curLec} · ${escapeHtml(f.kind || "auto")}\n\n` +
        `Choose the lecture number:`,
      parse_mode: "HTML",
      reply_markup: lectureNumberKeyboard(subj, null, detected, "edit_lec"),
    });
    return;
  }

  if (job.action === "info") {
    job.step = "info_input";
    const cur = f.info ? escapeHtml(f.info) : "<i>none</i>";
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `ℹ️ <b>Edit Info Icon (ⓘ)</b>\n` +
        `File: <b>${escapeHtml(f.title)}</b>\n` +
        `Current: ${cur}\n\n` +
        `Send the new info text, or send <code>clear</code> to remove the icon:`,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "cancel" }]] },
    });
    return;
  }

  if (job.action === "label") {
    job.step = "label_input";
    const cur = f.docTag ? `<code>${escapeHtml(f.docTag)}</code>` : "<i>none</i>";
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `🏷 <b>Edit Label</b>\n` +
        `File: <b>${escapeHtml(f.title)}</b>\n` +
        `Current: ${cur}\n\n` +
        `Choose a label below, or send any custom label text:`,
      parse_mode: "HTML",
      reply_markup: docTagKeyboard("edit_tag"),
    });
    return;
  }

  if (job.action === "rename") {
    job.step = "rename_input";
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `✏️ <b>Rename File</b>\n` +
        `Current title: <b>${escapeHtml(f.title)}</b>\n\n` +
        `Send the new title:`,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "cancel" }]] },
    });
    return;
  }

  if (job.action === "youtube") {
    job.step = "youtube_input";
    const cur = f.youtube ? `<code>${escapeHtml(f.youtube)}</code>` : "<i>none</i>";
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `🎥 <b>Set YouTube Link</b>\n` +
        `File: <b>${escapeHtml(f.title)}</b>\n` +
        `Current: ${cur}\n\n` +
        `Send a YouTube URL, or send <code>clear</code> to remove it:`,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "cancel" }]] },
    });
    return;
  }

  if (job.action === "move") {
    job.step = "move_dest_subj";
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `📦 <b>Move File</b>\n` +
        `File: <b>${escapeHtml(f.title)}</b>\n` +
        `From: ${escapeHtml(target.subjectNameAr)} / ${escapeHtml(target.sectionName)}\n\n` +
        `Choose destination subject:`,
      parse_mode: "HTML",
      reply_markup: pickSubjectKeyboard(job.subjects, "move:subj"),
    });
    return;
  }

  if (job.action === "delete") {
    const repoDir = ensureRepo();
    const manifest = readManifest(repoDir);
    const refs = findEntriesByPath(manifest, f.path);
    const buttons = [];
    if (refs.length > 1) {
      buttons.push([{ text: `Remove from ${target.sectionName} only`, callback_data: "del:one" }]);
      buttons.push([{ text: `🗑 Delete from ALL (${refs.length}) & disk`, callback_data: "del:all" }]);
    } else {
      buttons.push([{ text: "🗑 Confirm Delete", callback_data: "del:all" }]);
    }
    buttons.push([{ text: "❌ Cancel", callback_data: "cancel" }]);
    job.step = "delete_confirm";
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `🗑 <b>Delete File?</b>\n` +
        `• Title: <b>${escapeHtml(f.title)}</b>\n` +
        `• Section: ${escapeHtml(target.subjectNameAr)} / ${escapeHtml(target.sectionName)}\n` +
        `• Path: <code>${escapeHtml(f.path)}</code>\n` +
        (refs.length > 1 ? `• Linked in ${refs.length} sections.` : ""),
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: buttons },
    });
  }
}

async function askTitleStep(chatId, job) {
  job.step = "title";
  const hint =
    job.variant === "arabic"
      ? `🇸🇦 <b>Arabic Version</b> — choose a title or send a custom one:`
      : `✏️ <b>Choose a title</b> or send a custom Arabic/English title:`;
  await tg("sendMessage", {
    chat_id: chatId,
    text: `${hint}\n\nFilename: <code>${escapeHtml(job.defaultTitle)}</code>`,
    parse_mode: "HTML",
    reply_markup: titleKeyboard(job.defaultTitle, job),
  });
}

async function askLectureNumberStep(chatId, job) {
  const subject = job.subjects.find((s) => s.id === job.subjectId);
  const detected = detectLectureFromText(
    job.isBatch ? job.files.map((f) => f.fileName).join(" ") : job.fileName,
  );
  job.step = "lecture_num";
  const slotLabel = SLOT_CONFIG[job.slotKind]?.label || job.sectionId;
  await tg("sendMessage", {
    chat_id: chatId,
    text:
      `🔢 <b>Which lecture number?</b>\n` +
      `• Subject: ${escapeHtml(subject?.nameAr || job.subjectId)}\n` +
      `• Slot / Section: ${escapeHtml(slotLabel)}\n\n` +
      `Choose a lecture number <i>(numbers in parentheses show existing files in that spot)</i>:`,
    parse_mode: "HTML",
    reply_markup: lectureNumberKeyboard(subject, job.slotKind, detected, "lec"),
  });
}

async function afterLectureNumberPicked(chatId, job) {
  const subject = job.subjects.find((s) => s.id === job.subjectId);
  if (job.isBatch) {
    job.step = "batch_mode";
    const list = job.files.map((f, i) => `${i + 1}. <code>${escapeHtml(f.fileName)}</code>`).join("\n");
    const lecText = Number.isInteger(job.lectureNum) ? `Lec ${job.lectureNum}` : "General";
    const slotLabel = SLOT_CONFIG[job.slotKind]?.label || job.sectionId;
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `📚 <b>Batch Upload (${job.files.length} files)</b>\n` +
        `• Subject: ${escapeHtml(subject?.nameAr || job.subjectId)}\n` +
        `• Spot: ${escapeHtml(lecText)} — ${escapeHtml(slotLabel)}\n\n` +
        `${list}\n\nHow should I title these files?`,
      parse_mode: "HTML",
      reply_markup: batchModeKeyboard(job),
    });
    return;
  }

  if (Number.isInteger(job.lectureNum) && job.slotKind && job.mode !== "replace") {
    const existing = getFilesInLectureSlot(subject, job.lectureNum, job.slotKind);
    if (existing.length > 0) {
      job.slotExisting = existing;
      job.step = "slot_action";
      const list = existing
        .map((m, i) => `${i + 1}. <b>${escapeHtml(m.file.title)}</b> (${formatBytes(m.file.size)})`)
        .join("\n");
      const slotLabel = SLOT_CONFIG[job.slotKind]?.label || job.slotKind;
      await tg("sendMessage", {
        chat_id: chatId,
        text:
          `📌 <b>Lec ${job.lectureNum} (${escapeHtml(slotLabel)}) already has ${existing.length} file(s):</b>\n` +
          `${list}\n\nHow would you like to add this file?`,
        parse_mode: "HTML",
        reply_markup: slotActionKeyboard(existing),
      });
      return;
    }
  }

  if (job.mode === "both" && job.docTag === undefined) {
    job.step = "tag";
    await tg("sendMessage", {
      chat_id: chatId,
      text: "Choose badge (docTag) for Hero / Midterm:",
      reply_markup: docTagKeyboard(),
    });
    return;
  }

  await askTitleStep(chatId, job);
}

async function handleIncomingDocuments(chatId, docs) {
  const repoDir = ensureRepo();
  const manifest = readManifest(repoDir);

  if (docs.length > 1) {
    const files = docs.map((d) => {
      const fileName = d.file_name || "document.pdf";
      const defaultTitle = cleanTitleFromFilename(fileName);
      return {
        fileId: d.file_id,
        fileName,
        fileSize: d.file_size || 0,
        defaultTitle,
        title: defaultTitle,
      };
    });
    pending.set(chatId, {
      isBatch: true,
      step: "subject",
      files,
      subjects: manifest.subjects,
    });
    const list = files.map((f, i) => `${i + 1}. <b>${escapeHtml(f.fileName)}</b>`).join("\n");
    await tg("sendMessage", {
      chat_id: chatId,
      text: `📚 Received <b>${files.length} files</b> together:\n${list}\n\nWhich subject are these for?`,
      parse_mode: "HTML",
      reply_markup: subjectKeyboard(manifest.subjects),
    });
    return;
  }

  const doc = docs[0];
  const fileName = doc.file_name || "document.pdf";
  const fileSize = doc.file_size || 0;
  const defaultTitle = cleanTitleFromFilename(fileName);

  const prevJob = pending.get(chatId);
  if (prevJob && prevJob.step === "await_second_file") {
    const nextJob = {
      step: "slot_action",
      mode: prevJob.mode || "section",
      subjectId: prevJob.subjectId,
      sectionId: prevJob.sectionId,
      slotKind: prevJob.slotKind,
      lectureNum: prevJob.lectureNum,
      fileId: doc.file_id,
      fileName,
      fileSize,
      defaultTitle,
      title: defaultTitle,
      subjects: manifest.subjects,
    };
    pending.set(chatId, nextJob);
    await afterLectureNumberPicked(chatId, nextJob);
    return;
  }

  const matches = findExistingMatches(manifest, fileName, fileSize);
  if (matches.length > 0) {
    pending.set(chatId, {
      step: "duplicate",
      fileId: doc.file_id,
      fileName,
      fileSize,
      defaultTitle,
      title: defaultTitle,
      subjects: manifest.subjects,
      matches,
    });

    const listText = matches
      .map(
        (m, idx) =>
          `<b>#${idx + 1}</b> ${escapeHtml(m.file.title)}\n` +
          `   • Subject: ${escapeHtml(m.subjectNameAr)} / ${escapeHtml(m.sectionName)}\n` +
          `   • Existing: <code>${escapeHtml(m.file.original || m.file.path)}</code> (${formatBytes(m.file.size)})\n` +
          `   • Match: ${escapeHtml(m.reasons.join(", "))}`,
      )
      .join("\n\n");

    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `⚠️ <b>Similar file already exists!</b>\n` +
        `Received: <code>${escapeHtml(fileName)}</code> (${formatBytes(fileSize)})\n\n` +
        `${listText}\n\nWhat would you like to do?`,
      parse_mode: "HTML",
      reply_markup: duplicateKeyboard(matches),
    });
    return;
  }

  pending.set(chatId, {
    step: "subject",
    fileId: doc.file_id,
    fileName,
    fileSize,
    defaultTitle,
    title: defaultTitle,
    subjects: manifest.subjects,
  });

  await tg("sendMessage", {
    chat_id: chatId,
    text: `📄 Received: <b>${escapeHtml(fileName)}</b>\n\nWhich subject is this for?`,
    parse_mode: "HTML",
    reply_markup: subjectKeyboard(manifest.subjects),
  });
}

function parseCommand(text) {
  const match = String(text || "").match(/^\/([a-z0-9_]+)(?:@\w+)?(?:\s+([\s\S]+))?$/i);
  if (!match) return null;
  return { cmd: match[1].toLowerCase(), arg: (match[2] || "").trim() };
}

async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const userId = String(msg.from?.id || "");
  if (userId !== ADMIN_ID) return;

  const text = (msg.text || "").trim();
  const parsed = parseCommand(text);

  if (text === "🚀 Start" || parsed?.cmd === "start" || parsed?.cmd === "help") {
    pending.delete(chatId);
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `📚 <b>IS Study Hub Bot</b>\n\n` +
        `• Send or forward any PDF to upload &amp; publish it.\n\n` +
        `<b>File Management:</b>\n` +
        `/files [query] — Browse or search files\n` +
        `/lecture [query] — Set lecture # &amp; type (lecture/summary/questions)\n` +
        `/rename [query] — Rename a file title\n` +
        `/label [query] — Edit or clear file label\n` +
        `/info [query] — Edit or clear info icon (ⓘ)\n` +
        `/link — Add or remove subject links\n` +
        `/youtube — Add or clear subject YouTube links\n` +
        `/move [query] — Move a file to another section\n` +
        `/delete [query] — Delete a file\n\n` +
        `<b>Tasks &amp; News:</b>\n` +
        `/task — Add, view, or delete weekly tasks &amp; news\n\n` +
        `<b>Repo &amp; Safety:</b>\n` +
        `/status — Repo &amp; site status\n` +
        `/rollback — Revert a recent commit\n` +
        `/cancel — Cancel current action`,
      parse_mode: "HTML",
      reply_markup: START_KEYBOARD,
    });
    return;
  }

  if (text === "❌ Cancel" || parsed?.cmd === "cancel") {
    pending.delete(chatId);
    await tg("sendMessage", {
      chat_id: chatId,
      text: "Cancelled.",
      reply_markup: START_KEYBOARD,
    });
    return;
  }

  if (parsed?.cmd === "status") {
    pending.delete(chatId);
    const st = getRepoStatus();
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `📊 <b>Site Status</b>\n` +
        `• Repo: <code>${escapeHtml(st.repo)}</code> (${escapeHtml(st.branch)})\n` +
        `• Latest commit: <code>${escapeHtml(st.sha)}</code> (${escapeHtml(st.relTime)})\n` +
        `• Message: ${escapeHtml(st.message)}\n` +
        `• Manifest updated: ${escapeHtml(st.updated)}\n` +
        `• Subjects: ${st.subjectsCount} | Unique files: ${st.uniqueFiles} | Entries: ${st.totalEntries}`,
      parse_mode: "HTML",
      reply_markup: START_KEYBOARD,
    });
    return;
  }

  if (parsed?.cmd === "rollback") {
    const commits = getRecentCommits(5);
    if (commits.length === 0) {
      await tg("sendMessage", { chat_id: chatId, text: "No commits found." });
      return;
    }
    pending.set(chatId, { flow: "rollback", step: "rb_pick", commits });
    const summary = commits
      .map((c) => `• <code>${escapeHtml(c.sha)}</code> ${escapeHtml(c.message)} <i>(${escapeHtml(c.relTime)})</i>`)
      .join("\n");
    await tg("sendMessage", {
      chat_id: chatId,
      text: `↩️ <b>Rollback</b>\nSelect a commit to revert:\n\n${summary}`,
      parse_mode: "HTML",
      reply_markup: rollbackKeyboard(commits),
    });
    return;
  }

  if (parsed?.cmd === "link") {
    const repoDir = ensureRepo();
    const manifest = readManifest(repoDir);
    const subjects = (manifest.subjects || []).filter((s) => s.id !== "midterm-revision");
    pending.set(chatId, {
      flow: "subj_link",
      step: "subj_link_pick",
      subjects,
    });
    await tg("sendMessage", {
      chat_id: chatId,
      text: "🔗 <b>Subject External Links</b>\n\nChoose a subject to manage its links:",
      parse_mode: "HTML",
      reply_markup: pickSubjectKeyboard(subjects, "subj_link:subj"),
    });
    return;
  }

  if (parsed?.cmd === "youtube") {
    const repoDir = ensureRepo();
    const manifest = readManifest(repoDir);
    const subjects = (manifest.subjects || []).filter((s) => s.id !== "midterm-revision");
    pending.set(chatId, {
      flow: "subj_yt",
      step: "subj_yt_pick",
      subjects,
    });
    await tg("sendMessage", {
      chat_id: chatId,
      text: "🎥 <b>Subject YouTube Links</b>\n\nChoose a subject to add or clear its YouTube link:",
      parse_mode: "HTML",
      reply_markup: pickSubjectKeyboard(subjects, "subj_yt:subj"),
    });
    return;
  }

  if (parsed?.cmd === "task") {
    const repoDir = ensureRepo();
    const manifest = readManifest(repoDir);
    const schedule = readScheduleInRepo(repoDir);
    const tasks = Array.isArray(schedule.weeklyTasks) ? schedule.weeklyTasks : [];
    const expiredCount = tasks.filter((task) => isWeeklyTaskExpired(task)).length;
    pending.set(chatId, {
      flow: "task",
      step: "task_menu",
      subjects: manifest.subjects || [],
      currentTasks: tasks,
      schedule,
    });

    const rows = [[{ text: "➕ إضافة مهمة / خبر جديد", callback_data: "task:menu:add" }]];
    if (tasks.length > 0) {
      rows.push([{ text: `📋 عرض / حذف المهام (${tasks.length})`, callback_data: "task:menu:list" }]);
    }
    if (expiredCount > 0) {
      rows.push([{ text: `🧹 تنظيف المهام المنتهية (${expiredCount})`, callback_data: "task:menu:prune" }]);
    }
    rows.push([{ text: "❌ Cancel", callback_data: "cancel" }]);

    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `🗓 <b>المهام والأخبار الأسبوعية</b>\n\n` +
        `• المهام الحالية: ${tasks.length}\n` +
        `• منتهية (تحتاج تنظيف): ${expiredCount}\n\n` +
        `اختر الإجراء:`,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: rows },
    });
    return;
  }

  if (parsed && ["files", "rename", "lecture", "info", "label", "move", "delete"].includes(parsed.cmd)) {
    await startPickerOrSearch(chatId, parsed.cmd, parsed.arg);
    return;
  }

  if (msg.document) {
    if (msg.media_group_id) {
      const groupKey = `${chatId}:${msg.media_group_id}`;
      let entry = mediaGroups.get(groupKey);
      if (!entry) {
        entry = { docs: [], timer: null };
        mediaGroups.set(groupKey, entry);
      }
      entry.docs.push(msg.document);
      clearTimeout(entry.timer);
      entry.timer = setTimeout(() => {
        mediaGroups.delete(groupKey);
        handleIncomingDocuments(chatId, entry.docs).catch(async (err) => {
          await tg("sendMessage", {
            chat_id: chatId,
            text: `❌ Error:\n${sanitizeError(err.message)}`,
          }).catch(() => {});
        });
      }, 750);
      return;
    }

    await handleIncomingDocuments(chatId, [msg.document]);
    return;
  }

  const job = pending.get(chatId);
  if (!job) return;
  if (!text) {
    if (job.flow === "task" && job.step === "task_title") {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "⚠️ العنوان مطلوب. اكتب عنوان المهمة أو الخبر:",
        reply_markup: { inline_keyboard: [taskCancelRow()] },
      });
    }
    return;
  }

  if (job.flow === "task" && job.step === "task_sections") {
    const sections = parseSectionsInput(text);
    if (!sections) {
      await tg("sendMessage", {
        chat_id: chatId,
        text:
          "⚠️ صيغة غير صحيحة. اكتب أرقام سكاشن من 1 إلى 11، مثال:\n" +
          "<code>1, 2, 3</code> أو <code>4-6</code>",
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [taskCancelRow()] },
      });
      return;
    }
    job.draft.sections = sections;
    await askTaskRoleStep(chatId, job);
    return;
  }

  if (job.flow === "task" && job.step === "task_author") {
    job.draft.authorName = text.trim().slice(0, 120);
    await askTaskTitleStep(chatId, job);
    return;
  }

  if (job.flow === "task" && job.step === "task_title") {
    const title = text.trim();
    if (!title) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "⚠️ العنوان مطلوب. اكتب عنوان المهمة أو الخبر:",
        reply_markup: { inline_keyboard: [taskCancelRow()] },
      });
      return;
    }
    job.draft.title = title.slice(0, 200);
    await askTaskDetailsStep(chatId, job);
    return;
  }

  if (job.flow === "task" && job.step === "task_details") {
    job.draft.details = text.trim().slice(0, 800);
    await askTaskDueStep(chatId, job);
    return;
  }

  if (job.flow === "task" && job.step === "task_due") {
    const dueDate = normalizeDigits(text).trim();
    if (!isValidIsoDate(dueDate)) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "⚠️ تاريخ غير صحيح. اكتب التاريخ بصيغة <code>YYYY-MM-DD</code> مثل <code>2026-11-25</code>:",
        parse_mode: "HTML",
        reply_markup: taskDueKeyboard(),
      });
      return;
    }
    job.draft.dueDate = dueDate;
    await askTaskConfirmStep(chatId, job);
    return;
  }

  if (job.step === "lecture_custom") {
    const num = Number.parseInt(normalizeDigits(text), 10);
    if (!Number.isInteger(num) || num < 1 || num > 99) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "⚠️ Please send a valid lecture number between 1 and 99:",
        reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "cancel" }]] },
      });
      return;
    }
    job.lectureNum = num;
    await afterLectureNumberPicked(chatId, job);
    return;
  }

  if (job.step === "edit_lec_custom" && job.pickTarget) {
    const num = Number.parseInt(normalizeDigits(text), 10);
    if (!Number.isInteger(num) || num < 1 || num > 99) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "⚠️ Please send a valid lecture number between 1 and 99:",
        reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "cancel" }]] },
      });
      return;
    }
    job.editLectureNum = num;
    job.step = "edit_lec_kind";
    await tg("sendMessage", {
      chat_id: chatId,
      text: `🔢 Lecture set to <b>Lec ${num}</b>.\n\nChoose the file type/slot:`,
      parse_mode: "HTML",
      reply_markup: editKindKeyboard(),
    });
    return;
  }

  if (job.step === "batch_titles" && job.isBatch) {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < job.files.length) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: `⚠️ Please send ${job.files.length} titles, one per line (got ${lines.length}):`,
        reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "cancel" }]] },
      });
      return;
    }
    job.files.forEach((f, idx) => {
      f.title = lines[idx];
    });
    await askInfoStep(chatId, job);
    return;
  }

  if (job.step === "tag") {
    job.docTag = text.toLowerCase() === "clear" ? "" : text;
    await askTitleStep(chatId, job);
    return;
  }

  if (job.step === "title" || job.step === "replace_title") {
    job.title = text;
    await askInfoStep(chatId, job);
    return;
  }

  if (job.step === "upload_info") {
    job.info = text.toLowerCase() === "clear" ? "" : text;
    await runPublishFlow(chatId, job);
    return;
  }

  if (job.step === "info_input" && job.pickTarget) {
    pending.delete(chatId);
    const infoVal = text.toLowerCase() === "clear" ? "" : text;
    await tg("sendMessage", { chat_id: chatId, text: "⏳ Updating info note and pushing..." });
    const res = setInfoInRepo(job.pickTarget.file.path, infoVal);
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `✅ <b>Info Updated!</b>\n` +
        `• File: ${escapeHtml(res.title)}\n` +
        `• Info (ⓘ): ${res.infoText ? escapeHtml(res.infoText) : "<i>cleared</i>"}\n` +
        `• Commit: <code>${escapeHtml(res.commit)}</code>`,
      parse_mode: "HTML",
      reply_markup: START_KEYBOARD,
    });
    return;
  }

  if (job.step === "label_input" && job.pickTarget) {
    pending.delete(chatId);
    const tagVal = text.toLowerCase() === "clear" ? "" : text;
    await tg("sendMessage", { chat_id: chatId, text: "⏳ Updating label and pushing..." });
    const res = setDocTagInRepo(job.pickTarget.file.path, tagVal);
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `✅ <b>Label Updated!</b>\n` +
        `• File: ${escapeHtml(res.title)}\n` +
        `• Label: ${res.docTag ? `<code>${escapeHtml(res.docTag)}</code>` : "<i>cleared</i>"}\n` +
        `• Commit: <code>${escapeHtml(res.commit)}</code>`,
      parse_mode: "HTML",
      reply_markup: START_KEYBOARD,
    });
    return;
  }

  if (job.step === "rename_input" && job.pickTarget) {
    pending.delete(chatId);
    await tg("sendMessage", { chat_id: chatId, text: `⏳ Renaming to "${text}" and pushing...` });
    const res = renameFileInRepo(job.pickTarget.file.path, text);
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `✅ <b>Renamed!</b>\n` +
        `• Old: ${escapeHtml(res.oldTitle)}\n` +
        `• New: <b>${escapeHtml(res.newTitle)}</b>\n` +
        `• Sections: ${escapeHtml(res.touchedSections.join(", "))}\n` +
        `• Commit: <code>${escapeHtml(res.commit)}</code>`,
      parse_mode: "HTML",
      reply_markup: START_KEYBOARD,
    });
    return;
  }

  if (job.step === "subj_link_url" && job.linkSubject) {
    if (!isValidHttpUrl(text)) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "⚠️ Please send a valid URL starting with <code>https://</code> or <code>http://</code>.",
        parse_mode: "HTML",
      });
      return;
    }
    job.linkUrl = text;
    job.step = "subj_link_title";
    await tg("sendMessage", {
      chat_id: chatId,
      text: `Send a button title for this link (e.g. "ملفات د. أميرة (SharePoint)"), or tap below to use <b>"فتح الرابط"</b>:`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Use "فتح الرابط"', callback_data: "subj_link:default_title" }],
          [{ text: "❌ Cancel", callback_data: "cancel" }],
        ],
      },
    });
    return;
  }

  if (job.step === "subj_link_title" && job.linkSubject && job.linkUrl) {
    const subjectId = job.linkSubject.id;
    const url = job.linkUrl;
    pending.delete(chatId);
    await tg("sendMessage", { chat_id: chatId, text: "⏳ Adding link to subject card and pushing..." });
    const res = addSubjectLinkInRepo(subjectId, url, text);
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `✅ <b>Link Added!</b>\n` +
        `• Subject: ${escapeHtml(res.subjectName)}\n` +
        `• Title: ${escapeHtml(res.title)}\n` +
        `• Total links: ${res.total}\n` +
        `• Commit: <code>${escapeHtml(res.commit)}</code>`,
      parse_mode: "HTML",
      reply_markup: START_KEYBOARD,
    });
    return;
  }

  if (job.step === "subj_yt_url" && job.ytSubject) {
    const isClear = text.toLowerCase() === "clear";
    if (isClear) {
      pending.delete(chatId);
      await tg("sendMessage", { chat_id: chatId, text: "⏳ Clearing subject YouTube links and pushing..." });
      const res = setSubjectYouTubeInRepo(job.ytSubject.id, "", "");
      await tg("sendMessage", {
        chat_id: chatId,
        text:
          `✅ <b>YouTube Links Cleared!</b>\n` +
          `• Subject: ${escapeHtml(res.subjectName)}\n` +
          `• Commit: <code>${escapeHtml(res.commit)}</code>`,
        parse_mode: "HTML",
        reply_markup: START_KEYBOARD,
      });
      return;
    }
    if (!isValidYouTubeUrl(text)) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "⚠️ Please send a valid YouTube URL (youtube.com or youtu.be), or send <code>clear</code>.",
        parse_mode: "HTML",
      });
      return;
    }
    job.ytUrl = text;
    job.step = "subj_yt_title";
    await tg("sendMessage", {
      chat_id: chatId,
      text: `Send a title for this link (e.g. "مراجعة الميدترم"), or tap below to use <b>"شرح المادة"</b>:`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Use "شرح المادة"', callback_data: "subj_yt:default_title" }],
          [{ text: "❌ Cancel", callback_data: "cancel" }],
        ],
      },
    });
    return;
  }

  if (job.step === "subj_yt_title" && job.ytSubject && job.ytUrl) {
    const subjectId = job.ytSubject.id;
    const ytUrl = job.ytUrl;
    pending.delete(chatId);
    await tg("sendMessage", { chat_id: chatId, text: "⏳ Adding YouTube link to subject card and pushing..." });
    const res = setSubjectYouTubeInRepo(subjectId, ytUrl, text);
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `✅ <b>Subject YouTube Link Added!</b>\n` +
        `• Subject: ${escapeHtml(res.subjectName)}\n` +
        `• Title: ${escapeHtml(res.linkTitle)}\n` +
        `• Link: ${escapeHtml(res.youtubeUrl)}\n` +
        `• Commit: <code>${escapeHtml(res.commit)}</code>`,
      parse_mode: "HTML",
      reply_markup: START_KEYBOARD,
    });
    return;
  }

  if (job.step === "youtube_input" && job.pickTarget) {
    const isClear = text.toLowerCase() === "clear";
    if (!isClear && !isValidYouTubeUrl(text)) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "⚠️ Please send a valid YouTube URL (youtube.com or youtu.be), or send <code>clear</code>.",
        parse_mode: "HTML",
      });
      return;
    }
    pending.delete(chatId);
    const ytVal = isClear ? "" : text;
    await tg("sendMessage", { chat_id: chatId, text: `⏳ Updating YouTube link and pushing...` });
    const res = setYouTubeInRepo(job.pickTarget.file.path, ytVal);
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `✅ <b>YouTube Updated!</b>\n` +
        `• File: ${escapeHtml(res.title)}\n` +
        `• Link: ${res.youtubeUrl ? escapeHtml(res.youtubeUrl) : "<i>cleared</i>"}\n` +
        `• Commit: <code>${escapeHtml(res.commit)}</code>`,
      parse_mode: "HTML",
      reply_markup: START_KEYBOARD,
    });
  }
}

async function runPublishFlow(chatId, job) {
  pending.delete(chatId);
  const progressTitle = job.isBatch
    ? `${job.files.length} files`
    : `"${job.title}"`;
  await tg("sendMessage", { chat_id: chatId, text: `⏳ Adding ${progressTitle} and pushing to GitHub...` });
  try {
    const result = await publishUpload(job);
    const qbLine = result.questionBank
      ? result.questionBank.note
        ? `• Question Bank: ${result.questionBank.note}\n`
        : `• Question Bank: +${result.questionBank.added} questions (total: ${result.questionBank.total})\n`
      : "";
    const lecLine = Number.isInteger(job.lectureNum)
      ? `• Lecture: Lec ${job.lectureNum}${job.slotKind ? ` (${job.slotKind})` : ""}\n`
      : "";
    const titlesLine = job.isBatch
      ? `• Files:\n${job.files.map((f, i) => `  ${i + 1}. ${f.title}`).join("\n")}\n`
      : `• Title: ${job.title}\n• File: ${result.relPath}\n`;

    let replyMarkup = START_KEYBOARD;
    if (!job.isBatch && Number.isInteger(job.lectureNum) && job.slotKind && job.sectionId && job.mode !== "hero") {
      const subjIdx = (job.subjects || []).findIndex((s) => s.id === job.subjectId);
      if (subjIdx >= 0) {
        const slotLabel = SLOT_CONFIG[job.slotKind]?.label || job.slotKind;
        const cbData = `add2:${subjIdx}:${job.sectionId}:${job.lectureNum}:${job.slotKind}`;
        if (Buffer.byteLength(cbData, "utf8") <= 64) {
          replyMarkup = {
            inline_keyboard: [
              [{ text: `➕ Add 2nd file to Lec ${job.lectureNum} (${slotLabel})`, callback_data: cbData }],
            ],
          };
        }
      }
    }

    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `✅ Published!\n` +
        titlesLine +
        lecLine +
        `• Sections: ${result.addedTo.join(", ")}\n` +
        qbLine +
        `• Commit: ${result.commit}\n\n` +
        `GitHub Pages will be live in ~1 minute.`,
      reply_markup: replyMarkup,
    });
  } catch (err) {
    await tg("sendMessage", {
      chat_id: chatId,
      text: `❌ Failed:\n${sanitizeError(err.message)}`,
    });
  }
}

async function handleCallback(cb) {
  const userId = String(cb.from?.id || "");
  if (userId !== ADMIN_ID) return;

  const chatId = cb.message.chat.id;
  const data = cb.data || "";
  await tg("answerCallbackQuery", { callback_query_id: cb.id });

  if (data === "noop") return;

  if (data === "cancel") {
    pending.delete(chatId);
    await tg("sendMessage", { chat_id: chatId, text: "Cancelled." });
    return;
  }

  if (data.startsWith("add2:")) {
    const [, rawSubjIdx, sectionId, rawLec, slotKind] = data.split(":");
    const subjIdx = Number.parseInt(rawSubjIdx, 10);
    const lectureNum = Number.parseInt(rawLec, 10);
    const repoDir = ensureRepo();
    const manifest = readManifest(repoDir);
    const subject = manifest.subjects?.[subjIdx];
    if (!subject || !Number.isInteger(lectureNum)) {
      await tg("sendMessage", { chat_id: chatId, text: "Subject or lecture not found. Please send the PDF again." });
      return;
    }
    pending.set(chatId, {
      step: "await_second_file",
      mode: "section",
      subjectId: subject.id,
      sectionId,
      lectureNum,
      slotKind,
      subjects: manifest.subjects,
    });
    const slotLabel = SLOT_CONFIG[slotKind]?.label || slotKind;
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `📎 <b>Send the 2nd PDF now</b> for:\n` +
        `• Subject: ${escapeHtml(subject.nameAr || subject.name)}\n` +
        `• Spot: Lec ${lectureNum} (${escapeHtml(slotLabel)})`,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "cancel" }]] },
    });
    return;
  }

  const job = pending.get(chatId);
  if (!job) {
    await tg("sendMessage", { chat_id: chatId, text: "Session expired. Please start again." });
    return;
  }

  if (data.startsWith("task:")) {
    await handleTaskCallback(chatId, job, data);
    return;
  }

  if (data.startsWith("subj_link:")) {
    if (data.startsWith("subj_link:subj:")) {
      const idx = Number.parseInt(data.slice("subj_link:subj:".length), 10);
      const subj = job.subjects?.[idx];
      if (!subj) return;
      const repoDir = ensureRepo();
      const ytLinks = getSubjectYouTubeLinks(repoDir, subj);
      const extLinks = getSubjectExternalLinks(repoDir, subj.id);
      job.linkSubject = subj;
      job.currentYtLinks = ytLinks;
      job.currentLinks = extLinks;

      const ytText = ytLinks.length
        ? ytLinks.map((l, i) => `  ${i + 1}. 🎥 <b>${escapeHtml(l.title)}</b>\n     <code>${escapeHtml(l.url)}</code>`).join("\n")
        : "  <i>none</i>";
      const extText = extLinks.length
        ? extLinks.map((l, i) => `  ${i + 1}. 🔗 <b>${escapeHtml(l.title)}</b>\n     <code>${escapeHtml(l.url)}</code>`).join("\n")
        : "  <i>none</i>";

      const rows = [
        [
          { text: "🎥 Add YouTube Link", callback_data: "subj_link:add_yt" },
          { text: "🔗 Add Other Link", callback_data: "subj_link:add_ext" },
        ],
      ];
      if (ytLinks.length + extLinks.length > 0) {
        rows.push([{ text: "🗑 Remove a Link", callback_data: "subj_link:rm_menu" }]);
      }
      rows.push([{ text: "❌ Cancel", callback_data: "cancel" }]);
      await tg("sendMessage", {
        chat_id: chatId,
        text:
          `🔗 <b>${escapeHtml(subj.nameAr || subj.name)}</b>\n\n` +
          `<b>شرح المادة (YouTube):</b>\n${ytText}\n\n` +
          `<b>روابط المادة (Other):</b>\n${extText}`,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: rows },
      });
      return;
    }

    if (data === "subj_link:add_yt" && job.linkSubject) {
      job.ytSubject = job.linkSubject;
      job.step = "subj_yt_url";
      await tg("sendMessage", {
        chat_id: chatId,
        text: `🎥 Send the <b>YouTube URL</b> to add to <b>${escapeHtml(job.linkSubject.nameAr || job.linkSubject.name)}</b>:`,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "cancel" }]] },
      });
      return;
    }

    if (data === "subj_link:add_ext" && job.linkSubject) {
      job.step = "subj_link_url";
      await tg("sendMessage", {
        chat_id: chatId,
        text: `🔗 Send the <b>URL</b> (SharePoint, Drive, etc.) to add to <b>${escapeHtml(job.linkSubject.nameAr || job.linkSubject.name)}</b>:`,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "cancel" }]] },
      });
      return;
    }

    if (data === "subj_link:default_title" && job.linkSubject && job.linkUrl) {
      const subjectId = job.linkSubject.id;
      const url = job.linkUrl;
      pending.delete(chatId);
      await tg("sendMessage", { chat_id: chatId, text: "⏳ Adding link to subject card and pushing..." });
      const res = addSubjectLinkInRepo(subjectId, url, "فتح الرابط");
      await tg("sendMessage", {
        chat_id: chatId,
        text:
          `✅ <b>Link Added!</b>\n` +
          `• Subject: ${escapeHtml(res.subjectName)}\n` +
          `• Title: ${escapeHtml(res.title)}\n` +
          `• Total links: ${res.total}\n` +
          `• Commit: <code>${escapeHtml(res.commit)}</code>`,
        parse_mode: "HTML",
        reply_markup: START_KEYBOARD,
      });
      return;
    }

    if (data === "subj_link:rm_menu" && job.linkSubject) {
      const ytList = Array.isArray(job.currentYtLinks) ? job.currentYtLinks : [];
      const extList = Array.isArray(job.currentLinks) ? job.currentLinks : [];
      const rows = [];
      ytList.forEach((l, idx) => {
        const label = `🎥 ${l.title || l.url}`;
        const short = label.length > 42 ? label.slice(0, 39) + "..." : label;
        rows.push([{ text: short, callback_data: `subj_link:rm:yt:${idx}` }]);
      });
      extList.forEach((l, idx) => {
        const label = `🔗 ${l.title || l.url}`;
        const short = label.length > 42 ? label.slice(0, 39) + "..." : label;
        rows.push([{ text: short, callback_data: `subj_link:rm:ext:${idx}` }]);
      });
      rows.push([{ text: "🗑 Clear ALL links", callback_data: "subj_link:rm:all" }]);
      rows.push([{ text: "❌ Cancel", callback_data: "cancel" }]);
      await tg("sendMessage", {
        chat_id: chatId,
        text: `Select a link to remove from <b>${escapeHtml(job.linkSubject.nameAr || job.linkSubject.name)}</b>:`,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: rows },
      });
      return;
    }

    if (data.startsWith("subj_link:rm:") && job.linkSubject) {
      const rest = data.slice("subj_link:rm:".length);
      const subjectId = job.linkSubject.id;
      let kind = "all";
      let idx = -1;
      if (rest !== "all") {
        const [k, rawIdx] = rest.split(":");
        kind = k;
        idx = Number.parseInt(rawIdx, 10);
      }
      pending.delete(chatId);
      await tg("sendMessage", { chat_id: chatId, text: "⏳ Removing link and pushing..." });
      const res = removeSubjectLinkInRepo(subjectId, kind, idx);
      await tg("sendMessage", {
        chat_id: chatId,
        text:
          `✅ <b>Link Removed!</b>\n` +
          `• Subject: ${escapeHtml(res.subjectName)}\n` +
          `• Removed: ${escapeHtml(res.removedLabel)}\n` +
          `• Remaining links: ${res.remaining}\n` +
          `• Commit: <code>${escapeHtml(res.commit)}</code>`,
        parse_mode: "HTML",
        reply_markup: START_KEYBOARD,
      });
      return;
    }
  }

  if (data.startsWith("subj_yt:")) {
    if (data === "subj_yt:default_title" && job.ytSubject && job.ytUrl) {
      const subjectId = job.ytSubject.id;
      const ytUrl = job.ytUrl;
      pending.delete(chatId);
      await tg("sendMessage", { chat_id: chatId, text: "⏳ Adding YouTube link to subject card and pushing..." });
      const res = setSubjectYouTubeInRepo(subjectId, ytUrl, "شرح المادة");
      await tg("sendMessage", {
        chat_id: chatId,
        text:
          `✅ <b>Subject YouTube Link Added!</b>\n` +
          `• Subject: ${escapeHtml(res.subjectName)}\n` +
          `• Title: ${escapeHtml(res.linkTitle)}\n` +
          `• Link: ${escapeHtml(res.youtubeUrl)}\n` +
          `• Commit: <code>${escapeHtml(res.commit)}</code>`,
        parse_mode: "HTML",
        reply_markup: START_KEYBOARD,
      });
      return;
    }

    if (data.startsWith("subj_yt:subj:")) {
      const idx = Number.parseInt(data.slice("subj_yt:subj:".length), 10);
      const subj = job.subjects?.[idx];
      if (!subj) return;
      const repoDir = ensureRepo();
      const links = getSubjectYouTubeLinks(repoDir, subj);
      job.ytSubject = subj;
      job.step = "subj_yt_url";
      const currentText = links.length
        ? links.map((l, i) => `${i + 1}. ${escapeHtml(l.title)}: <code>${escapeHtml(l.url)}</code>`).join("\n")
        : "<i>none</i>";
      await tg("sendMessage", {
        chat_id: chatId,
        text:
          `🎥 <b>${escapeHtml(subj.nameAr || subj.name)}</b>\n` +
          `Current links:\n${currentText}\n\n` +
          `Send a YouTube URL to add it to the subject info card, or send <code>clear</code> to remove all:`,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "cancel" }]] },
      });
      return;
    }
  }

  if (data.startsWith("pick:")) {
    const [, kind, rawIdx] = data.split(":");
    const idx = Number.parseInt(rawIdx, 10);

    if (kind === "subj") {
      const subj = job.subjects?.[idx];
      if (!subj) return;
      job.pickSubject = subj;
      job.step = "pick_sec";
      await tg("sendMessage", {
        chat_id: chatId,
        text: `${ACTION_TITLES[job.action]}\nSubject: <b>${escapeHtml(subj.nameAr || subj.name)}</b>\n\nChoose a section:`,
        parse_mode: "HTML",
        reply_markup: pickSectionKeyboard(subj),
      });
      return;
    }

    if (kind === "sec" && job.pickSubject) {
      const sec = job.pickSubject.sections?.[idx];
      if (!sec) return;
      if (!sec.files || sec.files.length === 0) {
        await tg("sendMessage", { chat_id: chatId, text: "This section has no files." });
        return;
      }
      job.pickSection = sec;
      job.page = 0;
      job.step = "pick_file";
      await tg("sendMessage", {
        chat_id: chatId,
        text: `${ACTION_TITLES[job.action]}\n${escapeHtml(job.pickSubject.nameAr || job.pickSubject.name)} / <b>${escapeHtml(sec.name || sec.id)}</b>\n\nChoose a file:`,
        parse_mode: "HTML",
        reply_markup: pickFilesKeyboard(sec.files, 0),
      });
      return;
    }

    if (kind === "page" && job.pickSection) {
      job.page = idx;
      await tg("editMessageReplyMarkup", {
        chat_id: chatId,
        message_id: cb.message.message_id,
        reply_markup: pickFilesKeyboard(job.pickSection.files, idx),
      }).catch(() => {});
      return;
    }

    if (kind === "file" && job.pickSubject && job.pickSection) {
      const file = job.pickSection.files?.[idx];
      if (!file) return;
      await proceedWithPickedFile(chatId, job, {
        subjectId: job.pickSubject.id,
        subjectNameAr: job.pickSubject.nameAr || job.pickSubject.name,
        sectionId: job.pickSection.id,
        sectionName: job.pickSection.name || job.pickSection.id,
        file,
      });
      return;
    }

    if (kind === "search" && Array.isArray(job.searchResults)) {
      const target = job.searchResults[idx];
      if (!target) return;
      await proceedWithPickedFile(chatId, job, target);
      return;
    }
  }

  if (data.startsWith("act:") && job.pickTarget) {
    const nextAction = data.slice(4);
    if (["rename", "lecture", "youtube", "info", "label", "move", "delete"].includes(nextAction)) {
      job.action = nextAction;
      await proceedWithPickedFile(chatId, job, job.pickTarget);
      return;
    }
  }

  if (data.startsWith("edit_lec:") && job.pickTarget) {
    const raw = data.slice("edit_lec:".length);
    if (raw === "custom") {
      job.step = "edit_lec_custom";
      await tg("sendMessage", {
        chat_id: chatId,
        text: "🔢 Send the lecture number (1–99):",
        reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "cancel" }]] },
      });
      return;
    }
    job.editLectureNum = raw === "none" ? null : Number.parseInt(raw, 10);
    job.step = "edit_lec_kind";
    const lecText = Number.isInteger(job.editLectureNum) ? `Lec ${job.editLectureNum}` : "General (no lecture #)";
    await tg("sendMessage", {
      chat_id: chatId,
      text: `🔢 Lecture set to <b>${escapeHtml(lecText)}</b>.\n\nChoose the file type/slot:`,
      parse_mode: "HTML",
      reply_markup: editKindKeyboard(),
    });
    return;
  }

  if (data.startsWith("edit_kind:") && job.pickTarget) {
    const kind = data.slice("edit_kind:".length);
    const targetPath = job.pickTarget.file.path;
    const lectureNum = job.editLectureNum;
    pending.delete(chatId);
    await tg("sendMessage", { chat_id: chatId, text: "⏳ Updating lecture # & type and pushing..." });
    const res = setLectureAndKindInRepo(targetPath, lectureNum, kind === "keep" ? null : kind);
    const lecText = Number.isInteger(res.lectureNum) ? `Lec ${res.lectureNum}` : "General";
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `✅ <b>Updated!</b>\n` +
        `• File: ${escapeHtml(res.title)}\n` +
        `• Lecture: ${escapeHtml(lecText)}${res.slotKind ? ` (${escapeHtml(res.slotKind)})` : ""}\n` +
        `• Commit: <code>${escapeHtml(res.commit)}</code>`,
      parse_mode: "HTML",
      reply_markup: START_KEYBOARD,
    });
    return;
  }

  if (data.startsWith("edit_tag:") && job.pickTarget) {
    const tag = data.slice("edit_tag:".length);
    const tagVal = tag === "none" ? "" : tag;
    const targetPath = job.pickTarget.file.path;
    pending.delete(chatId);
    await tg("sendMessage", { chat_id: chatId, text: "⏳ Updating label and pushing..." });
    const res = setDocTagInRepo(targetPath, tagVal);
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `✅ <b>Label Updated!</b>\n` +
        `• File: ${escapeHtml(res.title)}\n` +
        `• Label: ${res.docTag ? `<code>${escapeHtml(res.docTag)}</code>` : "<i>cleared</i>"}\n` +
        `• Commit: <code>${escapeHtml(res.commit)}</code>`,
      parse_mode: "HTML",
      reply_markup: START_KEYBOARD,
    });
    return;
  }

  if (data.startsWith("move:") && job.pickTarget) {
    const [, kind, rawIdx] = data.split(":");
    const idx = Number.parseInt(rawIdx, 10);

    if (kind === "subj") {
      const subj = job.subjects?.[idx];
      if (!subj) return;
      job.moveDestSubject = subj;
      await tg("sendMessage", {
        chat_id: chatId,
        text: `📦 Destination Subject: <b>${escapeHtml(subj.nameAr || subj.name)}</b>\n\nChoose destination section:`,
        parse_mode: "HTML",
        reply_markup: pickSectionKeyboard(subj, "move:sec"),
      });
      return;
    }

    if (kind === "sec" && job.moveDestSubject) {
      const sec = job.moveDestSubject.sections?.[idx];
      if (!sec) return;
      const source = job.pickTarget;
      pending.delete(chatId);
      await tg("sendMessage", { chat_id: chatId, text: `⏳ Moving "${source.file.title}" and pushing...` });
      const res = moveFileInRepo(source, job.moveDestSubject.id, sec.id);
      await tg("sendMessage", {
        chat_id: chatId,
        text:
          `✅ <b>Moved!</b>\n` +
          `• File: ${escapeHtml(res.title)}\n` +
          `• Destination: <code>${escapeHtml(res.dest)}</code>\n` +
          `• Path: <code>${escapeHtml(res.newRelPath)}</code>\n` +
          `• Commit: <code>${escapeHtml(res.commit)}</code>`,
        parse_mode: "HTML",
        reply_markup: START_KEYBOARD,
      });
      return;
    }
  }

  if ((data === "del:one" || data === "del:all") && job.pickTarget) {
    const target = job.pickTarget;
    const deleteAll = data === "del:all";
    pending.delete(chatId);
    await tg("sendMessage", { chat_id: chatId, text: `⏳ Deleting "${target.file.title}" and pushing...` });
    const res = deleteFileInRepo(target.file.path, target.subjectId, target.sectionId, deleteAll);
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `✅ <b>Deleted!</b>\n` +
        `• File: ${escapeHtml(res.title)}\n` +
        `• Removed from: ${escapeHtml(res.removedFrom.join(", "))}\n` +
        `• Disk file removed: ${res.deletedFromDisk ? "Yes" : "No (still referenced)"}\n` +
        `• Commit: <code>${escapeHtml(res.commit)}</code>`,
      parse_mode: "HTML",
      reply_markup: START_KEYBOARD,
    });
    return;
  }

  if (data.startsWith("rb:") && Array.isArray(job.commits)) {
    const [, kind, rawIdx] = data.split(":");
    const idx = Number.parseInt(rawIdx, 10);
    const commitObj = job.commits[idx];
    if (!commitObj) return;

    if (kind === "pick") {
      await tg("sendMessage", {
        chat_id: chatId,
        text:
          `⚠️ <b>Confirm Rollback</b>\n` +
          `Revert commit <code>${escapeHtml(commitObj.sha)}</code>?\n` +
          `<i>${escapeHtml(commitObj.message)}</i>`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: `↩️ Confirm Revert ${commitObj.sha}`, callback_data: `rb:confirm:${idx}` }],
            [{ text: "❌ Cancel", callback_data: "cancel" }],
          ],
        },
      });
      return;
    }

    if (kind === "confirm") {
      pending.delete(chatId);
      await tg("sendMessage", { chat_id: chatId, text: `⏳ Reverting ${commitObj.sha} and pushing...` });
      const res = revertCommitInRepo(commitObj.sha);
      await tg("sendMessage", {
        chat_id: chatId,
        text:
          `✅ <b>Reverted!</b>\n` +
          `• Reverted: <code>${escapeHtml(res.revertedSha)}</code>\n` +
          `• New commit: <code>${escapeHtml(res.newSha)}</code>\n\n` +
          `GitHub Pages will update in ~1 minute.`,
        parse_mode: "HTML",
        reply_markup: START_KEYBOARD,
      });
      return;
    }
  }

  if (data === "dup:add_new") {
    job.mode = null;
    job.replaceTarget = null;
    job.step = "subject";
    await tg("sendMessage", {
      chat_id: chatId,
      text: `📄 Adding as a new file: <b>${escapeHtml(job.fileName)}</b>\n\nWhich subject is this for?`,
      parse_mode: "HTML",
      reply_markup: subjectKeyboard(job.subjects),
    });
    return;
  }

  if (data.startsWith("dup:replace:")) {
    const idx = Number.parseInt(data.slice("dup:replace:".length), 10);
    const match = Array.isArray(job.matches) ? job.matches[idx] : null;
    if (!match) {
      await tg("sendMessage", { chat_id: chatId, text: "Selected file not found. Please send the PDF again." });
      pending.delete(chatId);
      return;
    }
    job.mode = "replace";
    job.replaceTarget = match;
    job.subjectId = match.subjectId;
    job.sectionId = match.sectionId;
    job.step = "replace_title";
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `🔄 Replacing <b>${escapeHtml(match.file.title)}</b> in ${escapeHtml(match.subjectNameAr)} / ${escapeHtml(match.sectionName)}.\n\n` +
        `Send a custom title, or choose one below:`,
      parse_mode: "HTML",
      reply_markup: replaceTitleKeyboard(match.file.title, job.defaultTitle),
    });
    return;
  }

  if (data.startsWith("subj:")) {
    const subjectId = data.slice(5);
    const subject = job.subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    job.subjectId = subjectId;
    job.step = "dest";
    await tg("sendMessage", {
      chat_id: chatId,
      text: `Subject: <b>${escapeHtml(subject.nameAr)}</b>\n\nWhere should I add it?`,
      parse_mode: "HTML",
      reply_markup: destinationKeyboard(subject),
    });
    return;
  }

  if (data.startsWith("dest:")) {
    if (data === "dest:hero") {
      job.mode = "hero";
      job.sectionId = "midterm-revision";
      job.slotKind = "review";
      job.lectureNum = null;
      job.step = "tag";
      await tg("sendMessage", {
        chat_id: chatId,
        text: "Choose badge (docTag) for Hero / Midterm:",
        reply_markup: docTagKeyboard(),
      });
      return;
    }
    if (data.startsWith("dest:slot:")) {
      const slotKey = data.slice("dest:slot:".length);
      const cfg = SLOT_CONFIG[slotKey];
      if (!cfg) return;
      job.mode = "section";
      job.sectionId = cfg.sectionId;
      job.slotKind = cfg.kind;
      await askLectureNumberStep(chatId, job);
      return;
    }
    if (data.startsWith("dest:both:")) {
      job.mode = "both";
      job.sectionId = data.slice("dest:both:".length);
      job.slotKind = job.sectionId === "summaries" ? "summary" : "lecture";
      await askLectureNumberStep(chatId, job);
      return;
    }
    if (data.startsWith("dest:sec:")) {
      job.mode = "section";
      job.sectionId = data.slice("dest:sec:".length);
      if (["lectures", "summaries", "questions", "original-pptx"].includes(job.sectionId)) {
        job.slotKind =
          job.sectionId === "summaries"
            ? "summary"
            : job.sectionId === "questions"
              ? "questions"
              : "lecture";
        await askLectureNumberStep(chatId, job);
        return;
      }
      job.slotKind = job.sectionId === "books" ? "book" : null;
      job.lectureNum = null;
      if (job.isBatch) {
        await afterLectureNumberPicked(chatId, job);
      } else {
        await askTitleStep(chatId, job);
      }
      return;
    }
  }

  if (data.startsWith("lec:")) {
    const raw = data.slice(4);
    if (raw === "custom") {
      job.step = "lecture_custom";
      await tg("sendMessage", {
        chat_id: chatId,
        text: "🔢 Send the lecture number (1–99):",
        reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "cancel" }]] },
      });
      return;
    }
    job.lectureNum = raw === "none" ? null : Number.parseInt(raw, 10);
    await afterLectureNumberPicked(chatId, job);
    return;
  }

  if (data.startsWith("slotact:")) {
    const raw = data.slice("slotact:".length);
    if (raw === "arabic") {
      job.variant = "arabic";
      job.docTag = "نسخة عربية";
      await askTitleStep(chatId, job);
      return;
    }
    if (raw === "second") {
      job.variant = "second";
      await askTitleStep(chatId, job);
      return;
    }
    if (raw.startsWith("replace:")) {
      const idx = Number.parseInt(raw.slice("replace:".length), 10);
      const match = Array.isArray(job.slotExisting) ? job.slotExisting[idx] : null;
      if (!match) return;
      job.mode = "replace";
      job.replaceTarget = match;
      job.sectionId = match.sectionId;
      job.step = "replace_title";
      await tg("sendMessage", {
        chat_id: chatId,
        text:
          `🔄 Replacing <b>${escapeHtml(match.file.title)}</b> in ${escapeHtml(match.subjectNameAr)} / ${escapeHtml(match.sectionName)}.\n\n` +
          `Send a custom title, or choose one below:`,
        parse_mode: "HTML",
        reply_markup: replaceTitleKeyboard(match.file.title, job.defaultTitle),
      });
      return;
    }
  }

  if (data.startsWith("batch:") && job.isBatch) {
    const mode = data.slice("batch:".length);
    if (mode === "arabic" && job.files.length === 2 && Number.isInteger(job.lectureNum)) {
      job.files[0].title = buildSmartLectureTitle(job.slotKind, job.lectureNum, false);
      job.files[1].title = buildSmartLectureTitle(job.slotKind, job.lectureNum, true);
      job.files[1].docTag = "نسخة عربية";
      await askInfoStep(chatId, job);
      return;
    }
    if (mode === "filenames") {
      job.files.forEach((f) => {
        f.title = f.defaultTitle;
      });
      await askInfoStep(chatId, job);
      return;
    }
    if (mode === "custom") {
      job.step = "batch_titles";
      const list = job.files.map((f, i) => `${i + 1}. <code>${escapeHtml(f.fileName)}</code>`).join("\n");
      await tg("sendMessage", {
        chat_id: chatId,
        text:
          `✏️ Send <b>${job.files.length} titles</b>, one per line:\n\n${list}`,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "cancel" }]] },
      });
      return;
    }
  }

  if (data.startsWith("tag:")) {
    const tag = data.slice(4);
    job.docTag = tag === "none" ? "" : tag;
    if (job.isBatch) {
      await afterLectureNumberPicked(chatId, job);
    } else {
      await askTitleStep(chatId, job);
    }
    return;
  }

  if (data === "title:keep" && job.replaceTarget) {
    job.title = job.replaceTarget.file.title;
    await askInfoStep(chatId, job);
    return;
  }

  if (data === "title:smart" && Number.isInteger(job.lectureNum)) {
    job.title = buildSmartLectureTitle(job.slotKind, job.lectureNum, false);
    await askInfoStep(chatId, job);
    return;
  }

  if (data === "title:arabic" && Number.isInteger(job.lectureNum)) {
    job.title = buildSmartLectureTitle(job.slotKind, job.lectureNum, true);
    if (!job.docTag) job.docTag = "نسخة عربية";
    await askInfoStep(chatId, job);
    return;
  }

  if (data === "title:default") {
    job.title = job.defaultTitle;
    await askInfoStep(chatId, job);
    return;
  }

  if (data === "upload_info:skip") {
    job.info = "";
    await runPublishFlow(chatId, job);
    return;
  }

  if (data === "upload_info:keep") {
    job.info = job.replaceTarget?.file?.info || "";
    await runPublishFlow(chatId, job);
  }
}

async function poll() {
  let offset = 0;
  try {
    await tg("setMyCommands", {
      commands: [
        { command: "start", description: "Show instructions & commands" },
        { command: "files", description: "Browse or search files" },
        { command: "lecture", description: "Set lecture # & type for a file" },
        { command: "rename", description: "Rename a file title" },
        { command: "label", description: "Edit or clear file label" },
        { command: "info", description: "Edit or clear file info icon" },
        { command: "link", description: "Add or remove subject links" },
        { command: "youtube", description: "Add or clear subject YouTube link" },
        { command: "task", description: "Add or manage weekly tasks & news" },
        { command: "move", description: "Move a file to another section" },
        { command: "delete", description: "Delete a file" },
        { command: "status", description: "Repo & site status" },
        { command: "rollback", description: "Revert a recent commit" },
        { command: "cancel", description: "Cancel current action" },
      ],
    });
  } catch (err) {
    console.warn("setMyCommands failed:", sanitizeError(err.message));
  }
  console.log("Telegram uploader bot started (polling)...");
  while (true) {
    try {
      const updates = await tg("getUpdates", { offset, timeout: 25 });
      for (const upd of updates) {
        offset = upd.update_id + 1;
        const chatId = upd.message?.chat?.id ?? upd.callback_query?.message?.chat?.id;
        const userId = String(upd.message?.from?.id ?? upd.callback_query?.from?.id ?? "");
        try {
          if (upd.message) await handleMessage(upd.message);
          else if (upd.callback_query) await handleCallback(upd.callback_query);
        } catch (err) {
          const safeMsg = sanitizeError(err.message);
          console.error("Update error:", safeMsg);
          if (chatId && userId === ADMIN_ID) {
            await tg("sendMessage", {
              chat_id: chatId,
              text: `❌ Error:\n${safeMsg}`,
            }).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error("Poll error:", sanitizeError(err.message));
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

if (process.env.PORT) {
  const port = Number(process.env.PORT);
  http
    .createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
    })
    .listen(port, () => console.log(`Health server listening on ${port}`));
}

poll();
