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

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = String(process.env.TELEGRAM_ADMIN_ID || "").trim();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_REPO = process.env.GITHUB_REPO || "youssef-massoudL/IS";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

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

async function publishUpload(job) {
  const repoDir = ensureRepo();
  const manifestPath = path.join(repoDir, "data", "subjects.json");
  const manifest = readManifest(repoDir);
  const subject = manifest.subjects.find((s) => s.id === job.subjectId);
  if (!subject) throw new Error(`Unknown subject: ${job.subjectId}`);

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
  const relPath = path.posix.join("files", subject.id, primarySectionId, path.basename(dest));
  const entryId = path.basename(dest, ext);

  const baseEntry = {
    id: entryId,
    title: job.title,
    original: job.fileName,
    path: relPath,
    ext: ext.slice(1),
    size,
    youtube: "",
  };
  if (job.docTag) baseEntry.docTag = job.docTag;

  const addedTo = [];

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

  manifest.updated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  runNode(repoDir, [path.join("scripts", "build.mjs"), "--fix"]);
  runNode(repoDir, [path.join("scripts", "build.mjs"), "--check"]);

  runGit(repoDir, ["add", "-A"]);
  const status = runGit(repoDir, ["status", "--porcelain"]);
  if (!status) {
    return { relPath, addedTo, commit: "no-changes" };
  }

  runGit(repoDir, ["commit", "-m", `Add ${job.title} (${subject.id})`]);
  runGit(repoDir, ["push", "origin", GITHUB_BRANCH]);
  const commit = runGit(repoDir, ["rev-parse", "--short", "HEAD"]);
  return { relPath, addedTo, commit };
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

async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const userId = String(msg.from?.id || "");
  if (userId !== ADMIN_ID) return;

  const text = (msg.text || "").trim();
  if (text === "/start" || text === "/help") {
    await tg("sendMessage", {
      chat_id: chatId,
      text: "Send or forward any PDF here, and I will ask which subject and section to add it to, then push it to GitHub Pages.",
    });
    return;
  }

  if (text === "/cancel") {
    pending.delete(chatId);
    await tg("sendMessage", { chat_id: chatId, text: "Cancelled." });
    return;
  }

  if (msg.document) {
    const fileName = msg.document.file_name || "document.pdf";
    const repoDir = ensureRepo();
    const manifest = readManifest(repoDir);
    const defaultTitle = cleanTitleFromFilename(fileName);

    pending.set(chatId, {
      step: "subject",
      fileId: msg.document.file_id,
      fileName,
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
  if (job && job.step === "title" && text) {
    job.title = text;
    await runPublishFlow(chatId, job);
  }
}

async function runPublishFlow(chatId, job) {
  pending.delete(chatId);
  await tg("sendMessage", { chat_id: chatId, text: `⏳ Adding "${job.title}" and pushing to GitHub...` });
  try {
    const result = await publishUpload(job);
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `✅ Published!\n` +
        `• Title: ${job.title}\n` +
        `• File: ${result.relPath}\n` +
        `• Sections: ${result.addedTo.join(", ")}\n` +
        `• Commit: ${result.commit}\n\n` +
        `GitHub Pages will be live in ~1 minute.`,
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

  if (data === "title:default") {
    job.title = job.defaultTitle;
    await runPublishFlow(chatId, job);
  }
}

async function poll() {
  let offset = 0;
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
