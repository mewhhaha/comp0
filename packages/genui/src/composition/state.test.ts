import { type } from "arktype";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import { state, type StateValues } from "./state.js";

describe("composition state", () => {
  it("requires valid defaults and preserves the declared value types", () => {
    const shape = {
      name: type("string"),
      seats: type("number"),
      enabled: type("boolean"),
      tags: type("string[]"),
    };
    const contract = state(shape, { name: "Ada", seats: 2, enabled: false, tags: [] });
    expectTypeOf(contract.initial.name).toEqualTypeOf<string>();
    expectTypeOf(contract.initial.seats).toEqualTypeOf<number>();
    expectTypeOf<StateValues<typeof shape>["tags"]>().toEqualTypeOf<string[]>();
    expect(contract.initial).toEqual({ name: "Ada", seats: 2, enabled: false, tags: [] });
    expect(() => state({ name: type("string") })).toThrow("valid synchronous default");
    expect(() => state({ seats: type("number > 0") }, { seats: -1 })).toThrow(
      "valid synchronous default",
    );
    expect(() => state({ name: type("string") }, { name: "Ada", extra: true } as never)).toThrow(
      "Unknown state default",
    );
  });

  it("derives schema defaults through synchronous validation", () => {
    const contract = state({ seats: z.number().default(3), name: z.string().default("Ada") });
    expect(contract.initial).toEqual({ seats: 3, name: "Ada" });
    expectTypeOf(contract.initial.seats).toEqualTypeOf<number>();
    expect(contract.createStore().getSnapshot()).toEqual({ seats: 3, name: "Ada" });
  });

  it("ignores invalid edits, unknown names, and invalid restoration, including refinements", () => {
    const contract = state(
      { seats: z.number().refine((value) => value % 2 === 0), name: type("string") },
      { seats: 2, name: "Ada" },
    );
    const store = contract.createStore({ seats: 3, name: "Grace", extra: true });
    expect(store.getSnapshot()).toEqual({ seats: 2, name: "Grace" });
    const edit = vi.fn();
    const change = vi.fn();
    const unsubscribe = store.subscribe(change);
    const unsubscribeEdit = store.subscribeToEdits(edit);
    for (const value of [3, "4", undefined, NaN, Infinity]) store.set("seats", value);
    store.set("extra", true);
    store.seed("extra", true);
    expect(change).not.toHaveBeenCalled();
    expect(edit).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toEqual({ seats: 2, name: "Grace" });
    expect(contract.accepts("seats", 4)).toBe(true);
    expect(contract.accepts("seats", 3)).toBe(false);
    expect(contract.accepts("extra", true)).toBe(false);
    store.seed("seats", 8);
    expect(change).not.toHaveBeenCalled();
    store.set("seats", 4);
    expect(change).toHaveBeenCalledTimes(1);
    expect(edit).toHaveBeenCalledWith({ seats: 4, name: "Grace" });
    unsubscribe();
    unsubscribeEdit();
    store.set("seats", 6);
    expect(change).toHaveBeenCalledTimes(1);
    expect(edit).toHaveBeenCalledTimes(1);
  });

  it("stores transformed schema outputs, including nested shapes", () => {
    const contract = state(
      {
        amount: z.string().transform(Number),
        settings: { "label?": type("string"), active: type("boolean") },
      },
      { amount: "12", settings: { active: true } },
    );
    expectTypeOf(contract.initial.amount).toEqualTypeOf<number>();
    expect(contract.initial).toEqual({ amount: 12, settings: { active: true } });
    const store = contract.createStore({ amount: "24" });
    expect(store.get("amount")).toBe(24);
    store.set("amount", "48");
    expect(store.get("amount")).toBe(48);
    store.set("amount", "oops");
    expect(store.get("amount")).toBe(48);
    store.set("amount", 3);
    expect(store.get("amount")).toBe(48);
  });

  it("rejects invalid identifiers, asynchronous schemas, and non-JSON defaults", () => {
    for (const name of ["bad-name", "9name", "optional?", "a".repeat(65)]) {
      expect(() => state({ [name]: type("string") }, { [name]: "x" })).toThrow(
        "Invalid state name",
      );
    }
    expect(() => state({ name: z.string().refine(async () => true) }, { name: "Ada" })).toThrow(
      "valid synchronous default",
    );
    expect(() => state({ value: z.unknown() }, { value: new Date() })).toThrow(
      "valid synchronous default",
    );
    expect(() => state({ value: z.number() }, { value: Infinity })).toThrow(
      "valid synchronous default",
    );
  });

  it("handles names that also exist on Object.prototype", () => {
    const shape = Object.fromEntries([
      ["__proto__", type("string")],
      ["constructor", type("number")],
    ]);
    const defaults = Object.fromEntries([
      ["__proto__", "safe"],
      ["constructor", 1],
    ]);
    const store = state(shape, defaults).createStore();
    expect(store.get("__proto__")).toBe("safe");
    store.set("__proto__", "updated");
    expect(store.get("__proto__")).toBe("updated");
    expect(store.get("constructor")).toBe(1);
  });
});
