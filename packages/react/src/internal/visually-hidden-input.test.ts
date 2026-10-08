import { describe, expect, it } from "vitest";
import { visuallyHiddenInputStyle } from "./visually-hidden-input.js";

describe("visuallyHiddenInputStyle", () => {
  it("clips the input to nothing but keeps it in layout so it stays focusable", () => {
    expect(visuallyHiddenInputStyle).toMatchObject({
      clipPath: "inset(50%)",
      height: 1,
      width: 1,
      opacity: 0,
      position: "absolute",
    });
    expect(visuallyHiddenInputStyle).not.toHaveProperty("display");
    expect(visuallyHiddenInputStyle).not.toHaveProperty("visibility");
  });

  it("is applied as an inline style on a rendered input", () => {
    const input = document.createElement("input");
    Object.assign(input.style, visuallyHiddenInputStyle);
    expect(input.style.position).toBe("absolute");
    expect(input.style.clipPath).toBe("inset(50%)");
  });
});
