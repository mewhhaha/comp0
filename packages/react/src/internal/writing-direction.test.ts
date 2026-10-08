import { describe, expect, it } from "vitest";
import { writingDirection } from "./writing-direction.js";

describe("writingDirection", () => {
  it("defaults to ltr", () => {
    const element = document.createElement("div");
    document.body.append(element);
    expect(writingDirection(element)).toBe("ltr");
    element.remove();
  });

  it("reads the computed direction, so it is inherited from ancestors", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.style.direction = "rtl";
    parent.append(child);
    document.body.append(parent);
    expect(writingDirection(parent)).toBe("rtl");
    expect(writingDirection(child)).toBe("rtl");
    parent.remove();
  });

  it("uses the window of the element's own document", () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameDocument = frame.contentDocument!;
    const element = frameDocument.createElement("div");
    element.style.direction = "rtl";
    frameDocument.body.append(element);

    expect(writingDirection(element)).toBe("rtl");
    frame.remove();
  });

  it("falls back to ltr for an element without a window", () => {
    const detached = document.implementation.createHTMLDocument("detached").createElement("div");
    expect(writingDirection(detached)).toBe("ltr");
  });
});
