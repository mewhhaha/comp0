import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { componentBySlug } from "../../content/catalog.js";
import { StateHooks } from "./StateHooks.js";

describe("StateHooks", () => {
  it("renders a separate hook table for each component part", () => {
    const inventory = componentBySlug.get("inventory");
    if (!inventory) throw new Error("Inventory documentation is missing.");

    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(
      <StateHooks hooks={inventory.stateHooks} parts={inventory.parts} />,
    );

    const sections = [...container.querySelectorAll("section section")];
    expect(sections.map((section) => section.querySelector("h4")?.textContent)).toEqual([
      "Inventory",
      "InventoryItem",
      "InventoryMoveHandle",
      "InventoryResizeHandle",
    ]);
    expect(sections.every((section) => section.querySelector("table"))).toBe(true);
    expect(sections[2]?.textContent).toContain("[data-invalid-placement]");
    expect(sections[3]?.textContent).toContain("[data-invalid-placement]");
  });
});
