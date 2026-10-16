import express from "express";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
      },
    },
  }));

  app.get("/", (_request, response) => {
    response.sendFile(path.join(projectRoot, "index.html"));
  });

  app.get("/styles.css", (_request, response) => {
    response.sendFile(path.join(projectRoot, "styles.css"));
  });

  app.get("/script.js", (_request, response) => {
    response.sendFile(path.join(projectRoot, "script.js"));
  });

  app.get("/assets/verdant-ledger-mark.svg", (_request, response) => {
    response.sendFile(path.join(projectRoot, "assets", "verdant-ledger-mark.svg"));
  });

  app.use("/api", (_request, response) => {
    response.status(404).json({ message: "API endpoint not found." });
  });

  return app;
}

function startServer() {
  const port = Number(process.env.PORT || 3000);
  createApp().listen(port, () => {
    console.log(`Verdant Ledger is running at http://localhost:${port}`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer();
}
