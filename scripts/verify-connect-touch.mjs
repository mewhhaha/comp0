import assert from "node:assert/strict";
import { chromium } from "playwright";
import axe from "axe-core";

const base = process.env.DOCS_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const cdp = await page.context().newCDPSession(page);
  async function gesture(start, end, finish = "touchEnd") {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...start, id: 1 }],
    });
    for (let step = 1; step <= 8; step++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          {
            x: start.x + ((end.x - start.x) * step) / 8,
            y: start.y + ((end.y - start.y) * step) / 8,
            id: 1,
          },
        ],
      });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: finish, touchPoints: [] });
  }
  async function center(control) {
    await control.scrollIntoViewIfNeeded();
    const bounds = await control.boundingBox();
    assert(bounds, "Touch control must have visible bounds");
    return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  }

  await page.goto(`${base}/components/connect`);
  await page.waitForLoadState("networkidle");
  const example = page.getByRole("region", { name: "Live example", exact: true });
  const source = example.getByRole("button", { name: "Weather: Rain output (weather)" });
  const input = example.getByRole("button", { name: "Garden: Flower input (weather)" });
  await example.getByText("Source", { exact: true }).tap();
  const select = example.getByRole("combobox");
  await source.tap();
  await input.tap();
  assert.equal(await select.inputValue(), "rain", "Separate taps must connect ports");
  await select.selectOption("sun");
  let start = await center(source);
  await gesture(start, { x: start.x + 5, y: start.y });
  assert.equal(
    await source.getAttribute("aria-pressed"),
    "true",
    "Small finger movement must remain a tap",
  );
  await input.tap();
  assert.equal(await select.inputValue(), "rain", "A tap with finger movement must still connect");

  await select.selectOption("sun");
  await example.scrollIntoViewIfNeeded();
  start = await center(source);
  const end = await center(input);
  await gesture(start, end);
  assert.equal(await select.inputValue(), "rain", "A touch drag must connect compatible ports");
  await select.selectOption("sun");
  start = await center(source);
  await gesture(start, { x: start.x + 30, y: start.y }, "touchCancel");
  assert.equal(
    await select.inputValue(),
    "sun",
    "Interrupted touch gestures must not edit connections",
  );
  assert.equal(
    await source.getAttribute("aria-pressed"),
    "false",
    "Interrupted gestures must clear the selected output",
  );
  await source.tap();
  await input.tap();
  assert.equal(await select.inputValue(), "rain", "Taps must work after a canceled gesture");

  const shader = page.getByRole("region", { name: "Shader connections", exact: true });
  assert.equal(
    await shader.getByRole("button", { name: "Cards", exact: true }).getAttribute("aria-pressed"),
    "true",
  );
  const vectorSource = shader.getByRole("combobox", {
    name: "Noise Texture: Vector source (vector)",
  });
  await shader.getByRole("button", { name: "Texture Coordinate: Normal output (vector)" }).tap();
  await shader.getByRole("button", { name: "Noise Texture: Vector input (vector)" }).tap();
  assert.equal(
    await vectorSource.inputValue(),
    "normal",
    "Cards must connect across vertical scrolling",
  );
  await vectorSource.selectOption("uv");
  await shader.getByRole("button", { name: "Disconnect Noise Texture: Vector" }).tap();
  assert.equal(await vectorSource.inputValue(), "", "Touch must disconnect an input");
  await vectorSource.selectOption("generated");

  const undersized = await shader.locator("button, select").evaluateAll((controls) =>
    controls
      .filter((control) => {
        const bounds = control.getBoundingClientRect();
        return bounds.width < 44 || bounds.height < 44;
      })
      .map((control) => control.getAttribute("aria-label") ?? control.textContent),
  );
  assert.deepEqual(
    undersized,
    [],
    "Graph buttons and source menus must provide 44px touch targets",
  );
  await page.addScriptTag({ content: axe.source });
  const violations = await page.evaluate(async () =>
    (
      await window.axe.run(document.querySelector('[aria-label="Shader connections"]'), {
        rules: { region: { enabled: false } },
      })
    ).violations.map(({ id }) => id),
  );
  assert.deepEqual(violations, [], "Cards view must pass automated accessibility checks");

  await shader.getByRole("button", { name: "Canvas", exact: true }).tap();
  assert.equal(
    await vectorSource.inputValue(),
    "generated",
    "Changing views must preserve connections",
  );
  const coordinates = shader.locator('[data-slot="inventory-item"][data-value="coordinates"]');
  const move = shader.getByRole("button", { name: "Move Texture Coordinate", exact: true });
  start = await center(move);
  await gesture(start, { x: start.x, y: start.y + 74 });
  assert.equal(
    await coordinates.getAttribute("data-row"),
    "3",
    "Touch dragging the move grip must commit the new row",
  );
  const resize = shader.getByRole("button", { name: "Resize Texture Coordinate", exact: true });
  start = await center(resize);
  await gesture(start, { x: start.x, y: start.y + 74 });
  assert.equal(
    await coordinates.getAttribute("data-row-span"),
    "7",
    "Touch dragging the resize grip must commit the new height",
  );

  const canvas = shader.locator('[data-slot="connect"]');
  await canvas.evaluate((element) => element.scrollIntoView({ block: "end" }));
  const bounds = await canvas.boundingBox();
  assert(bounds);
  const y = Math.min(820, bounds.y + bounds.height - 20);
  await gesture({ x: 300, y }, { x: 70, y });
  await page.waitForFunction(
    () =>
      document.querySelector('[aria-label="Procedural bronze connections"]').parentElement
        .scrollLeft > 0,
  );
  assert.equal(
    await vectorSource.inputValue(),
    "generated",
    "Swiping the canvas background must pan without changing connections",
  );
  await shader.getByRole("button", { name: "Cards", exact: true }).tap();
  assert.equal(await vectorSource.inputValue(), "generated");
  assert(
    await page.evaluate(() => document.documentElement.scrollWidth <= 390),
    "The canvas must scroll locally",
  );
  assert.deepEqual(errors, [], "Touch interactions logged browser errors");
  console.log(
    "Connect touch verified: taps, finger movement, drag, cancellation, native menus, disconnect, view switching, 44px targets, card movement, resizing, panning, and automated accessibility.",
  );
} finally {
  await browser.close();
}
