import type {} from "@vitest/browser-playwright";
import type { BrowserCommand } from "vitest/node";

/**
 * One step of a real mouse gesture. `move` goes to a point of the element `selector` matches in
 * the test frame: `x`/`y` are CSS pixels from its border box's top-left corner (default: its
 * center), and may lie outside the box. `moveOutsideFrame` goes to a point of the page outside
 * the test iframe.
 */
export type PointerStep =
  | { type: "move"; selector: string; x?: number; y?: number; steps?: number }
  | { type: "moveOutsideFrame" }
  | { type: "down" }
  | { type: "up" };

/**
 * Drives Playwright's mouse through `steps`, so Chromium does its own hit testing, pointer
 * capture, and click targeting. vitest/browser's userEvent only offers whole clicks and drags,
 * which cannot press, move off, and release as separate steps.
 */
export const pointerSequence: BrowserCommand<[steps: PointerStep[]]> = async (context, steps) => {
  const { page } = context;
  for (const step of steps) {
    if (step.type === "down") await page.mouse.down();
    else if (step.type === "up") await page.mouse.up();
    else if (step.type === "move") {
      const box = await context.iframe.locator(step.selector).boundingBox();
      if (!box) throw new Error(`pointerSequence: nothing visible matches ${step.selector}`);
      const x = box.x + (step.x ?? box.width / 2);
      const y = box.y + (step.y ?? box.height / 2);
      await page.mouse.move(x, y, { steps: step.steps ?? 1 });
    } else {
      const frame = await (await context.frame()).frameElement();
      const box = await frame.boundingBox();
      if (!box) throw new Error("pointerSequence: the test iframe has no box");
      await page.mouse.move(box.x + box.width + 20, box.y + box.height + 20);
    }
  }
};

declare module "vitest/browser" {
  // Declaration merging into vitest's command registry only works with an interface.
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface BrowserCommands {
    pointerSequence: (steps: PointerStep[]) => Promise<void>;
  }
}
