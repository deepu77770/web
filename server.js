import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { MongoClient } from "mongodb";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const allowedRequestTypes = new Set([
  "carbon-accounting",
  "esg-disclosures",
  "assurance",
  "consultant-network",
  "other",
]);

export function createApp(inquiries) {
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
  app.use(express.json({ limit: "10kb" }));

  app.get("/", (_request, response) => {
    response.sendFile(path.join(projectRoot, "index.html"));
  });

  app.get("/styles.css", (_request, response) => {
    response.sendFile(path.join(projectRoot, "styles.css"));
  });

  app.get("/script.js", (_request, response) => {
    response.sendFile(path.join(projectRoot, "script.js"));
  });

  app.get("/assets/panda-image.png", (_request, response) => {
    response.sendFile(path.join(projectRoot, "assets", "baby-panda-loading.png"));
  });

  app.get("/assets/loading-character.png", (_request, response) => {
    response.sendFile(path.join(projectRoot, "assets", "baby-panda-loading.png"));
  });

  app.get("/assets/baby-panda-loading.svg", (_request, response) => {
    response.sendFile(path.join(projectRoot, "assets", "baby-panda-loading.png"));
  });

  app.get("/assets/baby-panda-loading.png", (_request, response) => {
    response.sendFile(path.join(projectRoot, "assets", "baby-panda-loading.png"));
  });

  app.get("/assets/baby-panda-cutout.png", (_request, response) => {
    response.sendFile(path.join(projectRoot, "assets", "baby-panda-cutout.png"));
  });

  app.get("/assets/hanging-spider-cutout.png", (_request, response) => {
    response.sendFile(path.join(projectRoot, "assets", "hanging-spider-cutout.png"));
  });

  app.post(
    "/api/inquiries",
    rateLimit({
      windowMs: 10 * 60 * 1000,
      limit: 8,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { message: "Too many requests. Please wait a few minutes and try again." },
    }),
    async (request, response, next) => {
      try {
        const body = request.body;
        const name = typeof body?.name === "string" ? body.name.trim() : "";
        const email = typeof body?.email === "string" ? body.email.trim() : "";
        const company = typeof body?.company === "string" ? body.company.trim() : "";
        const requestType = typeof body?.requestType === "string" ? body.requestType : "";
        const message = typeof body?.message === "string" ? body.message.trim() : "";

        if (
          name.length < 1 || name.length > 100 ||
          email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
          company.length > 150 ||
          !allowedRequestTypes.has(requestType) ||
          message.length < 1 || message.length > 3000
        ) {
          response.status(400).json({ message: "Please check the form fields and try again." });
          return;
        }

        const result = await inquiries.insertOne({
          name,
          email,
          company: company || null,
          requestType,
          message,
          createdAt: new Date(),
        });

        response.status(201).json({
          message: "Thanks for reaching out. Your inquiry has been received.",
          id: result.insertedId.toString(),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.use("/api", (_request, response) => {
    response.status(404).json({ message: "API endpoint not found." });
  });

  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError && "body" in error) {
      response.status(400).json({ message: "Request body must be valid JSON." });
      return;
    }
    if (error?.type === "entity.too.large") {
      response.status(413).json({ message: "Request body is too large." });
      return;
    }

    console.error("Request failed:", error);
    response.status(500).json({ message: "The request could not be completed. Please try again later." });
  });

  return app;
}

async function startServer() {
  const requiredConfig = ["MONGODB_URI"];
  const missingConfig = requiredConfig.filter((key) => !process.env[key]);

  if (missingConfig.length > 0) {
    throw new Error(`Missing required environment variables: ${missingConfig.join(", ")}`);
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const database = client.db(process.env.MONGODB_DB || "verdant_ledger");
    const inquiries = database.collection("inquiries");
    await inquiries.createIndex({ createdAt: -1 });

    const app = createApp(inquiries);
    const port = Number(process.env.PORT || 3000);
    const server = app.listen(port, () => {
      console.log(`Verdant Ledger is running at http://localhost:${port}`);
    });
    server.on("close", () => {
      client.close().catch((error) => {
        console.error("Could not close the MongoDB connection cleanly.", error);
      });
    });
  } catch (error) {
    console.error("Could not connect to MongoDB. Check MONGODB_URI and the database settings.", error);
    await client.close();
    throw error;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) {
  try {
    await startServer();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Missing required environment variables:")) {
      console.error(error.message);
    }
    process.exitCode = 1;
  }
}
