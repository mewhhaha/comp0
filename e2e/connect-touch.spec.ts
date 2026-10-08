import { expect, test, type Locator } from "@playwright/test";
import { axeViolations } from "./axe.js";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

type Point = { x: number; y: number };

test("connect touch: taps, finger movement, drag, cancellation, native menus, disconnect, view switching, 44px targets, card movement, resizing, panning, and accessibility", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const cdp = await page.context().newCDPSession(page);

  async function gesture(
    start: Point,
    end: Point,
    finish: "touchEnd" | "touchCancel" = "touchEnd",
  ) {
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
  async function center(control: Locator): Promise<Point> {
    await control.scrollIntoViewIfNeeded();
    const bounds = await control.boundingBox();
    expect(bounds, "Touch control must have visible bounds").toBeTruthy();
    return { x: bounds!.x + bounds!.width / 2, y: bounds!.y + bounds!.height / 2 };
  }

  await page.goto("/components/connect");
  await page.waitForLoadState("networkidle");
  const example = page.getByRole("region", { name: "Live example", exact: true });
  const source = example.getByRole("button", { name: "Weather: Rain output (weather)" });
  const input = example.getByRole("button", { name: "Garden: Flower input (weather)" });
  await example.getByText("Source", { exact: true }).tap();
  const select = example.getByRole("combobox");

  await test.step("taps and drags on the emoji graph", async () => {
    await source.tap();
    await input.tap();
    await expect(select, "Separate taps must connect ports").toHaveValue("rain");
    await select.selectOption("sun");
    let start = await center(source);
    await gesture(start, { x: start.x + 5, y: start.y });
    await expect(source, "Small finger movement must remain a tap").toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await input.tap();
    await expect(select, "A tap with finger movement must still connect").toHaveValue("rain");

    await select.selectOption("sun");
    await example.scrollIntoViewIfNeeded();
    start = await center(source);
    const end = await center(input);
    await gesture(start, end);
    await expect(select, "A touch drag must connect compatible ports").toHaveValue("rain");
    await select.selectOption("sun");
    start = await center(source);
    await gesture(start, { x: start.x + 30, y: start.y }, "touchCancel");
    await expect(select, "Interrupted touch gestures must not edit connections").toHaveValue("sun");
    await expect(source, "Interrupted gestures must clear the selected output").toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await source.tap();
    await input.tap();
    await expect(select, "Taps must work after a canceled gesture").toHaveValue("rain");
  });

  const shader = page.getByRole("region", { name: "Shader connections", exact: true });
  await expect(shader.getByRole("button", { name: "Cards", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const vectorSource = shader.locator('select[aria-label="Noise Texture: Vector source (vector)"]');

  await test.step("cards connect, edit, and disconnect by touch", async () => {
    await shader.getByRole("button", { name: "Texture Coordinate: Normal output (vector)" }).tap();
    await shader.getByRole("button", { name: "Noise Texture: Vector input (vector)" }).tap();
    await expect(vectorSource, "Cards must connect across vertical scrolling").toHaveValue(
      "normal",
    );
    await shader
      .getByRole("button", { name: "Edit Noise Texture: Vector source", exact: true })
      .tap();
    await vectorSource.selectOption("uv");
    await shader.getByRole("button", { name: "Disconnect Noise Texture: Vector" }).tap();
    await expect(vectorSource, "Touch must disconnect an input").toHaveValue("");
    await vectorSource.selectOption("generated");
    await shader
      .getByRole("button", { name: "Edit Noise Texture: Vector source", exact: true })
      .tap();
  });

  const undersized = await shader.locator("button, select").evaluateAll((controls) =>
    controls
      .filter((control) => control.checkVisibility())
      .filter((control) => {
        const bounds = control.getBoundingClientRect();
        return bounds.width < 44 || bounds.height < 44;
      })
      .map((control) => control.getAttribute("aria-label") ?? control.textContent),
  );
  expect(undersized, "Graph buttons and source menus must provide 44px touch targets").toEqual([]);
  expect(
    (await axeViolations(page, '[aria-label="Shader connections"]')).map(({ id }) => id),
    "Cards view must pass automated accessibility checks",
  ).toEqual([]);

  await test.step("canvas view moves, resizes, and pans by touch", async () => {
    await shader.getByRole("button", { name: "Canvas", exact: true }).tap();
    await expect(vectorSource, "Changing views must preserve connections").toHaveValue("generated");
    const coordinates = shader.locator('[data-slot="inventory-item"][data-value="coordinates"]');
    let start = await center(
      shader.getByRole("button", { name: "Move Texture Coordinate", exact: true }),
    );
    await gesture(start, { x: start.x, y: start.y + 30 });
    await expect(
      coordinates,
      "Touch dragging the move grip must commit the new row",
    ).toHaveAttribute("data-row", "3");
    start = await center(
      shader.getByRole("button", { name: "Resize Texture Coordinate", exact: true }),
    );
    await gesture(start, { x: start.x, y: start.y + 30 });
    await expect(
      coordinates,
      "Touch dragging the resize grip must commit the new height",
    ).toHaveAttribute("data-row-span", "10");

    const canvas = shader.locator('[data-slot="connect"]');
    await canvas.evaluate((element) => element.scrollIntoView({ block: "end" }));
    const bounds = await canvas.boundingBox();
    expect(bounds).toBeTruthy();
    const y = Math.min(820, bounds!.y + bounds!.height - 20);
    await gesture({ x: 300, y }, { x: 70, y });
    await page.waitForFunction(
      () =>
        document.querySelector('[aria-label="Procedural bronze connections"]')?.parentElement
          ?.scrollLeft,
    );
    await expect(
      vectorSource,
      "Swiping the canvas background must pan without changing connections",
    ).toHaveValue("generated");
    await shader.getByRole("button", { name: "Cards", exact: true }).tap();
    await expect(vectorSource).toHaveValue("generated");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= 390),
      "The canvas must scroll locally",
    ).toBe(true);
  });

  expect(errors, "Touch interactions logged browser errors").toEqual([]);
});
