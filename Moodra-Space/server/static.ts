import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function serveStatic(app: Express) {
  // __dirname is not available in ESM; derive it from import.meta.url
  const _dirname = typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.resolve(_dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Explicitly serve favicon.ico (browsers request it automatically)
  // Serve favicon.png if favicon.ico doesn't exist, with immutable cache headers
  app.get("/favicon.ico", (req, res) => {
    const faviconPath = path.resolve(distPath, "favicon.ico");
    const fallbackPath = path.resolve(distPath, "favicon.png");
    if (fs.existsSync(faviconPath)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.sendFile(faviconPath);
    } else if (fs.existsSync(fallbackPath)) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.sendFile(fallbackPath);
    } else {
      res.status(404).send("Not Found");
    }
  });

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
