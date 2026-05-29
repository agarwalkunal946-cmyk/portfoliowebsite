import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(projectRoot, "Clients_requirementAToZ");
const manifestPath = path.join(projectRoot, "src", "data", "assetManifest.json");
const publicRoot = path.join(projectRoot, "public", "portfolio-assets");
const previewDir = path.join(publicRoot, "previews");
const docsDir = path.join(publicRoot, "docs");

function run(command, args) {
  return spawnSync(command, args, {
    stdio: "pipe",
    windowsHide: true
  });
}

function ffmpeg(input, output, kind) {
  const scale = kind === "video" ? "scale=720:-2" : "scale=900:-2";
  const args =
    kind === "video"
      ? [
          "-y",
          "-hide_banner",
          "-loglevel",
          "error",
          "-ss",
          "00:00:01",
          "-i",
          input,
          "-frames:v",
          "1",
          "-vf",
          scale,
          "-q:v",
          "8",
          output
        ]
      : ["-y", "-hide_banner", "-loglevel", "error", "-i", input, "-frames:v", "1", "-vf", scale, "-q:v", "8", output];

  const result = run("ffmpeg", args);

  if (result.status !== 0 && kind === "video") {
    return run("ffmpeg", [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      input,
      "-frames:v",
      "1",
      "-vf",
      scale,
      "-q:v",
      "8",
      output
    ]);
  }

  return result;
}

function padId(id) {
  return String(id).padStart(4, "0");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Missing source folder: ${sourceDir}`);
}

if (!fs.existsSync(manifestPath)) {
  throw new Error("Run npm run generate:assets before generating deploy assets.");
}

ensureDir(previewDir);
ensureDir(docsDir);

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
let created = 0;
let skipped = 0;
let failed = 0;

for (const asset of manifest.assets) {
  const input = path.join(sourceDir, ...asset.path.split("/"));
  const id = padId(asset.id);

  if (asset.type === "image" || asset.type === "video") {
    const output = path.join(previewDir, `${id}.jpg`);
    if (fs.existsSync(output)) {
      skipped += 1;
      continue;
    }

    const result = ffmpeg(input, output, asset.type);
    if (result.status === 0 && fs.existsSync(output)) {
      created += 1;
      continue;
    }

    failed += 1;
    const message = result.stderr?.toString().trim() || "unknown ffmpeg error";
    console.warn(`Preview failed for ${asset.path}: ${message}`);
    continue;
  }

  if (asset.type === "document") {
    const output = path.join(docsDir, `${id}.${asset.extension}`);
    if (fs.existsSync(output)) {
      skipped += 1;
      continue;
    }
    fs.copyFileSync(input, output);
    created += 1;
  }
}

console.log(`Deploy assets ready: ${created} created, ${skipped} skipped, ${failed} failed.`);
if (failed > 0) {
  process.exitCode = 1;
}
