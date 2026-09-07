import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import axe from "axe-core";

const base = process.env.DOCS_URL ?? "http://127.0.0.1:5173";
const screenshots = process.env.SCREENSHOTS_DIR;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const response = await page.goto(`${base}/components/connect`);
  assert(response?.ok(), `Connect page failed: ${response?.status()}`);
  await page.waitForLoadState("networkidle");
  const example = page.getByRole("region", { name: "Live example", exact: true });
  const shader = page.getByRole("region", { name: "Shader connections", exact: true });
  assert.equal(
    await shader.locator("[data-connect-card]").count(),
    3,
    "Offscreen cards must remain mounted",
  );
  assert.equal(await shader.getByRole("dialog").count(), 0);
  assert.equal(
    await page
      .locator("[data-connect-card]")
      .evaluateAll((cards) => cards.some((card) => card.contains(document.activeElement))),
    false,
    "Mounting cards must not move focus",
  );

  const source = example.getByRole("button", { name: "Weather: Rain output (weather)" });
  const input = example.getByRole("button", { name: "Garden: Flower input (weather)" });
  await example.getByText("Source", { exact: true }).click();
  const select = example.getByRole("combobox");
  await source.click();
  await input.click();
  assert.equal(await select.inputValue(), "rain", "Two clicks must connect without dragging");
  await select.selectOption("sun");

  await example.scrollIntoViewIfNeeded();
  const start = await source.boundingBox();
  const end = await input.boundingBox();
  assert(start && end, "Port buttons must have visible bounds");
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 8 });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  assert.equal(
    await select.inputValue(),
    "sun",
    "Escape must cancel a drag even if released over a compatible input",
  );
  assert.equal(await source.getAttribute("aria-pressed"), "false");
  await source.dragTo(input);
  assert.equal(
    await select.inputValue(),
    "rain",
    "Dragging must connect the same endpoints as clicking",
  );
  await example.getByRole("button", { name: "Disconnect Garden: Flower" }).click();
  assert.equal(await select.inputValue(), "");
  assert(
    await select.evaluate((control) => control === document.activeElement),
    "Disconnect must retain focus on an enabled control",
  );

  await shader.getByRole("button", { name: "Canvas", exact: true }).click();
  const vectorSource = shader.getByRole("combobox", {
    name: "Noise Texture: Vector source (vector)",
  });
  await vectorSource.selectOption("normal");
  assert.equal(await vectorSource.inputValue(), "normal");
  const wire = shader.locator('path[data-to="vector"]');
  await page.waitForFunction(
    () => document.querySelector('path[data-to="vector"]')?.getAttribute("data-from") === "normal",
  );
  const originalPath = await wire.getAttribute("d");

  await shader.getByText("Position and size without dragging", { exact: true }).click();
  await shader.getByRole("spinbutton", { name: "Texture Coordinate row", exact: true }).fill("3");
  const apply = shader.getByRole("button", { name: "Apply Texture Coordinate", exact: true });
  await apply.click();
  const coordinates = shader.locator('[data-slot="inventory-item"][data-value="coordinates"]');
  assert.equal(await coordinates.getAttribute("data-row"), "3");
  assert(
    await apply.evaluate((button) => button === document.activeElement),
    "Applying layout must preserve focus",
  );
  await page.waitForFunction(
    (previous) => document.querySelector('path[data-to="vector"]')?.getAttribute("d") !== previous,
    originalPath,
  );
  await shader.getByRole("spinbutton", { name: "Texture Coordinate width", exact: true }).fill("4");
  await apply.click();
  assert.equal(await coordinates.getAttribute("data-column-span"), "4");
  await shader
    .getByRole("spinbutton", { name: "Texture Coordinate column", exact: true })
    .fill("6");
  await apply.click();
  assert.equal(
    await coordinates.getAttribute("data-column"),
    "1",
    "Overlapping placements must be rejected",
  );
  assert(
    await shader
      .getByText("Texture Coordinate must fit inside the board without overlapping another card.", {
        exact: true,
      })
      .isVisible(),
  );

  const move = shader.getByRole("button", { name: "Move Noise Texture", exact: true });
  await move.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  assert.equal(
    await shader
      .locator('[data-slot="inventory-item"][data-value="noise"]')
      .getAttribute("data-row"),
    "2",
  );
  assert.equal(
    await shader.getByRole("spinbutton", { name: "Noise Texture row", exact: true }).inputValue(),
    "2",
    "Layout fields must follow grip changes",
  );

  await page.addScriptTag({ content: axe.source });
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(
      document.querySelector('[aria-label="Shader connections"]'),
      { rules: { region: { enabled: false } } },
    );
    return result.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map(({ target }) => target),
    }));
  });
  assert.deepEqual(violations, [], "Shader example has automated accessibility violations");

  if (screenshots) {
    await mkdir(screenshots, { recursive: true });
    await example.screenshot({ path: `${screenshots}/connect.png` });
    await shader.screenshot({ path: `${screenshots}/shader.png` });
    await page.locator("#anatomy").screenshot({ path: `${screenshots}/anatomy.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await source.click();
  await input.click();
  assert.equal(await select.inputValue(), "rain", "Narrow layouts must retain connection controls");
  assert(
    await page.evaluate(() => document.documentElement.scrollWidth <= 390),
    "The board must scroll locally instead of widening the page",
  );
  await example.getByText("Source", { exact: true }).click();
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForFunction(() => {
      const root = document.querySelector('[aria-label="Flower connections"]');
      const path = root.querySelector('path[data-from="rain"][data-to="flower"]');
      if (!path) return false;
      const matrix = path.getScreenCTM();
      const start = path.getPointAtLength(0).matrixTransform(matrix);
      const end = path.getPointAtLength(path.getTotalLength()).matrixTransform(matrix);
      const output = root
        .querySelector('[data-slot="connect-output"][value="rain"]')
        .getBoundingClientRect();
      const input = root.querySelector("[data-connect-input-trigger]").getBoundingClientRect();
      return (
        Math.abs(start.x - output.right) < 1 &&
        Math.abs(start.y - output.top - output.height / 2) < 1 &&
        Math.abs(end.x - input.left) < 1 &&
        Math.abs(end.y - input.top - input.height / 2) < 1 &&
        start.x < end.x
      );
    });
    const bounds = await example.boundingBox();
    assert(bounds && bounds.height <= 300, `The emoji example must stay compact at ${width}px`);
    assert(
      await page.evaluate((width) => document.documentElement.scrollWidth <= width, width),
      `The emoji example must fit a ${width}px phone`,
    );
  }
  assert.deepEqual(errors, [], "Connect runtime logged browser errors");
  console.log(
    `Connect verified at ${base}: clicks, drag/cancel, native selectors, focus, layout controls, wire geometry, narrow layout, and shader accessibility.`,
  );
} finally {
  await browser.close();
}
