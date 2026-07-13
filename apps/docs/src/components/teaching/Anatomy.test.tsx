import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { componentBySlug } from "../../content/catalog.js";
import { Anatomy } from "./Anatomy.js";

describe("Anatomy", () => {
  it("nests GridList row controls inside GridListItem", () => {
    const gridList = componentBySlug.get("grid-list");
    if (!gridList) throw new Error("Grid List documentation is missing.");

    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(<Anatomy parts={gridList.parts} />);

    const partName = (name: string) =>
      [...container.querySelectorAll("span")].find(
        (element) => element.classList.contains("font-mono") && element.textContent === name,
      );
    const partPin = (name: string) => {
      const number = gridList.parts.findIndex((part) => part.name === name) + 1;
      return [...container.querySelectorAll("[aria-hidden=true] span")].find(
        (element) =>
          element.classList.contains("font-mono") && element.textContent === String(number),
      );
    };
    const gridListItem = partName("GridListItem");
    const dragHandlePin = partPin("GridListDragHandle");
    const moveButtonPin = partPin("GridListMoveButton");

    expect(gridListItem).toBeDefined();
    expect(dragHandlePin).toBeDefined();
    expect(moveButtonPin).toBeDefined();
    expect(gridListItem!.parentElement?.contains(dragHandlePin!)).toBe(true);
    expect(gridListItem!.parentElement?.contains(moveButtonPin!)).toBe(true);
  });
});
