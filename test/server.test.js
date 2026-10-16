import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { createApp } from "../server.js";

let server;
let baseUrl;

beforeEach(async () => {
  server = createApp().listen(0);
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
  const brandMark = await fetch(`${baseUrl}/assets/verdant-ledger-mark.svg`);
  const html = await page.text();

  assert.equal(page.status, 200);
  assert.match(html, /Verdant Ledger/);
  assert.match(html, /brand-wordmark/);
  assert.match(html, /assets\/verdant-ledger-mark\.svg/);
  assert.doesNotMatch(html, /panda|sugarcane|bamboo|intro-splash/i);
  assert.doesNotMatch(html, /spider|Spider-Man/i);
  assert.doesNotMatch(html, /contact-form|api\/inquiries|id="contact"/);
  assert.match(html, /href="mailto:hello@verdantledger\.com"/);
  assert.equal(script.status, 200);
  assert.equal(stylesheet.status, 200);
  assert.equal(brandMark.status, 200);
  assert.match(brandMark.headers.get("content-type"), /image\/svg\+xml/);
  assert.match(await brandMark.text(), /<svg\b/);
  assert.equal((await fetch(`${baseUrl}/assets/baby-panda-loading.png`)).status, 404);
  assert.equal((await fetch(`${baseUrl}/assets/baby-panda-cutout.png`)).status, 404);
  assert.equal((await fetch(`${baseUrl}/assets/hanging-spider-cutout.png`)).status, 404);
  assert.equal((await fetch(`${baseUrl}/assets/verdant-ledger-logo.svg`)).status, 404);
  assert.equal((await fetch(`${baseUrl}/assets/verdant-ninja-loader.svg`)).status, 404);
  assert.equal((await fetch(`${baseUrl}/assets/favicon.svg`)).status, 404);
});

test("does not expose the removed inquiry API", async () => {
  const response = await fetch(`${baseUrl}/api/inquiries`, { method: "POST" });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { message: "API endpoint not found." });
});

test("returns a JSON 404 for unknown API routes", async () => {
  const response = await fetch(`${baseUrl}/api/unknown`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { message: "API endpoint not found." });
});
