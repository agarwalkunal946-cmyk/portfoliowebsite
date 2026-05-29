import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(projectRoot, "Clients_requirementAToZ");
const outputFile = path.join(projectRoot, "src", "data", "assetManifest.json");
const publicAssetRoot = path.join(projectRoot, "public", "portfolio-assets");

const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".heic"]);
const videoExtensions = new Set([".mp4", ".mov"]);
const documentExtensions = new Set([".pdf", ".zip"]);
const ignoredFiles = new Set([".DS_Store"]);

function titleCase(text) {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/'S\b/g, "'s");
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }
    if (!entry.isFile() || ignoredFiles.has(entry.name)) {
      return [];
    }
    return fullPath;
  });
}

function bytesToLabel(bytes) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

function publicPathIfExists(...parts) {
  const fullPath = path.join(publicAssetRoot, ...parts);
  if (!fs.existsSync(fullPath)) {
    return undefined;
  }
  return ["portfolio-assets", ...parts].join("/");
}

function staticPathsFor(assetId, type, extension) {
  const paddedId = String(assetId).padStart(4, "0");
  const staticPaths = {};

  if (type === "image" || type === "video") {
    staticPaths.previewPath = publicPathIfExists("previews", `${paddedId}.jpg`);
  }

  if (type === "document") {
    staticPaths.downloadPath = publicPathIfExists("docs", `${paddedId}.${extension}`);
  }

  return staticPaths;
}

function classify(relativePath) {
  const parts = relativePath.split("/");
  const extension = path.extname(relativePath).toLowerCase();
  const topLevel = parts[0] || "Portfolio Source";
  const collection = parts.length > 1 ? parts.slice(0, -1).join(" / ") : "Portfolio Source";
  const project = parts.length > 2 ? parts[1] : topLevel.replace(/\.[^.]+$/, "");

  let type = "document";
  if (imageExtensions.has(extension)) type = "image";
  if (videoExtensions.has(extension)) type = "video";
  if (documentExtensions.has(extension)) type = "document";

  let medium = "Source Files";
  if (topLevel.includes("Canva")) medium = "Canva Designs";
  if (topLevel.includes("Dslr")) medium = "DSLR Shoots";
  if (topLevel.includes("iPhone")) medium = "iPhone Shoots";
  if (topLevel.includes("clothing")) medium = "Clothing Shoot";
  if (relativePath.toLowerCase().includes("resume")) medium = "Resume";
  if (relativePath.toLowerCase().includes("website portfolio")) medium = "Reference PDF";

  return {
    type,
    medium,
    project: titleCase(project),
    collection: titleCase(collection)
  };
}

if (!fs.existsSync(sourceDir)) {
  if (fs.existsSync(outputFile)) {
    console.log("Source folder is local-only; using committed asset manifest.");
    process.exit(0);
  }
  throw new Error(`Missing source directory: ${sourceDir}`);
}

const assets = walk(sourceDir)
  .sort((a, b) => a.localeCompare(b, "en"))
  .map((fullPath, index) => {
    const stat = fs.statSync(fullPath);
    const relativePath = path.relative(sourceDir, fullPath).split(path.sep).join("/");
    const extension = path.extname(fullPath).toLowerCase();
    const extensionName = extension.replace(".", "");
    const name = path.basename(fullPath);
    const title = titleCase(name.replace(/\.[^.]+$/, ""));
    const typeInfo = classify(relativePath);

    return {
      id: index + 1,
      path: relativePath,
      name,
      title,
      extension: extensionName,
      size: stat.size,
      sizeLabel: bytesToLabel(stat.size),
      ...typeInfo,
      ...staticPathsFor(index + 1, typeInfo.type, extensionName)
    };
  });

const totals = assets.reduce(
  (accumulator, asset) => {
    accumulator.files += 1;
    accumulator.bytes += asset.size;
    accumulator.byType[asset.type] = (accumulator.byType[asset.type] || 0) + 1;
    accumulator.byMedium[asset.medium] = (accumulator.byMedium[asset.medium] || 0) + 1;
    return accumulator;
  },
  { files: 0, bytes: 0, byType: {}, byMedium: {} }
);

const manifest = {
  generatedAt: new Date().toISOString(),
  sourceFolder: "Clients_requirementAToZ",
  totalSizeLabel: bytesToLabel(totals.bytes),
  totals,
  assets
};

fs.writeFileSync(outputFile, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Generated ${assets.length} portfolio assets in ${path.relative(projectRoot, outputFile)}`);
