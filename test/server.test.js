import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { createApp } from "../server.js";

let server;
let baseUrl;
let insertedInquiries;

beforeEach(async () => {
  insertedInquiries = [];
  const inquiries = {
    async insertOne(document) {
      insertedInquiries.push(document);
      return { insertedId: "mongo-inquiry-41" };
    },
  };
  server = createApp(inquiries).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
  server.closeAllConnections();
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test("serves the website entry point and frontend assets", async () => {
  const page = await fetch(baseUrl);
  const script = await fetch(`${baseUrl}/script.js`);
  const stylesheet = await fetch(`${baseUrl}/styles.css`);
  const pandaImage = await fetch(`${baseUrl}/assets/panda-image.png`);
  const loadingCharacter = await fetch(`${baseUrl}/assets/loading-character.png`);
  const babyPanda = await fetch(`${baseUrl}/assets/baby-panda-loading.svg`);
  const pandaCutout = await fetch(`${baseUrl}/assets/baby-panda-cutout.png`);
  const hangingSpider = await fetch(`${baseUrl}/assets/hanging-spider-cutout.png`);
  const html = await page.text();

  assert.equal(page.status, 200);
  assert.match(html, /Verdant Ledger/);
  assert.match(html, /FRESH SUGARCANE\. HAPPY PAWS\./);
  assert.match(html, /assets\/baby-panda-cutout\.png/);
  assert.match(html, /class="hanging-spider"/);
  assert.match(html, /assets\/hanging-spider-cutout\.png/);
  assert.match(html, /Snack time/);
  assert.equal(script.status, 200);
  assert.equal(stylesheet.status, 200);
  assert.equal(pandaImage.status, 200);
  assert.equal(loadingCharacter.status, 200);
  assert.equal(babyPanda.status, 200);
  assert.equal(pandaCutout.status, 200);
  assert.equal(hangingSpider.status, 200);
  assert.match(pandaImage.headers.get("content-type"), /image\/png/);
  assert.match(loadingCharacter.headers.get("content-type"), /image\/png/);
  assert.match(babyPanda.headers.get("content-type"), /image\/png/);
  assert.match(pandaCutout.headers.get("content-type"), /image\/png/);
  assert.match(hangingSpider.headers.get("content-type"), /image\/png/);
  assert.deepEqual(
    [...new Uint8Array(await pandaImage.arrayBuffer()).slice(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
  );
  assert.equal((await fetch(`${baseUrl}/assets/verdant-ledger-logo.svg`)).status, 404);
  assert.equal((await fetch(`${baseUrl}/assets/verdant-ninja-loader.svg`)).status, 404);
  assert.equal((await fetch(`${baseUrl}/assets/favicon.svg`)).status, 404);
});

test("validates an inquiry and inserts a document into MongoDB", async () => {
  const response = await fetch(`${baseUrl}/api/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "  Rina Mori ",
      email: " rina@example.com ",
      company: "",
      requestType: "carbon-accounting",
      message: "  We need help with our annual report. ",
    }),
  });
  const result = await response.json();

  assert.equal(response.status, 201);
  assert.equal(result.id, "mongo-inquiry-41");
  assert.equal(insertedInquiries.length, 1);
  assert.deepEqual(
    {
      name: insertedInquiries[0].name,
      email: insertedInquiries[0].email,
      company: insertedInquiries[0].company,
      requestType: insertedInquiries[0].requestType,
      message: insertedInquiries[0].message,
    },
    {
      name: "Rina Mori",
      email: "rina@example.com",
      company: null,
      requestType: "carbon-accounting",
      message: "We need help with our annual report.",
    },
  );
  assert.ok(insertedInquiries[0].createdAt instanceof Date);
});

test("rejects invalid inquiry data without touching MongoDB", async () => {
  const response = await fetch(`${baseUrl}/api/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Valid name",
      email: "not-an-email",
      company: "",
      requestType: "unknown",
      message: "Details",
    }),
  });

  assert.equal(response.status, 400);
  assert.equal(insertedInquiries.length, 0);
});

test("rejects malformed JSON with a clear client error", async () => {
  const response = await fetch(`${baseUrl}/api/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{invalid",
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: "Request body must be valid JSON." });
  assert.equal(insertedInquiries.length, 0);
});

test("rejects request bodies larger than the API limit", async () => {
  const response = await fetch(`${baseUrl}/api/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "x".repeat(12_000) }),
  });

  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { message: "Request body is too large." });
  assert.equal(insertedInquiries.length, 0);
});

test("returns a JSON 404 for unknown API routes", async () => {
  const response = await fetch(`${baseUrl}/api/unknown`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { message: "API endpoint not found." });
});
