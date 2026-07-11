// Screenshot docs pages from a running dev server (default http://127.0.0.1:4173).
//
//   node scripts/screenshot-docs.mjs [--out DIR] [--width PX] [--selector CSS] <route...>
//
// Examples:
//   node scripts/screenshot-docs.mjs / components/button
//   node scripts/screenshot-docs.mjs --selector "#anatomy" components/select components/menu
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const routes = [];
let out = "screenshots";
let width = 1200;
let selector;
let base = process.env.DOCS_URL ?? "http://127.0.0.1:4173";
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--out") out = args[++i];
  else if (arg === "--width") width = Number(args[++i]);
  else if (arg === "--selector") selector = args[++i];
  else if (arg === "--base") base = args[++i];
  else routes.push(arg.replace(/^\//, ""));
}
if (routes.length === 0) {
  console.error(
    "Usage: node scripts/screenshot-docs.mjs [--out DIR] [--width PX] [--selector CSS] <route...>",
  );
  process.exit(1);
}

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 1200 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});
for (const route of routes) {
  const name = route === "" ? "home" : route.replaceAll("/", "-");
  await page.goto(`${base}/${route}`, { waitUntil: "networkidle" });
  if (selector) {
    const target = page.locator(selector).first();
    await target.scrollIntoViewIfNeeded();
    await target.screenshot({ path: `${out}/${name}.png` });
  } else {
    await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  }
  console.log(`${out}/${name}.png`);
}
console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "no console errors");
await browser.close();
