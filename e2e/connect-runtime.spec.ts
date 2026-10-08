import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { axeViolations } from "./axe.js";

test.use({ viewport: { width: 1400, height: 1000 } });

// Inside the page, a wire's endpoints must meet the output and input ports it connects.
const wiresMeetPorts = () => {
  const root = document.querySelector('[aria-label="Flower connections"]');
  const path = root?.querySelector(
    'path[data-from="rain"][data-to="flower"]',
  ) as SVGPathElement | null;
  if (!root || !path) return false;
  const matrix = path.getScreenCTM() ?? undefined;
  const start = path.getPointAtLength(0).matrixTransform(matrix);
  const end = path.getPointAtLength(path.getTotalLength()).matrixTransform(matrix);
  const output = root
    .querySelector('[data-slot="connect-output"][value="rain"]')!
    .getBoundingClientRect();
  const input = root.querySelector('[data-slot="connect-input-trigger"]')!.getBoundingClientRect();
  return (
    Math.abs(start.x - output.right) < 1 &&
    Math.abs(start.y - output.top - output.height / 2) < 1 &&
    Math.abs(end.x - input.left) < 1 &&
    Math.abs(end.y - input.top - input.height / 2) < 1 &&
    start.x < end.x
  );
};

const shaderWiresMeetPorts = () => {
  const root = document.querySelector('[aria-label="Procedural bronze connections"]');
  if (!root) return false;
  const paths = [...root.querySelectorAll<SVGPathElement>("path[data-from]")];
  return (
    paths.length === 3 &&
    paths.every((path) => {
      const output = root
        .querySelector(`button[value="${path.dataset.from}"]`)!
        .getBoundingClientRect();
      const input = root
        .querySelector(`button[data-slot="connect-input-trigger"][value="${path.dataset.to}"]`)!
        .getBoundingClientRect();
      const matrix = path.getScreenCTM() ?? undefined;
      const start = path.getPointAtLength(0).matrixTransform(matrix);
      const end = path.getPointAtLength(path.getTotalLength()).matrixTransform(matrix);
      return (
        Math.abs(start.x - output.right) < 1 &&
        Math.abs(start.y - output.top - output.height / 2) < 1 &&
        Math.abs(end.x - input.left) < 1 &&
        Math.abs(end.y - input.top - input.height / 2) < 1
      );
    })
  );
};

