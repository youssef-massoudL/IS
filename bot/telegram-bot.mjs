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
    ...String(process.env.GEMINI_FALLBACK_MODELS || "gemini-3.8-flash,gemini-3.8-flash-lite,gemini-2.5-flash")
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
const MIDTERM_SECTION_MAP = {
  "computer-networks": "computer-networks",
  "database-2": "database",
  "information-theory": "information-theory",
  "research-methods": "research",
  "system-analysis": "system-analysis",
};

const pending = new Map();

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

function sortFiles(files) {
  files.sort(
    (a, b) =>
      firstNumber(a.title) - firstNumber(b.title) ||
      String(a.title).localeCompare(String(b.title), "ar", { numeric: true }),
  );
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
  const maxAttemptsPerModel = 3;
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
        lastError = new Error(`Gemini API (${model}) HTTP ${res.status}: ${errText.slice(0, 200)}`);

        if (retryableStatuses.has(res.status) && attempt < maxAttemptsPerModel) {
          const delayMs = 1500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 500);
          await sleep(delayMs);
          continue;
        }

        // Fall through to next fallback model on 404 or exhausted retries
        if (res.status === 404 || retryableStatuses.has(res.status)) {
          break;
        }
        throw lastError;
      } catch (err) {
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
    throw lastError || new Error("Gemini API request failed");
  }

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  const parsed = JSON.parse(rawText);
  if (!Array.isArray(parsed)) {
    throw new Error("Gemini response was not a JSON array");
  }
  return { items: parsed };
}

async function updateQuestionBankFromUpload(repoDir, filePath, subjectId, title) {
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
    const lecture = Number.isInteger(raw.lecture) && raw.lecture > 0 ? raw.lecture : null;
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
  const manifestPath = path.join(repoDir, "data", "subjects.json");
  const manifest = readManifest(repoDir);
  const subject = manifest.subjects.find((s) => s.id === job.subjectId);
  if (!subject) throw new Error(`Unknown subject: ${job.subjectId}`);

  const nowIso = new Date().toISOString();
  const addedTo = [];
  let relPath = "";
  let savedFilePath = "";
  let commitAction = "Add";

  if (job.mode === "replace" && job.replaceTarget) {
    relPath = job.replaceTarget.file.path;
    const dest = path.join(repoDir, relPath.replace(/\//g, path.sep));
    savedFilePath = dest;
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
            if (job.info !== undefined) {
              if (job.info) f.info = job.info;
              else delete f.info;
            }
            updatedInSec = true;
          }
        }
        if (updatedInSec) {
          sortFiles(sec.files);
          addedTo.push(`${s.id}/${sec.id} (replaced)`);
        }
      }
    }
    commitAction = "Update";
  } else {
    const ext = path.extname(job.fileName).toLowerCase() || ".pdf";
    const slug = slugify(path.basename(job.fileName, ext));

    // Primary storage folder: chosen section, or midterm-revision if Hero-only
    const primarySectionId = job.mode === "hero" ? "midterm-revision" : job.sectionId;
    const outDir = path.join(repoDir, "files", subject.id, primarySectionId);
    fs.mkdirSync(outDir, { recursive: true });

    let dest = path.join(outDir, `${slug}${ext}`);
    let counter = 2;
    while (fs.existsSync(dest)) {
      dest = path.join(outDir, `${slug}-${counter++}${ext}`);
    }

    const size = await downloadTelegramFile(job.fileId, dest);
    savedFilePath = dest;
    relPath = path.posix.join("files", subject.id, primarySectionId, path.basename(dest));
    const entryId = path.basename(dest, ext);

    const baseEntry = {
      id: entryId,
      title: job.title,
      original: job.fileName,
      path: relPath,
      ext: ext.slice(1),
      size,
      youtube: "",
      addedAt: nowIso,
    };
    if (job.docTag) baseEntry.docTag = job.docTag;
    if (job.info) baseEntry.info = job.info;

    if (job.mode === "section" || job.mode === "both") {
      let sec = subject.sections.find((s) => s.id === job.sectionId);
      if (!sec) {
        sec = { id: job.sectionId, name: job.sectionId, nameEn: job.sectionId, files: [] };
        subject.sections.push(sec);
      }
      addEntryToSection(sec, baseEntry);
      addedTo.push(`${subject.id}/${sec.id}`);
    }

    if (job.mode === "hero" || job.mode === "both") {
      let subjMid = subject.sections.find((s) => s.id === "midterm-revision");
      if (!subjMid) {
        subjMid = { id: "midterm-revision", name: "مراجعة الميدترم", nameEn: "Midterm Revision", files: [] };
        subject.sections.push(subjMid);
      }
      addEntryToSection(subjMid, baseEntry);
      addedTo.push(`${subject.id}/midterm-revision`);

      const midtermSubject = manifest.subjects.find((s) => s.id === "midterm-revision");
      const mappedSectionId = MIDTERM_SECTION_MAP[subject.id];
      const midtermSec = midtermSubject?.sections.find((s) => s.id === mappedSectionId);
      if (midtermSec) {
        addEntryToSection(midtermSec, baseEntry);
        addedTo.push(`midterm-revision/${mappedSectionId}`);
      }
    }
  }

  let questionBank = null;
  const isQuestionsUpload =
    job.sectionId === "questions" ||
    job.docTag === "أسئلة" ||
    relPath.toLowerCase().includes("/questions/");
  if (isQuestionsUpload && savedFilePath) {
    try {
      questionBank = await updateQuestionBankFromUpload(repoDir, savedFilePath, subject.id, job.title);
    } catch (err) {
      questionBank = { added: 0, total: 0, note: `failed (${sanitizeError(err.message)})` };
    }
  }

  const { commit } = commitAndPush(repoDir, manifest, `${commitAction} ${job.title} (${subject.id})`);
  return { relPath, addedTo, commit, questionBank };
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

