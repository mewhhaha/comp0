import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { componentBySlug, components } from "../../content/catalog.js";
import { ApiReference } from "./ApiReference.js";

vi.mock("./CodeBlock.js", () => ({ CodeBlock: () => null }));

describe("ApiReference", () => {
  it("renders each prop in its own table row", () => {
    const inventory = componentBySlug.get("inventory");
    if (!inventory) throw new Error("Inventory documentation is missing.");

    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(
      <ApiReference imports={inventory.imports} parts={inventory.parts} />,
    );
    const heading = [...container.querySelectorAll("h3 code")].find(
      (element) => element.textContent === "Inventory",
    );
    const rows = [...heading!.closest("section")!.querySelectorAll("tbody tr")].map((row) => {
      const cells = row.querySelectorAll("td code");
      return { name: cells[0]?.textContent, type: cells[1]?.textContent };
    });

    expect(rows).toContainEqual({ name: "columns", type: "number" });
    expect(rows).toContainEqual({ name: "rows", type: "number" });
    expect(rows).toContainEqual({ name: "value", type: "InventoryLayout" });
    expect(rows).toContainEqual({ name: "defaultValue", type: "InventoryLayout" });
    expect(rows.some((row) => row.name?.includes(" / "))).toBe(false);

    for (const component of components) {
      container.innerHTML = renderToStaticMarkup(
        <ApiReference imports={component.imports} parts={component.parts} />,
      );
      const propNames = [...container.querySelectorAll("tbody td:first-child code")].map(
        (element) => element.textContent ?? "",
      );
      expect(
        propNames.some((name) => name.includes(" / ")),
        component.slug,
      ).toBe(false);
    }
  });
});
