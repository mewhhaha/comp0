import { describe, expect, it, vi } from "vitest";
import { render } from "../../test/render.js";
import { Inventory, type InventoryLayout } from "./Inventory.js";
import { InventoryItem } from "./InventoryItem.js";

function spyOnWarnings() {
  return vi.spyOn(console, "error").mockImplementation(() => undefined);
}

describe("inventory layout data validation", () => {
  it("skips invalid, duplicate, and overlapping entries and warns once", () => {
    const warnings = spyOnWarnings();
    const layout: InventoryLayout = [
      { value: "bad", column: 0, row: 1, columnSpan: 1, rowSpan: 1 },
      { value: "same", column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
      { value: "same", column: 2, row: 1, columnSpan: 1, rowSpan: 1 },
      { value: "first", column: 1, row: 2, columnSpan: 2, rowSpan: 1 },
      { value: "second", column: 2, row: 2, columnSpan: 1, rowSpan: 1 },
    ];

    const { container } = render(
      <Inventory columns={3} rows={3} defaultValue={layout} aria-label="Validated entries">
        <InventoryItem value="bad">Bad</InventoryItem>
        <InventoryItem value="same">Same</InventoryItem>
        <InventoryItem value="first">First</InventoryItem>
        <InventoryItem value="second">Second</InventoryItem>
      </Inventory>,
    );

    const rendered = [...container.querySelectorAll<HTMLElement>("li[data-value]")].map(
      (item) => item.dataset.value,
    );
    expect(rendered).toEqual(["same", "first"]);
    const messages = warnings.mock.calls.map((call) => String(call[0]));
    expect(messages.some((message) => message.includes('"bad" has column 0'))).toBe(true);
    expect(messages.some((message) => message.includes('"same" appears more than once'))).toBe(
      true,
    );
    expect(messages.some((message) => message.includes('"first" and "second" overlap'))).toBe(true);
    warnings.mockRestore();
  });

  it("renders no item for a value that is missing from the layout", () => {
    const warnings = spyOnWarnings();
    const { container } = render(
      <Inventory columns={3} rows={3} defaultValue={[]} aria-label="Missing entry">
        <InventoryItem value="missing">Missing</InventoryItem>
      </Inventory>,
    );

    expect(container.querySelector("li")).toBeNull();
    expect(warnings.mock.calls.map((call) => String(call[0]))).toContainEqual(
      expect.stringContaining('InventoryItem value "missing" is missing from Inventory layout'),
    );
    warnings.mockRestore();
  });

  it("clamps a malformed grid size instead of throwing", () => {
    const warnings = spyOnWarnings();
    const { container } = render(
      <Inventory columns={0} rows={2} defaultValue={[]} aria-label="Clamped size" />,
    );

    expect(container.querySelector("ol")?.style.gridTemplateColumns).toContain("repeat(1");
    expect(warnings.mock.calls.map((call) => String(call[0]))).toContainEqual(
      expect.stringContaining("Inventory columns must be a positive integer; received 0"),
    );
    warnings.mockRestore();
  });
});
