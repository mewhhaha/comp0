import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { createGenUIStore } from "./state/store.js";
import { type ToolCaller } from "./tools/tools.js";
import { renderStack } from "../test/render.js";

const forecastFor = (city: string) =>
  [1, 2, 3].map((day) => ({ x: day, y: city.length * 10 + day }));

function caller(): ToolCaller & ReturnType<typeof vi.fn> {
  return vi.fn(async (_name: string, args: unknown) => ({
    ok: true as const,
    value: forecastFor((args as { city: string }).city),
  }));
}

describe("Query", () => {
  it("calls its tool once the response is finished and stores the result for bound data", async () => {
    vi.useFakeTimers();
    try {
      const call = caller();
      const store = createGenUIStore({ city: "Oslo" });
      renderStack(
        [
          { type: "Query", tool: "forecast", args: { city: { $bind: "city" } }, into: "forecast" },
          { type: "Text", text: "Forecast" },
        ],
        { call, store },
      );
      expect(call).not.toHaveBeenCalled();
      await act(async () => vi.advanceTimersByTimeAsync(300));
      expect(call).toHaveBeenCalledWith("forecast", { city: "Oslo" });
      expect(store.get("forecast")).toEqual(forecastFor("Oslo"));

      // A bound argument changing runs the query again, once it settles.
      act(() => store.set("city", "Lisbon"));
      await act(async () => vi.advanceTimersByTimeAsync(300));
      expect(call).toHaveBeenLastCalledWith("forecast", { city: "Lisbon" });
      expect(store.get("forecast")).toEqual(forecastFor("Lisbon"));
    } finally {
      vi.useRealTimers();
    }
  });

  it("waits while the response streams and does nothing without a tool caller", async () => {
    vi.useFakeTimers();
    try {
      const call = caller();
      renderStack([{ type: "Query", tool: "forecast", args: { city: "Oslo" }, into: "forecast" }], {
        call,
        streaming: true,
      });
      await act(async () => vi.advanceTimersByTimeAsync(1000));
      expect(call).not.toHaveBeenCalled();
      expect(() =>
        renderStack([{ type: "Query", tool: "forecast", into: "forecast" }]),
      ).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("bound data", () => {
  it("shows what a tool stored, live", () => {
    const store = createGenUIStore({ items: ["First"] });
    const { container } = renderStack([{ type: "List", items: { $bind: "items" } }], { store });
    expect(container.querySelectorAll("li")).toHaveLength(1);
    act(() => store.set("items", ["First", "Second"]));
    expect([...container.querySelectorAll("li")].map((item) => item.textContent)).toEqual([
      "First",
      "Second",
    ]);
  });
});

describe("Button actions", () => {
  it("calls a tool, stores the result, then asks the assistant", async () => {
    const call = caller();
    const onAction = vi.fn();
    const store = createGenUIStore({ city: "Tokyo" });
    const { user, getByRole } = renderStack(
      [
        {
          type: "Button",
          label: "Refresh",
          action: [
            { call: "forecast", args: { city: { $bind: "city" } }, into: "forecast" },
            { set: "refreshed", value: { $expr: "1 + 1" } },
            { send: "I refreshed the forecast." },
          ],
        },
      ],
      { call, store, onAction },
    );
    await user.click(getByRole("button", { name: "Refresh" }));
    await vi.waitFor(() => expect(onAction).toHaveBeenCalled());
    expect(call).toHaveBeenCalledWith("forecast", { city: "Tokyo" });
    expect(store.get("forecast")).toEqual(forecastFor("Tokyo"));
    expect(store.get("refreshed")).toBe(2);
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: "button", message: "I refreshed the forecast." }),
    );
  });

  it("stops at a failing step and says why", async () => {
    const call = vi.fn(async () => ({ ok: false as const, error: "forecast failed" }));
    const onAction = vi.fn();
    const { user, getByRole, findByRole } = renderStack(
      [
        {
          type: "Button",
          label: "Refresh",
          action: [{ call: "forecast", args: {}, into: "forecast" }, { send: "Done." }],
        },
      ],
      { call, onAction },
    );
    await user.click(getByRole("button", { name: "Refresh" }));
    expect((await findByRole("alert")).textContent).toBe("forecast failed");
    expect(onAction).not.toHaveBeenCalled();
  });
});

describe("Form actions", () => {
  it("sends the form's values to a call step without args and stores the result", async () => {
    const call = vi.fn(async (_name: string, args: unknown) => ({
      ok: true as const,
      value: { confirmed: (args as { guests: number }).guests },
    }));
    const onAction = vi.fn();
    const store = createGenUIStore();
    const { user, getByRole } = renderStack(
      [
        {
          type: "Form",
          name: "booking",
          title: "Book a table",
          submitLabel: "Book",
          action: [{ call: "bookTable", into: "booking" }, { send: "I booked the table." }],
          children: [{ type: "NumberField", label: "Guests", name: "guests", value: 4 }],
        },
      ],
      { call, store, onAction },
    );
    await user.click(getByRole("button", { name: "Book" }));
    await vi.waitFor(() => expect(onAction).toHaveBeenCalled());
    expect(call).toHaveBeenCalledWith("bookTable", { guests: 4 });
    expect(store.get("booking")).toEqual({ confirmed: 4 });
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: "form", name: "booking", message: "I booked the table." }),
    );
  });
});

describe("Slot", () => {
  it("places a host view by name and nothing for other names", () => {
    const { getByTestId, container } = renderStack(
      [
        { type: "Slot", name: "map" },
        { type: "Slot", name: "toString" },
      ],
      { slots: { map: <div data-testid="map">Map of Oslo</div> } },
    );
    expect(getByTestId("map").textContent).toBe("Map of Oslo");
    expect(container.textContent).toBe("Map of Oslo");
  });
});
