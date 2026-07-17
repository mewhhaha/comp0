import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireKeyDown, render } from "../test/render.js";
import { Inventory, type InventoryLayout } from "./components/Inventory.js";
import { InventoryItem } from "./components/InventoryItem.js";
import { InventoryMoveHandle } from "./components/InventoryMoveHandle.js";
import { InventoryPreview } from "./components/InventoryPreview.js";
import { InventoryResizeHandle } from "./components/InventoryResizeHandle.js";

const initialLayout: InventoryLayout = [
  { value: "revenue", column: 1, row: 1, columnSpan: 3, rowSpan: 2 },
  { value: "conversion", column: 4, row: 1, columnSpan: 3, rowSpan: 1 },
  { value: "alerts", column: 6, row: 2, columnSpan: 1, rowSpan: 2 },
];

function renderInventory(onChange = vi.fn()) {
  const result = render(
    <Inventory
      aria-label="Store overview"
      columns={6}
      rows={6}
      defaultValue={initialLayout}
      onChange={onChange}
      style={{ width: 600, height: 480, gap: 8 }}
    >
      <InventoryItem value="revenue" textValue="Revenue">
        Revenue
        <InventoryMoveHandle />
        <InventoryResizeHandle />
      </InventoryItem>
      <InventoryItem value="conversion" textValue="Conversion">
        Conversion
        <InventoryMoveHandle />
      </InventoryItem>
      <InventoryItem value="alerts" textValue="Alerts">
        Alerts
        <InventoryResizeHandle />
      </InventoryItem>
      <InventoryPreview />
    </Inventory>,
  );
  return { ...result, onChange };
}

function thrownEvidence(callback: () => void) {
  try {
    callback();
  } catch (error) {
    if (error instanceof AggregateError) return error.errors.map(String).join("\n");
    return String(error);
  }
  return "";
}

function mockPointerGeometry(
  inventory: HTMLOListElement,
  control: HTMLButtonElement,
  size: { width: number; height: number },
) {
  Object.defineProperties(inventory, {
    clientWidth: { value: size.width },
    clientHeight: { value: size.height },
  });
  control.setPointerCapture = vi.fn();
  control.hasPointerCapture = vi.fn(() => false);
}