function subjectKeyboard(subjects) {
  return {
    inline_keyboard: subjects
      .filter((s) => s.id !== "midterm-revision")
      .map((s) => [{ text: `${s.nameAr} (${s.name})`, callback_data: `subj:${s.id}` }]),
  };
}

function destinationKeyboard(subject) {
  const rows = [
    [{ text: "⭐ Hero Review + Midterm Revision", callback_data: "dest:hero" }],
  ];
  for (const sec of subject.sections) {
    if (sec.id === "midterm-revision") continue;
    rows.push([{ text: `📁 ${sec.name} (${sec.id})`, callback_data: `dest:sec:${sec.id}` }]);
  }
  const hasSummaries = subject.sections.some((s) => s.id === "summaries" || s.id === "simplified-explanations");
  const defaultMainSec = subject.sections.find((s) => s.id === "summaries")?.id
    || subject.sections.find((s) => s.id === "simplified-explanations")?.id
    || "lectures";
  if (hasSummaries || defaultMainSec) {
    rows.push([{ text: `📚 Both (${defaultMainSec} + Hero Review)`, callback_data: `dest:both:${defaultMainSec}` }]);
  }
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
        { text: "📌 مراجعة", callback_data: `${prefix}:مراجعة` },
        { text: "🚫 بدون شارة", callback_data: `${prefix}:none` },
      ],
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

