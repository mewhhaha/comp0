import { type ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanupRoots, setup } from "../../test/render.js";
import { useRovingControls } from "./roving-controls.js";

function Roving({
  children,
  orientation = "horizontal",
}: {
  children: ReactNode;
  orientation?: "horizontal" | "vertical";
}) {
  const { containerRef, onFocus, onKeyDown } = useRovingControls<HTMLDivElement>(orientation);
  return (
    <div
      ref={containerRef}
      role="toolbar"
      tabIndex={-1}
      aria-label="Controls"
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}

const buttons = (container: Element) => [...container.querySelectorAll("button")];

afterEach(cleanupRoots);

describe("useRovingControls", () => {
  it("keeps exactly one tab stop and moves it with focus", async () => {
    const { container, user } = setup(
      <Roving>
        <button type="button">A</button>
        <button type="button">B</button>
        <button type="button">C</button>
      </Roving>,
    );
    const [a, b, c] = buttons(container);

    expect([a!.tabIndex, b!.tabIndex, c!.tabIndex]).toEqual([0, -1, -1]);
    await user.click(c!);
    expect([a!.tabIndex, b!.tabIndex, c!.tabIndex]).toEqual([-1, -1, 0]);
  });

  it("moves with arrows, Home, and End without looping", async () => {
    const { container, user } = setup(
      <Roving>
        <button type="button">A</button>
        <button type="button">B</button>
        <button type="button">C</button>
      </Roving>,
    );
    const [a, b, c] = buttons(container);
    a!.focus();

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(b);
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(c);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(c);
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(a);
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(a);
  });

  it("answers only the arrows of its orientation", async () => {
    const { container, user } = setup(
      <Roving orientation="vertical">
        <button type="button">A</button>
        <button type="button">B</button>
      </Roving>,
    );
    const [a, b] = buttons(container);
    a!.focus();

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(a);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(b);
  });

  it("skips disabled, aria-disabled, and hidden controls", async () => {
    const { container, user } = setup(
      <Roving>
        <button type="button">A</button>
        <button type="button" disabled>
          B
        </button>
        <button type="button" aria-disabled="true">
          C
        </button>
        <div hidden>
          <button type="button">D</button>
        </div>
        <button type="button">E</button>
      </Roving>,
    );
    const all = buttons(container);
    all[0]!.focus();

    // Disabled and hidden controls are not focusable, so only the rest take part.
    expect([all[0]!.tabIndex, all[2]!.tabIndex, all[4]!.tabIndex]).toEqual([0, -1, -1]);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(all[4]);
  });

  it("leaves nested composites their own keys and tab stops", async () => {
    const { container, user } = setup(
      <Roving>
        <button type="button">A</button>
        <div role="grid" aria-label="Options">
          <button type="button" tabIndex={0}>
            Inside
          </button>
        </div>
      </Roving>,
    );
    const [, inside] = buttons(container);
    inside!.focus();

    expect(inside!.tabIndex).toBe(0);
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(inside);
  });

  it("does not use typeahead", async () => {
    const { container, user } = setup(
      <Roving>
        <button type="button">Alpha</button>
        <button type="button">Beta</button>
      </Roving>,
    );
    const [alpha] = buttons(container);
    alpha!.focus();

    await user.keyboard("b");
    expect(document.activeElement).toBe(alpha);
  });

  it("mirrors horizontal arrows in right-to-left containers", async () => {
    const { container, user } = setup(
      <Roving>
        <button type="button">A</button>
        <button type="button">B</button>
      </Roving>,
    );
    const [a, b] = buttons(container);
    a!.parentElement!.style.direction = "rtl";
    a!.focus();

    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(b);
  });
});
