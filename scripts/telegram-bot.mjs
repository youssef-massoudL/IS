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
const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY || "").trim();
const GEMINI_MODEL = String(process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();

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
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
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
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini API HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
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

  manifest.updated = nowIso.slice(0, 10);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

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

  runNode(repoDir, [path.join("scripts", "build.mjs"), "--fix"]);
  runNode(repoDir, [path.join("scripts", "build.mjs"), "--check"]);

  runGit(repoDir, ["add", "-A"]);
  const status = runGit(repoDir, ["status", "--porcelain"]);
  if (!status) {
    return { relPath, addedTo, commit: "no-changes", questionBank };
  }

  runGit(repoDir, ["commit", "-m", `${commitAction} ${job.title} (${subject.id})`]);
  runGit(repoDir, ["push", "origin", GITHUB_BRANCH]);
  const commit = runGit(repoDir, ["rev-parse", "--short", "HEAD"]);
  return { relPath, addedTo, commit, questionBank };
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

function docTagKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📝 ملخص", callback_data: "tag:ملخص" },
        { text: "❓ أسئلة", callback_data: "tag:أسئلة" },
      ],
      [{ text: "بدون شارة", callback_data: "tag:none" }],
      [{ text: "❌ Cancel", callback_data: "cancel" }],
    ],
  };
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

async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const userId = String(msg.from?.id || "");
  if (userId !== ADMIN_ID) return;

  const text = (msg.text || "").trim();
  if (text === "/start" || text === "/help" || text === "🚀 Start") {
    pending.delete(chatId);
    await tg("sendMessage", {
      chat_id: chatId,
      text: "Send or forward any PDF here, and I will check if it already exists, ask which subject and section to add it to, and push it to GitHub Pages.",
      reply_markup: START_KEYBOARD,
    });
    return;
  }

  if (text === "/cancel" || text === "❌ Cancel") {
    pending.delete(chatId);
    await tg("sendMessage", {
      chat_id: chatId,
      text: "Cancelled.",
      reply_markup: START_KEYBOARD,
    });
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
  if (job && (job.step === "title" || job.step === "replace_title") && text) {
    job.title = text;
    await runPublishFlow(chatId, job);
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

  if (data === "cancel") {
    pending.delete(chatId);
    await tg("sendMessage", { chat_id: chatId, text: "Cancelled." });
    return;
  }

  const job = pending.get(chatId);
  if (!job) {
    await tg("sendMessage", { chat_id: chatId, text: "Session expired. Please send the PDF again." });
    return;
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
    await runPublishFlow(chatId, job);
    return;
  }

  if (data === "title:default") {
    job.title = job.defaultTitle;
    await runPublishFlow(chatId, job);
  }
}

async function poll() {
  let offset = 0;
  try {
    await tg("setMyCommands", {
      commands: [
        { command: "start", description: "Show start instructions" },
        { command: "help", description: "How to upload files" },
        { command: "cancel", description: "Cancel current upload" },
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
