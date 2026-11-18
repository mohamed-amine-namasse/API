import "dotenv/config";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const API_KEY = process.env.RAWG_API_KEY;

if (!API_KEY) {
  console.error(
    "❌ Erreur : La clé RAWG_API_KEY est introuvable dans le fichier .env !",
  );
  process.exit(1);
}

http
  .createServer((req, res) => {
    if (
      req.url === "/" ||
      req.url === "/index.html" ||
      /^\/game\/\d+\/?$/.test(req.url)
    ) {
      const htmlPath = path.join(__dirname, "index.html");
      fs.readFile(htmlPath, "utf8", (err, htmlContent) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Erreur de lecture du fichier index.html");
        } else {
          // Injection sécurisée de la clé du .env dans le HTML
          const finalHtml = htmlContent.replace("RAWG_API_KEY", API_KEY);
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(finalHtml);
        }
      });
    } else if (req.url === "/style.css") {
      const cssPath = path.join(__dirname, "style.css");
      fs.readFile(cssPath, (err, content) => {
        if (err) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("style.css introuvable");
        } else {
          res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
          res.end(content);
        }
      });
    } else if (req.url === "/app.css") {
      const cssPath = path.join(__dirname, "app.css");
      fs.readFile(cssPath, (err, content) => {
        if (err) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("app.css introuvable");
        } else {
          res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
          res.end(content);
        }
      });
    } else if (req.url === "/lucide.js") {
      const lucidePath = path.join(
        __dirname,
        "node_modules",
        "lucide",
        "dist",
        "umd",
        "lucide.js",
      );
      fs.readFile(lucidePath, (err, content) => {
        if (err) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("lucide.js introuvable");
        } else {
          res.writeHead(200, {
            "Content-Type": "application/javascript; charset=utf-8",
          });
          res.end(content);
        }
      });
    } else if (req.url === "/favicon.ico") {
      res.writeHead(204);
      res.end();
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Page non trouvée");
    }
  })
  .listen(PORT, () => {
    console.log(`🚀 Application prête sur http://localhost:${PORT}`);
  });
