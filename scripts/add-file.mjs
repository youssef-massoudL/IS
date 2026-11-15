import fs from "node:fs";
import path from "node:path";

const SITE = path.resolve(import.meta.dirname, "..");
const MANIFEST = path.join(SITE, "data", "subjects.json");
const FILES = path.join(SITE, "files");

const argv = process.argv.slice(2);
const opt = {};
for (let i = 0; i < argv.length; i += 1) {
  const token = argv[i];
  if (!token.startsWith("--")) continue;
  const key = token.slice(2);
  const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[(i += 1)] : "true";
  opt[key] = value;
}

const usage = `usage:
  node scripts/add-file.mjs --subject <id> --section <id> --file <path> [--title "…"] [--slug name] [--youtube URL]

example:
  node scripts/add-file.mjs --subject computer-networks --section lectures \\
    --file "C:\\Users\\me\\Downloads\\lec07.pdf" --title "المحاضرة 07" \\
    --youtube "https://youtu.be/xxxx"`;

if (opt.help || !opt.subject || !opt.section || !opt.file) {
  console.error(usage);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const subject = manifest.subjects.find((entry) => entry.id === opt.subject);
if (!subject) {
  console.error(`unknown subject "${opt.subject}"\nknown: ${manifest.subjects.map((s) => s.id).join(", ")}`);
  process.exit(1);
}

let section = subject.sections.find((entry) => entry.id === opt.section);
if (!section) {
  section = { id: opt.section, name: opt.section, nameEn: opt.section, files: [] };
  subject.sections.push(section);
  console.log(`created section "${opt.section}"`);
}

const source = path.resolve(opt.file);
if (!fs.existsSync(source)) {
  console.error(`file not found: ${source}`);
  process.exit(1);
}

const ext = path.extname(source).toLowerCase();
const base = opt.slug || path.basename(source, ext);
const slug = base
  .toLowerCase()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
  .replace(/^-+|-+$/g, "") || "file";

const outDir = path.join(FILES, subject.id, section.id);
fs.mkdirSync(outDir, { recursive: true });

let dest = path.join(outDir, `${slug}${ext}`);
let counter = 2;
while (fs.existsSync(dest)) dest = path.join(outDir, `${slug}-${counter++}${ext}`);
fs.copyFileSync(source, dest);

const rel = path.posix.join("files", subject.id, section.id, path.basename(dest));
const title = opt.title || path.basename(source, ext);

if (section.files.some((file) => file.path === rel)) {
  console.error(`manifest already lists ${rel}`);
  process.exit(1);
}

section.files.push({
  id: path.basename(dest, ext),
  title,
  original: path.basename(source),
  path: rel,
  ext: ext.slice(1),
  size: fs.statSync(dest).size,
  youtube: opt.youtube || "",
  addedAt: new Date().toISOString(),
});

const firstNumber = (value) => {
  const match = value.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 9999;
};
section.files.sort((a, b) => firstNumber(a.title) - firstNumber(b.title) || a.title.localeCompare(b.title, "ar", { numeric: true }));

manifest.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(`added ${rel}`);
console.log("next: run  powershell -ExecutionPolicy Bypass -File scripts/build-zips.ps1  to refresh the ZIPs");