function titleKeyboard(defaultTitle) {
  const preview = defaultTitle.length > 35 ? defaultTitle.slice(0, 32) + "..." : defaultTitle;
  return {
    inline_keyboard: [
      [{ text: `✅ Use "${preview}"`, callback_data: "title:default" }],
      [{ text: "❌ Cancel", callback_data: "cancel" }],
    ],
  };
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

function fileActionsKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "✏️ Rename", callback_data: "act:rename" },
        { text: "🏷 Label", callback_data: "act:label" },
      ],
      [
        { text: "ℹ️ Info", callback_data: "act:info" },
        { text: "🎥 YouTube", callback_data: "act:youtube" },
      ],
      [
        { text: "📦 Move", callback_data: "act:move" },
        { text: "🗑 Delete", callback_data: "act:delete" },
      ],
      [{ text: "❌ Close", callback_data: "cancel" }],
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
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `📄 <b>${escapeHtml(f.title)}</b>\n` +
        `• Subject: ${escapeHtml(target.subjectNameAr)} / ${escapeHtml(target.sectionName)}\n` +
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
        `/rename [query] — Rename a file title\n` +
        `/label [query] — Edit or clear file label\n` +
        `/info [query] — Edit or clear info icon (ⓘ)\n` +
        `/link — Add or remove subject links\n` +
        `/youtube — Add or clear subject YouTube links\n` +
        `/move [query] — Move a file to another section\n` +
        `/delete [query] — Delete a file\n\n` +
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

  if (parsed && ["files", "rename", "info", "label", "move", "delete"].includes(parsed.cmd)) {
    await startPickerOrSearch(chatId, parsed.cmd, parsed.arg);
    return;
  }

  if (msg.document) {
    const fileName = msg.document.file_name || "document.pdf";
    const fileSize = msg.document.file_size || 0;
    const repoDir = ensureRepo();
    const manifest = readManifest(repoDir);
    const defaultTitle = cleanTitleFromFilename(fileName);
    const matches = findExistingMatches(manifest, fileName, fileSize);

    if (matches.length > 0) {
      pending.set(chatId, {
        step: "duplicate",
        fileId: msg.document.file_id,
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
      fileId: msg.document.file_id,
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
    return;
  }

  const job = pending.get(chatId);
  if (!job || !text) return;

  if (job.step === "tag") {
    job.docTag = text.toLowerCase() === "clear" ? "" : text;
    job.step = "title";
    await tg("sendMessage", {
      chat_id: chatId,
      text: `Send a custom Arabic title as a text message, or tap below to use:\n"${job.defaultTitle}"`,
      reply_markup: titleKeyboard(job.defaultTitle),
    });
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
  await tg("sendMessage", { chat_id: chatId, text: `⏳ Adding "${job.title}" and pushing to GitHub...` });
  try {
    const result = await publishUpload(job);
    const qbLine = result.questionBank
      ? result.questionBank.note
        ? `• Question Bank: ${result.questionBank.note}\n`
        : `• Question Bank: +${result.questionBank.added} questions (total: ${result.questionBank.total})\n`
      : "";
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `✅ Published!\n` +
        `• Title: ${job.title}\n` +
        `• File: ${result.relPath}\n` +
        `• Sections: ${result.addedTo.join(", ")}\n` +
        qbLine +
        `• Commit: ${result.commit}\n\n` +
        `GitHub Pages will be live in ~1 minute.`,
      reply_markup: START_KEYBOARD,
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

  const job = pending.get(chatId);
  if (!job) {
    await tg("sendMessage", { chat_id: chatId, text: "Session expired. Please start again." });
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
    if (["rename", "youtube", "info", "label", "move", "delete"].includes(nextAction)) {
      job.action = nextAction;
      await proceedWithPickedFile(chatId, job, job.pickTarget);
      return;
    }
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
      job.step = "tag";
      await tg("sendMessage", {
        chat_id: chatId,
        text: "Choose badge (docTag) for Hero / Midterm:",
        reply_markup: docTagKeyboard(),
      });
      return;
    }
    if (data.startsWith("dest:both:")) {
      job.mode = "both";
      job.sectionId = data.slice("dest:both:".length);
      job.step = "tag";
      await tg("sendMessage", {
        chat_id: chatId,
        text: "Choose badge (docTag) for Hero / Midterm:",
        reply_markup: docTagKeyboard(),
      });
      return;
    }
    if (data.startsWith("dest:sec:")) {
      job.mode = "section";
      job.sectionId = data.slice("dest:sec:".length);
      job.step = "title";
      await tg("sendMessage", {
        chat_id: chatId,
        text: `Send a custom Arabic title as a text message, or tap below to use:\n"${job.defaultTitle}"`,
        reply_markup: titleKeyboard(job.defaultTitle),
      });
      return;
    }
  }

  if (data.startsWith("tag:")) {
    const tag = data.slice(4);
    job.docTag = tag === "none" ? "" : tag;
    job.step = "title";
    await tg("sendMessage", {
      chat_id: chatId,
      text: `Send a custom Arabic title as a text message, or tap below to use:\n"${job.defaultTitle}"`,
      reply_markup: titleKeyboard(job.defaultTitle),
    });
    return;
  }

  if (data === "title:keep" && job.replaceTarget) {
    job.title = job.replaceTarget.file.title;
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
        { command: "rename", description: "Rename a file title" },
        { command: "label", description: "Edit or clear file label" },
        { command: "info", description: "Edit or clear file info icon" },
        { command: "link", description: "Add or remove subject links" },
        { command: "youtube", description: "Add or clear subject YouTube link" },
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
