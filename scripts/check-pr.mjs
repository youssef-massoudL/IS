import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SITE = path.resolve(import.meta.dirname, "..");
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_TOTAL_FILES_BYTES = 450 * 1024 * 1024;
const URL_KEYS = new Set(["youtube", "url", "href"]);

const errors = [];

function isSafeHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function scanUrls(node, sourceLabel) {
  if (Array.isArray(node)) {
    node.forEach((item, index) => scanUrls(item, `${sourceLabel}[${index}]`));
    return;
  }
  if (!node || typeof node !== "object") return;

  for (const [key, value] of Object.entries(node)) {
    if (URL_KEYS.has(key) && typeof value === "string" && value.trim()) {
      if (!isSafeHttpUrl(value.trim())) {
        errors.push(`unsafe or invalid URL at ${sourceLabel}.${key}: ${value}`);
      }
    } else if (value && typeof value === "object") {
      scanUrls(value, `${sourceLabel}.${key}`);
    }
  }
}

function checkJsonUrls() {
  const jsonTargets = [
    path.join(SITE, "data", "subjects.json"),
    path.join(SITE, "data", "schedule.json"),
  ];
  const questionsDir = path.join(SITE, "data", "questions");
  if (fs.existsSync(questionsDir)) {
    for (const entry of fs.readdirSync(questionsDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
        jsonTargets.push(path.join(questionsDir, entry.name));
      }
    }
  }

  for (const file of jsonTargets) {
    if (!fs.existsSync(file)) continue;
    const rel = path.relative(SITE, file).replace(/\\/g, "/");
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
      scanUrls(parsed, rel);
    } catch (err) {
      errors.push(`failed to parse ${rel}: ${err.message}`);
    }
  }
}

function checkFileSizes() {
  const filesDir = path.join(SITE, "files");
  if (!fs.existsSync(filesDir)) return;

  let totalBytes = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const size = fs.statSync(full).size;
        totalBytes += size;
        if (size > MAX_FILE_BYTES) {
          const rel = path.relative(SITE, full).replace(/\\/g, "/");
          errors.push(
            `file exceeds ${(MAX_FILE_BYTES / 1048576).toFixed(0)} MB limit: ${rel} (${(size / 1048576).toFixed(1)} MB)`,
          );
        }
      }
    }
  };
  walk(filesDir);

  if (totalBytes > MAX_TOTAL_FILES_BYTES) {
    errors.push(
      `total files/ size ${(totalBytes / 1048576).toFixed(1)} MB exceeds ${(MAX_TOTAL_FILES_BYTES / 1048576).toFixed(0)} MB cap`,
    );
  }
}

function checkTrackedForbiddenFiles() {
  let tracked = [];
  try {
    const out = execFileSync("git", ["ls-files", "-z"], {
      cwd: SITE,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    tracked = out.split("\0").filter(Boolean);
  } catch {
    return;
  }

  for (const rel of tracked) {
    const base = path.posix.basename(rel);
    if ((base === ".env" || base.startsWith(".env.")) && base !== ".env.example") {
      errors.push(`forbidden secret env file tracked in git: ${rel}`);
    }
    if (rel.startsWith("downloads/") && rel.endsWith(".zip")) {
      errors.push(`generated archive should not be committed: ${rel}`);
    }
    if (rel.startsWith("_site/")) {
      errors.push(`build output should not be committed: ${rel}`);
    }
  }
}

checkJsonUrls();
checkFileSizes();
checkTrackedForbiddenFiles();

if (errors.length) {
  console.error(`PR guardrail checks failed (${errors.length}):`);
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}

console.log("PR guardrail checks passed (URLs, file sizes, tracked files)");
