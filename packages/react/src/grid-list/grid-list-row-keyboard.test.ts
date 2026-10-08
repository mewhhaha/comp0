import { describe, expect, it } from "vitest";
import { resolveRowControlMove } from "./grid-list-row-keyboard.js";

function row() {
  document.body.innerHTML =
    '<div id="row"><button id="one"></button><button id="two"></button></div>';
  const element = (id: string) => document.getElementById(id)!;
  return {
    row: element("row"),
    one: element("one"),
    two: element("two"),
    focusables: [element("one"), element("two")],
  };
}

describe("row control keyboard", () => {
  it("steps into the first control from the row and onward between controls", () => {
    const { row: r, one, two, focusables } = row();
    expect(
      resolveRowControlMove({ key: "ArrowRight", dir: "ltr", row: r, target: r, focusables }),
    ).toEqual({
      handled: true,
      focus: one,
    });
    expect(
      resolveRowControlMove({ key: "ArrowRight", dir: "ltr", row: r, target: one, focusables }),
    ).toEqual({ handled: true, focus: two });
    expect(
      resolveRowControlMove({ key: "ArrowRight", dir: "ltr", row: r, target: two, focusables }),
    ).toEqual({ handled: false, focus: undefined });
  });

  it("steps back to the previous control, then to the row itself", () => {
    const { row: r, one, two, focusables } = row();
    expect(
      resolveRowControlMove({ key: "ArrowLeft", dir: "ltr", row: r, target: two, focusables }),
    ).toEqual({ handled: true, focus: one });
    expect(
      resolveRowControlMove({ key: "ArrowLeft", dir: "ltr", row: r, target: one, focusables }),
    ).toEqual({ handled: true, focus: r });
    expect(
      resolveRowControlMove({ key: "ArrowLeft", dir: "ltr", row: r, target: r, focusables }),
    ).toEqual({ handled: false });
  });

  it("mirrors the inline arrows in right-to-left layouts", () => {
    const { row: r, one, focusables } = row();
    expect(
      resolveRowControlMove({ key: "ArrowLeft", dir: "rtl", row: r, target: r, focusables }),
    ).toEqual({
      handled: true,
      focus: one,
    });
    expect(
      resolveRowControlMove({ key: "ArrowRight", dir: "rtl", row: r, target: one, focusables }),
    ).toEqual({ handled: true, focus: r });
  });

  it("ignores other keys", () => {
    const { row: r, focusables } = row();
    expect(
      resolveRowControlMove({ key: "ArrowDown", dir: "ltr", row: r, target: r, focusables }),
    ).toBeNull();
  });
});
