import fs from "fs";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import path from "path";
import sharp from "sharp";
import { envConfig } from "./env.js";
import { supabaseMiddleware } from "./middleware/auth.middleware.js";
import { errorHandlerMiddleware } from "./middleware/errorMiddleware.js";
import route from "./route/route.js";
import { bankWords } from "./utils/constant.js";
import { worker } from "./utils/function.js";

const app = new Hono();

// Apply CORS first, then middleware
app.use(
  "*",
  cors({
    origin: [
      `${
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : [
              "https://paldistribution.live",
              "https://primepinas.com",
              "https://website.primepinas.com",
              "https://front.primepinas.com",
            ]
      }`,
    ],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "x-tenant-id",
      "Access-Control-Allow-Origin",
    ],
    exposeHeaders: ["Content-Range", "X-Total-Count"],
  }),
  supabaseMiddleware()
);

app.use(logger()); // Logger should be before error handling

app.get("/", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Status</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
          }
          .status {
            font-size: 20px;
            color: green;
          }
        </style>
    </head>
    <body>
        <h1>API Status</h1>
        <p class="status">✅ API is working perfectly!</p>
        <p>Current Time: ${new Date().toLocaleString()}</p>
    </body>
    </html>
  `);
});

app.route("/api/v1", route);
const RECEIPT_FOLDER = path.join("public", "images");
const files = fs.readdirSync(RECEIPT_FOLDER);

let approvedCount = 0;
let rejectedCount = 0;

const normalize = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^\w\s₱\+]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const bankKeywords = await bankWords();

console.log(bankKeywords);
(async () => {
  console.log("🔍 Starting local batch validation...\n");

  for (const filename of files) {
    const filePath = path.join(RECEIPT_FOLDER, filename);

    const processedBuffer = await sharp(filePath)
      .grayscale()
      .normalize()
      .resize({ width: 1200 }) // Upscale for better OCR
      .toBuffer();
    const {
      data: { text },
    } = await worker.recognize(processedBuffer, {
      rotateAuto: true,
    });

    const matchedKeywords = bankKeywords.filter((keyword) =>
      normalize(text).includes(normalize(keyword))
    );

    const hasMinimumKeywordMatch = matchedKeywords.length >= 3;

    console.log(hasMinimumKeywordMatch);

    if (hasMinimumKeywordMatch) {
      approvedCount++;
      console.log(`✅ APPROVED: ${filename}, ${approvedCount}`);
    } else {
      rejectedCount++;
      console.log(`❌ REJECTED: ${filename}, ${rejectedCount}`);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Approved: ${approvedCount}`);
  console.log(`Rejected: ${rejectedCount}`);
})();

app.onError(errorHandlerMiddleware);

// Ensure the server starts correctly in Bun
export default {
  port: envConfig.PORT || 9000, // Use 9000 if env variable is missing
  fetch: app.fetch, // Bun automatically calls this
};
