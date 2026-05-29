import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const clientAssetsDir = path.resolve(__dirname, "Clients_requirementAToZ");

const mimeTypes = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".heic": "image/heic",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".pdf": "application/pdf",
  ".zip": "application/zip"
};

function contentTypeFor(filePath) {
  return mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function isInside(baseDir, targetPath) {
  return targetPath === baseDir || targetPath.startsWith(`${baseDir}${path.sep}`);
}

function streamFile(req, res, filePath, stat) {
  const range = req.headers.range;
  const contentType = contentTypeFor(filePath);

  res.setHeader("Content-Type", contentType);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "public, max-age=3600");

  if (!range) {
    res.setHeader("Content-Length", stat.size);
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  const [, startText, endText] = range.match(/bytes=(\d*)-(\d*)/) || [];
  const start = startText ? Number(startText) : 0;
  const end = endText ? Number(endText) : stat.size - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= stat.size) {
    res.statusCode = 416;
    res.setHeader("Content-Range", `bytes */${stat.size}`);
    res.end();
    return;
  }

  res.statusCode = 206;
  res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);
  res.setHeader("Content-Length", end - start + 1);

  if (req.method === "HEAD") {
    res.end();
    return;
  }

  fs.createReadStream(filePath, { start, end }).pipe(res);
}

function attachClientAssetMiddleware(middlewares) {
  middlewares.use("/client-assets", (req, res, next) => {
    const rawUrl = (req.url || "/").split("?")[0];
    const decodedPath = decodeURIComponent(rawUrl).replace(/^\/+/, "");
    const requestedPath = path.resolve(clientAssetsDir, path.normalize(decodedPath));

    if (!isInside(clientAssetsDir, requestedPath)) {
      res.statusCode = 403;
      res.end("Forbidden");
      return;
    }

    fs.stat(requestedPath, (error, stat) => {
      if (error || !stat.isFile()) {
        next();
        return;
      }
      streamFile(req, res, requestedPath, stat);
    });
  });
}

function clientAssetsPlugin() {
  return {
    name: "client-assets-server",
    configureServer(server) {
      attachClientAssetMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachClientAssetMiddleware(server.middlewares);
    }
  };
}

export default defineConfig({
  plugins: [react(), clientAssetsPlugin()],
  server: {
    port: 5173,
    strictPort: false
  }
});