test("connect runtime: clicks, drag and cancel, native selectors, focus, layout controls, wire geometry, narrow layout, and shader accessibility", async ({
  page,
}) => {
  const screenshots = process.env.SCREENSHOTS_DIR;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  const response = await page.goto("/components/connect");
  expect(response?.ok(), `Connect page failed: ${response?.status()}`).toBe(true);
  await page.waitForLoadState("networkidle");

  const example = page.getByRole("region", { name: "Live example", exact: true });
  const shader = page.getByRole("region", { name: "Shader connections", exact: true });
  await expect(
    shader.locator('[data-slot="connect-card"]'),
    "Offscreen cards must remain mounted",
  ).toHaveCount(3);
  await expect(shader.getByRole("dialog")).toHaveCount(0);
  expect(
    await page
      .locator('[data-slot="connect-card"]')
      .evaluateAll((cards) => cards.some((card) => card.contains(document.activeElement))),
    "Mounting cards must not move focus",
  ).toBe(false);

  const source = example.getByRole("button", { name: "Weather: Rain output (weather)" });
  const input = example.getByRole("button", { name: "Garden: Flower input (weather)" });
  await example.getByText("Source", { exact: true }).click();
  const select = example.getByRole("combobox");

  await test.step("two clicks connect without dragging", async () => {
    await source.click();
    await input.click();
    await expect(select, "Two clicks must connect without dragging").toHaveValue("rain");
    await select.selectOption("sun");
  });

  await test.step("escape cancels a drag; dragging connects like clicking", async () => {
    await example.scrollIntoViewIfNeeded();
    const start = await source.boundingBox();
    const end = await input.boundingBox();
    expect(start && end, "Port buttons must have visible bounds").toBeTruthy();
    await page.mouse.move(start!.x + start!.width / 2, start!.y + start!.height / 2);
    await page.mouse.down();
    await page.mouse.move(end!.x + end!.width / 2, end!.y + end!.height / 2, { steps: 8 });
    await page.keyboard.press("Escape");
    await page.mouse.up();
    await expect(
      select,
      "Escape must cancel a drag even if released over a compatible input",
    ).toHaveValue("sun");
    await expect(source).toHaveAttribute("aria-pressed", "false");
    await source.dragTo(input);
    await expect(select, "Dragging must connect the same endpoints as clicking").toHaveValue(
      "rain",
    );
    await example.getByRole("button", { name: "Disconnect Garden: Flower" }).click();
    await expect(select).toHaveValue("");
    await expect(select, "Disconnect must retain focus on an enabled control").toBeFocused();
  });

  await shader.getByRole("button", { name: "Canvas", exact: true }).click();
  const vectorSource = shader.locator('select[aria-label="Noise Texture: Vector source (vector)"]');
  await shader
    .getByRole("button", { name: "Edit Noise Texture: Vector source", exact: true })
    .click();
  await vectorSource.selectOption("normal");
  await page.keyboard.press("Escape");
  await expect(vectorSource).toHaveValue("normal");
  const wire = shader.locator('path[data-to="vector"]');
  await expect(wire).toHaveAttribute("data-from", "normal");
  const originalPath = await wire.getAttribute("d");

  await test.step("layout controls apply, reject overlap, and keep focus", async () => {
    await shader.getByText("Layout", { exact: true }).click();
    await shader.getByRole("spinbutton", { name: "Texture Coordinate row", exact: true }).fill("3");
    const apply = shader.getByRole("button", { name: "Apply Texture Coordinate", exact: true });
    await apply.click();
    const coordinates = shader.locator('[data-slot="inventory-item"][data-value="coordinates"]');
    await expect(coordinates).toHaveAttribute("data-row", "3");
    await expect(apply, "Applying layout must preserve focus").toBeFocused();
    await expect(wire).not.toHaveAttribute("d", originalPath!);
    await shader
      .getByRole("spinbutton", { name: "Texture Coordinate width", exact: true })
      .fill("4");
    await apply.click();
    await expect(coordinates).toHaveAttribute("data-column-span", "4");
    await shader
      .getByRole("spinbutton", { name: "Texture Coordinate column", exact: true })
      .fill("6");
    await apply.click();
    await expect(coordinates, "Overlapping placements must be rejected").toHaveAttribute(
      "data-column",
      "1",
    );
    await expect(
      shader.getByText(
        "Texture Coordinate must fit inside the board without overlapping another card.",
        { exact: true },
      ),
    ).toBeVisible();
  });

  await test.step("the move grip follows the keyboard", async () => {
    await shader.getByRole("button", { name: "Move Noise Texture", exact: true }).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(
      shader.locator('[data-slot="inventory-item"][data-value="noise"]'),
    ).toHaveAttribute("data-row", "2");
    await expect(
      shader.getByRole("spinbutton", { name: "Noise Texture row", exact: true }),
      "Layout fields must follow grip changes",
    ).toHaveValue("2");
  });

  expect(
    await axeViolations(page, '[aria-label="Shader connections"]'),
    "Shader example has automated accessibility violations",
  ).toEqual([]);

  if (screenshots) {
    await mkdir(screenshots, { recursive: true });
    await example.screenshot({ path: `${screenshots}/connect.png` });
    await shader.screenshot({ path: `${screenshots}/shader.png` });
    await page.locator("#anatomy").screenshot({ path: `${screenshots}/anatomy.png` });
  }

  await test.step("narrow layouts keep controls, geometry, and page width", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await source.click();
    await input.click();
    await expect(select, "Narrow layouts must retain connection controls").toHaveValue("rain");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= 390),
      "The board must scroll locally instead of widening the page",
    ).toBe(true);
    await example.getByText("Source", { exact: true }).click();
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForFunction(wiresMeetPorts);
      const bounds = await example.boundingBox();
      expect(
        bounds && bounds.height <= 300,
        `The emoji example must stay compact at ${width}px`,
      ).toBe(true);
      expect(
        await page.evaluate((limit) => document.documentElement.scrollWidth <= limit, width),
        `The emoji example must fit a ${width}px phone`,
      ).toBe(true);
    }
    await shader.getByRole("button", { name: "Reset", exact: true }).click();
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const view of ["Cards", "Canvas"]) {
        await shader.getByRole("button", { name: view, exact: true }).click();
        await page.waitForFunction(shaderWiresMeetPorts);
        expect(
          await page.evaluate((limit) => document.documentElement.scrollWidth <= limit, width),
          `${view} must not widen a ${width}px phone`,
        ).toBe(true);
        if (view === "Cards") {
          const bounds = await shader.boundingBox();
          expect(
            bounds && bounds.height < 430,
            `Shader must fit a short phone viewport at ${width}px`,
          ).toBe(true);
        }
      }
    }
  });

  expect(errors, "Connect runtime logged browser errors").toEqual([]);
});