describe("inventory composition", () => {
  it("renders a semantic list with grid placement and named controls", () => {
    const { container } = renderInventory();
    const inventory = container.querySelector<HTMLOListElement>("ol")!;
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const move = revenue.querySelector<HTMLButtonElement>("[data-slot='inventory-move-handle']")!;
    const resize = revenue.querySelector<HTMLButtonElement>(
      "[data-slot='inventory-resize-handle']",
    )!;

    expect(inventory.getAttribute("aria-label")).toBe("Store overview");
    expect(inventory.style.gridTemplateColumns).toContain("repeat(6");
    expect(inventory.style.gridTemplateRows).toContain("repeat(6");
    expect(revenue.dataset.column).toBe("1");
    expect(revenue.dataset.columnSpan).toBe("3");
    expect(revenue.style.gridColumn).toBe("1 / span 3");
    expect(move.getAttribute("aria-label")).toBe("Move Revenue");
    expect(move.getAttribute("aria-keyshortcuts")).toContain("Enter");
    expect(resize.getAttribute("aria-label")).toBe("Resize Revenue");
    expect(container.querySelector("[data-slot='inventory-preview']")).toBeNull();
    const items = container.querySelectorAll<HTMLElement>("li[data-value]");
    expect(items[0]!.tabIndex).toBe(0);
    expect([...items].slice(1).every((item) => item.tabIndex === -1)).toBe(true);
    expect(
      [...container.querySelectorAll("button")].every((button) => button.tabIndex === -1),
    ).toBe(true);
  });

  it("moves item focus to the closest card in each visual direction", () => {
    const { container } = render(
      <Inventory
        columns={5}
        rows={5}
        defaultValue={[
          { value: "center", column: 3, row: 3, columnSpan: 1, rowSpan: 1 },
          { value: "up", column: 3, row: 1, columnSpan: 1, rowSpan: 1 },
          { value: "right", column: 5, row: 3, columnSpan: 1, rowSpan: 1 },
          { value: "down", column: 3, row: 5, columnSpan: 1, rowSpan: 1 },
          { value: "left", column: 1, row: 3, columnSpan: 1, rowSpan: 1 },
        ]}
      >
        <InventoryItem value="center">Center</InventoryItem>
        <InventoryItem value="up">Up</InventoryItem>
        <InventoryItem value="right">Right</InventoryItem>
        <InventoryItem value="down">Down</InventoryItem>
        <InventoryItem value="left">Left</InventoryItem>
      </Inventory>,
    );
    const item = (value: string) =>
      container.querySelector<HTMLElement>(`li[data-value='${value}']`)!;

    for (const [key, value] of [
      ["ArrowUp", "up"],
      ["ArrowRight", "right"],
      ["ArrowDown", "down"],
      ["ArrowLeft", "left"],
    ] as const) {
      act(() => item("center").focus());
      fireKeyDown(item("center"), key);
      expect(document.activeElement).toBe(item(value));
      expect(item(value).tabIndex).toBe(0);
      expect(item("center").tabIndex).toBe(-1);
    }
  });

  it("prefers the card most aligned with the movement direction", () => {
    const { container } = renderInventory();
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const conversion = container.querySelector<HTMLElement>('[data-value="conversion"]')!;

    act(() => revenue.focus());
    fireKeyDown(revenue, "ArrowRight");

    expect(document.activeElement).toBe(conversion);
  });

  it("tabs through the focused card controls before leaving the inventory", () => {
    const { container } = renderInventory();
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const [move, resize] = revenue.querySelectorAll<HTMLButtonElement>("button");

    act(() => revenue.focus());
    fireKeyDown(revenue, "Tab");
    expect(document.activeElement).toBe(move);
    fireKeyDown(move!, "Tab");
    expect(document.activeElement).toBe(resize);

    const leaving = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    act(() => resize!.dispatchEvent(leaving));
    expect(leaving.defaultPrevented).toBe(false);

    fireKeyDown(resize!, "Tab", { shiftKey: true });
    expect(document.activeElement).toBe(move);
    fireKeyDown(move!, "Tab", { shiftKey: true });
    expect(document.activeElement).toBe(revenue);
  });

  it("makes the focused card the inventory tab stop", () => {
    const { container } = renderInventory();
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const alerts = container.querySelector<HTMLElement>('[data-value="alerts"]')!;

    act(() => alerts.focus());

    expect(alerts.tabIndex).toBe(0);
    expect(revenue.tabIndex).toBe(-1);
  });

  it("moves by grid units after activation and pushes obstructing items forward", () => {
    const { container, onChange } = renderInventory();
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const conversion = container.querySelector<HTMLElement>('[data-value="conversion"]')!;
    const move = revenue.querySelector("[data-slot='inventory-move-handle']")!;

    fireKeyDown(move, "ArrowRight");
    expect(revenue.dataset.column).toBe("1");

    fireKeyDown(move, "Enter");
    fireKeyDown(move, "ArrowRight");

    expect(revenue.dataset.column).toBe("2");
    expect(conversion.dataset.column).toBe("1");
    expect(conversion.dataset.row).toBe("3");
    expect(onChange).toHaveBeenCalledOnce();
    expect(container.querySelector("output")?.textContent).toContain(
      "Revenue moved to column 2, row 1",
    );
  });

  it("keeps keyboard movement active until the handle is pressed again", () => {
    const { container } = renderInventory();
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const move = revenue.querySelector<HTMLButtonElement>("[data-slot='inventory-move-handle']")!;

    fireKeyDown(move, " ");

    expect(revenue.hasAttribute("data-dragging")).toBe(true);
    expect(
      container.querySelector<HTMLElement>("[data-slot='inventory-preview']")?.dataset.column,
    ).toBe("1");
    expect(container.querySelector("output")?.textContent).toContain(
      "Moving Revenue. Use the arrow keys",
    );

    fireKeyDown(move, "ArrowRight");
    expect(revenue.dataset.column).toBe("2");

    fireKeyDown(move, "Enter");

    expect(revenue.hasAttribute("data-dragging")).toBe(false);
    expect(container.querySelector("[data-slot='inventory-preview']")).toBeNull();
    expect(container.querySelector("output")?.textContent).toContain(
      "Revenue moved to column 2, row 1",
    );
  });

  it("restores the starting layout when Escape cancels keyboard movement", () => {
    const { container, onChange } = renderInventory();
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const conversion = container.querySelector<HTMLElement>('[data-value="conversion"]')!;
    const move = revenue.querySelector<HTMLButtonElement>("[data-slot='inventory-move-handle']")!;

    fireKeyDown(move, "Enter");
    fireKeyDown(move, "ArrowRight");
    fireKeyDown(move, "Escape");

    expect(revenue.dataset.column).toBe("1");
    expect(conversion.dataset.column).toBe("4");
    expect(conversion.dataset.row).toBe("1");
    expect(revenue.hasAttribute("data-dragging")).toBe(false);
    expect(container.querySelector("[data-slot='inventory-preview']")).toBeNull();
    expect(container.querySelector("output")?.textContent).toContain("Revenue change cancelled");
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("restores the starting layout when focus leaves an active handle", () => {
    const { container, onChange } = renderInventory();
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const [move, resize] = revenue.querySelectorAll<HTMLButtonElement>("button");

    act(() => move!.focus());
    fireKeyDown(move!, "Enter");
    fireKeyDown(move!, "ArrowRight");
    fireKeyDown(move!, "Tab");

    expect(document.activeElement).toBe(resize);
    expect(revenue.dataset.column).toBe("1");
    expect(revenue.hasAttribute("data-dragging")).toBe(false);
    expect(container.querySelector("[data-slot='inventory-preview']")).toBeNull();
    expect(container.querySelector("output")?.textContent).toContain("Revenue change cancelled");
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("resizes in row and column spans without marking a grid edge invalid", () => {
    const { container } = renderInventory();
    const alerts = container.querySelector<HTMLElement>('[data-value="alerts"]')!;
    const resize = alerts.querySelector("[data-slot='inventory-resize-handle']")!;

    fireKeyDown(resize, "Enter");
    fireKeyDown(resize, "ArrowDown");
    expect(alerts.dataset.rowSpan).toBe("3");

    fireKeyDown(resize, "ArrowRight");
    expect(alerts.dataset.columnSpan).toBe("1");
    expect(alerts.hasAttribute("data-invalid-placement")).toBe(false);
    expect(resize.hasAttribute("data-invalid-placement")).toBe(false);
  });

  it("reports controlled changes without moving until its owner responds", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Inventory columns={6} rows={6} value={initialLayout} onChange={onChange}>
        <InventoryItem value="revenue" textValue="Revenue">
          <InventoryMoveHandle />
        </InventoryItem>
        <InventoryItem value="conversion">Conversion</InventoryItem>
        <InventoryItem value="alerts">Alerts</InventoryItem>
      </Inventory>,
    );
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;

    const move = revenue.querySelector("button")!;
    fireKeyDown(move, "Enter");
    fireKeyDown(move, "ArrowRight");

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0]?.[0][0]).toMatchObject({ value: "revenue", column: 2 });
    expect(revenue.dataset.column).toBe("1");
  });

  it("moves with captured pointer geometry and restores a cancelled layout", () => {
    const { container, onChange } = renderInventory();
    const inventory = container.querySelector<HTMLOListElement>("ol")!;
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const move = revenue.querySelector<HTMLButtonElement>("[data-slot='inventory-move-handle']")!;
    mockPointerGeometry(inventory, move, { width: 600, height: 480 });

    act(() => {
      move.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }),
      );
      move.dispatchEvent(
        new MouseEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          clientX: 110,
          clientY: 0,
        }),
      );
    });
    expect(revenue.dataset.column).toBe("2");
    expect(revenue.hasAttribute("data-dragging")).toBe(true);
    expect(
      container.querySelector<HTMLElement>("[data-slot='inventory-preview']")?.dataset.column,
    ).toBe("2");

    act(() => {
      move.dispatchEvent(new MouseEvent("pointercancel", { bubbles: true, cancelable: true }));
    });
    expect(revenue.dataset.column).toBe("1");
    expect(revenue.hasAttribute("data-dragging")).toBe(false);
    expect(container.querySelector("[data-slot='inventory-preview']")).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("restores the starting layout when the pointer returns to its starting cell", () => {
    const { container, onChange } = renderInventory();
    const inventory = container.querySelector<HTMLOListElement>("ol")!;
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const conversion = container.querySelector<HTMLElement>('[data-value="conversion"]')!;
    const move = revenue.querySelector<HTMLButtonElement>("[data-slot='inventory-move-handle']")!;
    mockPointerGeometry(inventory, move, { width: 600, height: 480 });

    act(() => {
      move.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }),
      );
      move.dispatchEvent(
        new MouseEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          clientX: 110,
          clientY: 0,
        }),
      );
      move.dispatchEvent(
        new MouseEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          clientX: 0,
          clientY: 0,
        }),
      );
    });

    expect(revenue.dataset.column).toBe("1");
    expect(conversion.dataset.column).toBe("4");
    expect(conversion.dataset.row).toBe("1");
    expect(
      container.querySelector<HTMLElement>("[data-slot='inventory-preview']")?.dataset.column,
    ).toBe("1");
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("clamps pointer movement to the nearest grid edge", () => {
    const { container } = render(
      <Inventory
        columns={3}
        rows={3}
        defaultValue={[{ value: "card", column: 2, row: 2, columnSpan: 1, rowSpan: 1 }]}
      >
        <InventoryItem value="card" textValue="Card">
          <InventoryMoveHandle />
        </InventoryItem>
        <InventoryPreview />
      </Inventory>,
    );
    const inventory = container.querySelector<HTMLOListElement>("ol")!;
    const card = container.querySelector<HTMLElement>('[data-value="card"]')!;
    const move = card.querySelector<HTMLButtonElement>("button")!;
    mockPointerGeometry(inventory, move, { width: 300, height: 300 });

    act(() => {
      move.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }),
      );
      move.dispatchEvent(
        new MouseEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          clientX: 1000,
          clientY: -1000,
        }),
      );
    });

    expect(card.dataset.column).toBe("3");
    expect(card.dataset.row).toBe("1");
    const preview = container.querySelector<HTMLElement>("[data-slot='inventory-preview']")!;
    expect(preview.dataset.column).toBe("3");
    expect(preview.dataset.row).toBe("1");
    expect(preview.hasAttribute("data-invalid-placement")).toBe(false);
  });

  it("clamps pointer resizing to the available grid tracks", () => {
    const { container } = render(
      <Inventory
        columns={3}
        rows={3}
        defaultValue={[{ value: "card", column: 1, row: 1, columnSpan: 1, rowSpan: 1 }]}
      >
        <InventoryItem value="card" textValue="Card">
          <InventoryResizeHandle />
        </InventoryItem>
        <InventoryPreview />
      </Inventory>,
    );
    const inventory = container.querySelector<HTMLOListElement>("ol")!;
    const card = container.querySelector<HTMLElement>('[data-value="card"]')!;
    const resize = card.querySelector<HTMLButtonElement>("button")!;
    mockPointerGeometry(inventory, resize, { width: 300, height: 300 });

    act(() => {
      resize.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }),
      );
      resize.dispatchEvent(
        new MouseEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          clientX: 1000,
          clientY: 1000,
        }),
      );
    });

    expect(card.dataset.columnSpan).toBe("3");
    expect(card.dataset.rowSpan).toBe("3");
    const preview = container.querySelector<HTMLElement>("[data-slot='inventory-preview']")!;
    expect(preview.dataset.columnSpan).toBe("3");
    expect(preview.dataset.rowSpan).toBe("3");
    expect(preview.hasAttribute("data-invalid-placement")).toBe(false);
  });

  it("keeps the prior layout when displaced items cannot move forward", () => {
    const { container } = render(
      <Inventory
        columns={2}
        rows={1}
        defaultValue={[
          { value: "first", column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
          { value: "second", column: 2, row: 1, columnSpan: 1, rowSpan: 1 },
        ]}
      >
        <InventoryItem value="first" textValue="First">
          <InventoryMoveHandle />
        </InventoryItem>
        <InventoryItem value="second">Second</InventoryItem>
      </Inventory>,
    );
    const first = container.querySelector<HTMLElement>('[data-value="first"]')!;
    const second = container.querySelector<HTMLElement>('[data-value="second"]')!;

    const move = first.querySelector("button")!;
    fireKeyDown(move, "Enter");
    fireKeyDown(move, "ArrowRight");

    expect(first.dataset.column).toBe("1");
    expect(second.dataset.column).toBe("2");
    expect(first.hasAttribute("data-invalid-placement")).toBe(false);
    expect(container.querySelector("output")?.textContent).toContain("First cannot fit there");
  });

  it("marks only the preview invalid when displaced items cannot fit anywhere", () => {
    const { container } = render(
      <Inventory
        columns={2}
        rows={1}
        defaultValue={[
          { value: "first", column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
          { value: "second", column: 2, row: 1, columnSpan: 1, rowSpan: 1 },
        ]}
      >
        <InventoryItem value="first" textValue="First">
          <InventoryResizeHandle />
        </InventoryItem>
        <InventoryItem value="second">Second</InventoryItem>
        <InventoryPreview />
      </Inventory>,
    );
    const inventory = container.querySelector<HTMLOListElement>("ol")!;
    const first = container.querySelector<HTMLElement>('[data-value="first"]')!;
    const resize = first.querySelector<HTMLButtonElement>("button")!;
    mockPointerGeometry(inventory, resize, { width: 200, height: 100 });

    act(() => {
      resize.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }),
      );
      resize.dispatchEvent(
        new MouseEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 0,
        }),
      );
    });

    expect(first.dataset.columnSpan).toBe("1");
    expect(first.hasAttribute("data-invalid-placement")).toBe(false);
    const preview = container.querySelector<HTMLElement>("[data-slot='inventory-preview']")!;
    expect(preview.dataset.columnSpan).toBe("2");
    expect(preview.hasAttribute("data-invalid-placement")).toBe(true);
    expect(container.querySelector("output")?.textContent).toBe("");

    act(() => {
      resize.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true }));
    });

    expect(container.querySelector("output")?.textContent).toContain("First cannot fit there");
  });

  it("rejects malformed, duplicate, overlapping, and missing layout entries with evidence", () => {
    const invalidLayouts: Array<[InventoryLayout, string]> = [
      [[{ value: "bad", column: 0, row: 1, columnSpan: 1, rowSpan: 1 }], "column 0"],
      [
        [
          { value: "same", column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
          { value: "same", column: 2, row: 1, columnSpan: 1, rowSpan: 1 },
        ],
        'value "same" appears more than once',
      ],
      [
        [
          { value: "first", column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
          { value: "second", column: 2, row: 1, columnSpan: 1, rowSpan: 1 },
        ],
        'values "first" and "second" overlap',
      ],
    ];

    for (const [layout, evidence] of invalidLayouts) {
      expect(
        thrownEvidence(() =>
          render(<Inventory columns={3} rows={3} defaultValue={layout} aria-label="Invalid" />),
        ),
      ).toContain(evidence);
    }

    expect(
      thrownEvidence(() =>
        render(
          <Inventory columns={3} rows={3} defaultValue={[]} aria-label="Missing">
            <InventoryItem value="missing">Missing</InventoryItem>
          </Inventory>,
        ),
      ),
    ).toContain('InventoryItem value "missing" is missing from Inventory layout');
  });
});
