import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axeRules } from "../../react/test/axe.js";
import { answers, hostile } from "../test/answers/index.js";
import { renderResponse } from "../test/render.js";
import { expectSafeDom } from "../test/safe-dom.js";
import { catalog } from "./catalog/catalog.js";
import { parsePartialJson } from "./json/parse.js";
import { GenUI } from "./render/GenUI.js";
import { validateResponse } from "./validate/validate.js";

/**
 * Generated-UI conformance. Every answer is rendered whole and at every cut of its text, the way
 * a response arrives while it streams. Cut every STEP characters (a prime, so cuts land inside
 * names, strings, and numbers); `CONFORMANCE_STEP=1` cuts at every character.
 */
const step = Math.max(1, Number(process.env.CONFORMANCE_STEP ?? 11));

let consoleError: ReturnType<typeof vi.spyOn>;
let consoleWarn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  consoleWarn.mockRestore();
});

function summarize(violations: axe.Result[]) {
  return violations.flatMap((violation) =>
    violation.nodes.map((node) => `${violation.id}: ${node.html.slice(0, 160)}`),
  );
}

function reported() {
  return [...consoleError.mock.calls, ...consoleWarn.mock.calls].map((call) =>
    call.map(String).join(" ").slice(0, 300),
  );
}

/** Cut points: every `step` characters plus the end of every line. */
function cuts(source: string): number[] {
  const points = new Set<number>();
  for (let index = step; index < source.length; index += step) points.add(index);
  for (let index = source.indexOf("\n"); index !== -1; index = source.indexOf("\n", index + 1)) {
    points.add(index + 1);
  }
  points.add(source.length);
  return [...points].sort((a, b) => a - b);
}

/** Whether every component the root holds so far is finished, and the next has not started. */
function atBoundary(prefix: string): boolean {
  const { open, value } = parsePartialJson(prefix);
  if (typeof value !== "object" || value === null) return false;
  return [...open].every((path) => path === "" || path === "/children");
}

function typeNames(value: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((item) => typeNames(item, found));
  else if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    if (typeof record.type === "string") found.add(record.type);
    Object.values(record).forEach((item) => typeNames(item, found));
  }
  return found;
}

describe("the answers", () => {
  it("use every component of the catalog between them", () => {
    const used = new Set(answers.flatMap((answer) => [...typeNames(answer.value)]));

    expect(catalog.map((entry) => entry.name).filter((name) => !used.has(name))).toEqual([]);
  });

  it.each(answers.map((answer) => [answer.name, answer.source] as const))(
    "%s parses and validates without problems",
    (_name, source) => {
      const parsed = parsePartialJson(source, { final: true });

      expect(parsed.issues).toEqual([]);
      expect(parsed.complete).toBe(true);
      expect(validateResponse(source).errors).toEqual([]);
    },
  );
});

describe.each([...answers, hostile].map((answer) => [answer.name, answer.source] as const))(
  "%s",
  (_name, source) => {
    it("renders completely, safely, and accessibly", async () => {
      const { container } = renderResponse(source);

      expectSafeDom(container);
      expect(container.querySelector("[aria-busy]")).toBeNull();
      expect(container.textContent).not.toMatch(/\[object Object\]|undefined/);
      const result = await axe.run(container, { rules: axeRules });
      expect(summarize(result.violations)).toEqual([]);
      expect(reported()).toEqual([]);
    }, 60_000);

    it("streams: renders every cut without errors and keeps what it has rendered", () => {
      const { container, rerender } = renderResponse("", { streaming: true });
      let previous: Element[] = [];

      for (const end of cuts(source)) {
        const prefix = source.slice(0, end);
        rerender(<GenUI response={prefix} streaming />);
        expectSafeDom(container);
        // An element drawn for a finished component is never replaced as the response grows.
        for (const element of previous) {
          expect(element.isConnected, `${element.getAttribute("data-slot")} at ${end}`).toBe(true);
        }
        if (atBoundary(prefix)) previous = [...container.querySelectorAll("[data-slot]")];
      }
      rerender(<GenUI response={source} streaming={false} />);

      expect(container.querySelector("[aria-busy]")).toBeNull();
      expectSafeDom(container);
      for (const element of previous) {
        expect(element.isConnected, element.getAttribute("data-slot") ?? "").toBe(true);
      }
      expect(reported()).toEqual([]);
    }, 240_000);

    it("renders a response that stops anywhere", () => {
      for (const end of cuts(source)) {
        const { container, unmount } = renderResponse(source.slice(0, end), { streaming: true });
        expect(container.querySelector("[aria-busy]")).not.toBeNull();
        unmount();
      }

      expect(reported()).toEqual([]);
    }, 240_000);

    it("reports no problem for any prefix while it streams", () => {
      for (const end of cuts(source)) {
        expect(validateResponse(source.slice(0, end), { complete: false }).errors).toEqual([]);
      }
    });
  },
);

describe("hostile output", () => {
  it("renders nothing for components the catalog does not have", () => {
    const { container } = renderResponse(hostile.source);

    for (const name of ["Carousel", "Script", "Iframe"]) {
      expect(container.textContent).not.toContain(name);
    }
    expect(container.textContent).toContain("Here is what I found.");
    expect(container.textContent).not.toContain("nested under text");
    // Links that survive are the safe ones.
    expect([...container.querySelectorAll("a")].map((link) => link.getAttribute("href"))).toEqual([
      "https://example.com",
    ]);
    expect(
      [...container.querySelectorAll("img")].map((image) => image.getAttribute("src")),
    ).toEqual(["/ok.png"]);
  });

  it("shows markup as literal text", () => {
    const { container } = renderResponse(hostile.source);

    expect(container.textContent).toContain("<img src=x onerror=alert(1)>");
    expect(container.textContent).toContain("<script>alert(1)</script>");
    expect(container.querySelector("img[onerror], script")).toBeNull();
  });

  it("reports what is wrong, for the model to fix", () => {
    // A response lists at most 50 problems, so each part of the answer is checked on its own.
    const parts = (hostile.value as { children: unknown[] }).children;
    const codes = new Set(
      parts.flatMap((part) => validateResponse(part).errors.map((error) => error.code)),
    );
    for (const part of (parts[5] as { children: unknown[] }).children) {
      for (const error of validateResponse(part).errors) codes.add(error.code);
    }

    for (const code of [
      "unknown-type",
      "invalid-prop",
      "missing-prop",
      "unknown-prop",
      "unsafe-url",
      "expression",
      "binding",
      "not-a-component",
      "missing-type",
    ]) {
      expect(codes.has(code as never), code).toBe(true);
    }
  });
});
