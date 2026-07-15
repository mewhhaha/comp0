import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { componentBySlug, components } from "../../content/catalog.js";
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
      "InventoryPreview",
      "InventoryMoveHandle",
      "InventoryResizeHandle",
    ]);
    expect(sections.every((section) => section.querySelector("table"))).toBe(true);
    expect(sections[2]?.textContent).toContain("[data-invalid-placement]");
    expect(sections[3]?.textContent).not.toContain("[data-invalid-placement]");
    expect(sections[4]?.textContent).not.toContain("[data-invalid-placement]");
    const itemHookNames = [...sections[1]!.querySelectorAll("tbody code")].map(
      (element) => element.textContent,
    );
    expect(itemHookNames).toContain("[data-column]");
    expect(itemHookNames).toContain("[data-row]");
    expect(itemHookNames).not.toContain("[data-column] / [data-row]");

    for (const component of components) {
      if (component.stateHooks.length === 0) continue;
      container.innerHTML = renderToStaticMarkup(
        <StateHooks hooks={component.stateHooks} parts={component.parts} />,
      );
      const hookNames = [...container.querySelectorAll("tbody td:first-child code")].map(
        (element) => element.textContent ?? "",
      );
      expect(
        hookNames.some((name) => name.includes(" / ")),
        component.slug,
      ).toBe(false);
    }
  });
});
