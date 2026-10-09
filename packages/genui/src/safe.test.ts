import { describe, expect, it } from "vitest";
import {
  asCell,
  asNumber,
  asRecords,
  asStrings,
  asToken,
  isSafeHref,
  safeHref,
  safeImageSrc,
  uniqueBy,
} from "./safe.js";

describe("safeHref", () => {
  it.each([
    "https://example.com/a?b=c#d",
    "http://example.com",
    "HTTPS://EXAMPLE.COM",
    "mailto:ada@example.com",
    "tel:+4670000000",
    "/settings",
    "settings/profile",
    "./a",
    "../a",
    "?page=2",
    "#section",
  ])("allows %s", (url) => {
    expect(safeHref(url)).toBe(url);
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    " javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "\u0000javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "blob:https://example.com/id",
    "file:///etc/passwd",
    "ftp://example.com",
    "//evil.example/path",
    "/\\evil.example",
    "\\\\evil.example",
    "https://exa mple.com",
    "",
    "   ",
  ])("rejects %j", (url) => {
    expect(safeHref(url)).toBeUndefined();
    expect(isSafeHref(url)).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(safeHref(undefined)).toBeUndefined();
    expect(safeHref(null)).toBeUndefined();
    expect(safeHref(42)).toBeUndefined();
    expect(safeHref({ toString: () => "https://example.com" })).toBeUndefined();
  });

  it("trims surrounding whitespace", () => {
    expect(safeHref("  https://example.com  ")).toBe("https://example.com");
  });
});

describe("safeImageSrc", () => {
  it("allows http(s) and paths", () => {
    expect(safeImageSrc("https://example.com/a.png")).toBe("https://example.com/a.png");
    expect(safeImageSrc("/a.png")).toBe("/a.png");
    expect(safeImageSrc("images/a.png")).toBe("images/a.png");
  });

  it.each([
    "data:image/png;base64,AAAA",
    "data:image/svg+xml,<svg onload=alert(1)>",
    "javascript:alert(1)",
    "blob:https://example.com/id",
    "mailto:a@example.com",
    "tel:123",
    "#fragment",
    "//cdn.example.com/a.png",
  ])("rejects %s", (url) => {
    expect(safeImageSrc(url)).toBeUndefined();
  });
});

describe("value helpers", () => {
  it("narrows unknown values", () => {
    expect(asNumber(3)).toBe(3);
    expect(asNumber(Number.NaN)).toBeUndefined();
    expect(asNumber(Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(asNumber("3")).toBeUndefined();
    expect(asToken("row", ["row", "column"] as const)).toBe("row");
    expect(asToken("diagonal", ["row", "column"] as const)).toBeUndefined();
    expect(asToken(null, ["row"] as const)).toBeUndefined();
  });

  it("reads half-streamed arrays", () => {
    expect(asStrings(["a", null, 3, undefined, {}, Number.NaN])).toEqual(["a", "3"]);
    expect(asStrings("a")).toEqual([]);
    expect(asRecords([{ a: 1 }, null, [1], "x"])).toEqual([{ a: 1 }]);
    expect(asRecords(undefined)).toEqual([]);
  });

  it("keeps the first of duplicate keys", () => {
    expect(
      uniqueBy(
        [
          { k: "a", n: 1 },
          { k: "b", n: 2 },
          { k: "a", n: 3 },
        ],
        (i) => i.k,
      ),
    ).toEqual([
      { k: "a", n: 1 },
      { k: "b", n: 2 },
    ]);
  });

  it("formats table cells", () => {
    expect(asCell("x")).toBe("x");
    expect(asCell(3)).toBe("3");
    expect(asCell(true)).toBe("Yes");
    expect(asCell(false)).toBe("No");
    expect(asCell(null)).toBe("");
    expect(asCell(Number.NaN)).toBe("");
    expect(asCell({})).toBe("");
  });
});
