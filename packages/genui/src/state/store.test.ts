import { describe, expect, it, vi } from "vitest";
import { createGenUIStore } from "./store.js";

describe("createGenUIStore", () => {
  it("stores values and hands out a stable snapshot until something changes", () => {
    const store = createGenUIStore();
    const empty = store.getSnapshot();

    expect(store.getSnapshot()).toBe(empty);
    store.set("seats", 3);
    const next = store.getSnapshot();

    expect(next).not.toBe(empty);
    expect(next).toEqual({ seats: 3 });
    expect(store.get("seats")).toBe(3);
    expect(store.getSnapshot()).toBe(next);
  });

  it("restores an initial state and ignores what is not JSON", () => {
    const store = createGenUIStore({
      a: 1,
      b: "x",
      c: [1, "y"],
      d: () => {},
      e: Number.NaN,
      f: undefined,
      g: { nested: { deep: [true, null] } },
    });

    expect(store.getSnapshot()).toEqual({
      a: 1,
      b: "x",
      c: [1, "y"],
      g: { nested: { deep: [true, null] } },
    });
  });

  it("notifies on a real change only", () => {
    const store = createGenUIStore({ a: 1, list: ["x"] });
    const listener = vi.fn();
    store.subscribe(listener);

    store.set("a", 1);
    store.set("list", ["x"]);
    store.set("missing", undefined);
    expect(listener).not.toHaveBeenCalled();
    store.set("a", 2);
    store.set("list", ["x", "y"]);
    store.set("a", undefined);
    expect(listener).toHaveBeenCalledTimes(3);
    expect(store.getSnapshot()).toEqual({ list: ["x", "y"] });
  });

  it("rejects values that are not JSON", () => {
    const store = createGenUIStore();

    store.set("a", (() => {}) as never);
    store.set("b", Number.POSITIVE_INFINITY);
    expect(store.getSnapshot()).toEqual({});
  });

  it("seeds a default only when nothing is stored, without counting it as an edit", () => {
    const store = createGenUIStore({ kept: 1 });
    const all = vi.fn();
    const edits = vi.fn();
    store.subscribe(all);
    store.subscribeToEdits(edits);

    store.seed("kept", 9);
    store.seed("fresh", 2);
    store.seed("fresh", 3);
    expect(store.getSnapshot()).toEqual({ kept: 1, fresh: 2 });
    expect(all).toHaveBeenCalledTimes(1);
    expect(edits).not.toHaveBeenCalled();

    store.set("fresh", 4);
    expect(edits).toHaveBeenCalledWith({ kept: 1, fresh: 4 });
  });

  it("stops notifying after unsubscribe and tolerates unsubscribing inside a listener", () => {
    const store = createGenUIStore();
    const listener = vi.fn();
    const stop = store.subscribe(listener);
    const once = store.subscribe(() => once());

    store.set("a", 1);
    stop();
    store.set("a", 2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps __proto__ as an ordinary key", () => {
    const store = createGenUIStore(JSON.parse('{"__proto__": 1}') as Record<string, unknown>);
    store.set("constructor", "x");

    expect(Object.getPrototypeOf(store.getSnapshot())).toBe(Object.prototype);
    expect(store.get("__proto__")).toBe(1);
    expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
  });
});
