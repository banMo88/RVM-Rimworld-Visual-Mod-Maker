import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function sendJson(res, code, payload) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function sanitizeFileName(value) {
  return String(value || "modmaker_log.txt")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "modmaker_log.txt";
}

function modMakerLoggerPlugin() {
  return {
    name: "modmaker-terminal-and-file-logger",
    configureServer(server) {
      const logsDir = path.resolve(process.cwd(), "logs");
      const sourceDir = path.resolve(process.cwd(), "source");
      fs.mkdirSync(logsDir, { recursive: true });
      fs.mkdirSync(sourceDir, { recursive: true });

      server.middlewares.use(async (req, res, next) => {
        const url = (req.url || "").split("?")[0];
        if (req.method !== "POST" || (url !== "/__modmaker/log" && url !== "/__modmaker/export-log" && url !== "/__modmaker/export-source")) return next();
        try {
          const raw = await readRequestBody(req);
          const payload = raw ? JSON.parse(raw) : {};

          if (url === "/__modmaker/log") {
            const entries = Array.isArray(payload.entries) ? payload.entries : [];
            for (const entry of entries) {
              console.log(`[ModMaker][${entry.timestamp || new Date().toISOString()}][${entry.scope || "project"}] ${entry.action || "Log"}: ${entry.detail || ""}`);
            }
            return sendJson(res, 200, { ok: true, count: entries.length });
          }

          if (url === "/__modmaker/export-log") {
            const fileName = sanitizeFileName(payload.fileName);
            const target = path.join(logsDir, fileName.endsWith(".txt") ? fileName : `${fileName}.txt`);
            fs.writeFileSync(target, String(payload.content || ""), "utf8");
            console.log(`[ModMaker] Full export log written: ${target}`);
            return sendJson(res, 200, { ok: true, path: target });
          }

          if (url === "/__modmaker/export-source") {
            const fileName = sanitizeFileName(payload.fileName);
            const target = path.join(sourceDir, fileName.endsWith(".json") ? fileName : `${fileName}.json`);
            fs.writeFileSync(target, String(payload.content || ""), "utf8");
            console.log(`[ModMaker] Project source written: ${target}`);
            return sendJson(res, 200, { ok: true, path: target });
          }
        } catch (error) {
          console.error("[ModMaker] Logger endpoint failed:", error);
          return sendJson(res, 500, { ok: false, error: String(error) });
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [modMakerLoggerPlugin()]
});
