import express from "express";
import fs from "fs";
import path from "path";
import { geminiRouter } from "./server/routes/geminiRoutes.ts";

async function startServer() {
  const app = express();
  // Reverse proxy routes all external traffic exclusively to port 3000.
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Bloomix" });
  });

  // Universal Flower Asset Interceptor:
  // Guarantees that ANY request for ANY floral asset (/assets/flowers/* or /flowers/*)
  // regardless of extension (.png, .webp, .jpg) will ALWAYS serve the 100% transparent PNG version
  // with CORS headers (Access-Control-Allow-Origin: *) and clean cache control headers.
  app.get(["/assets/flowers/:file", "/flowers/:file"], (req, res, next) => {
    const rawFile = path.basename(req.params.file);
    const baseName = rawFile.replace(/\.(png|webp|jpg|jpeg)$/i, "").toLowerCase().trim();
    const candidatePaths = [
      path.join(process.cwd(), "public/assets/flowers", `${baseName}.png`),
      path.join(process.cwd(), "public/flowers", `${baseName}.png`),
      path.join(process.cwd(), "dist/assets/flowers", `${baseName}.png`),
      path.join(process.cwd(), "dist/flowers", `${baseName}.png`),
    ];

    const pngFile = candidatePaths.find((p) => fs.existsSync(p));

    if (pngFile) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Cache-Control", "public, max-age=3600, must-revalidate");
      return res.sendFile(pngFile, (err) => {
        if (err) next(err);
      });
    }
    next();
  });

  // Gemini proxy API routes
  app.use("/api/gemini", geminiRouter);

  // Vite middleware in dev mode / static files in production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const mainServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bloomix server running at http://0.0.0.0:${PORT}`);
  });
  mainServer.on("error", (err) => {
    console.error(`Main server error on port ${PORT}:`, err);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

