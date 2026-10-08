import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createCollection,
  useCollection,
  useCollectionNavigation,
  type CollectionItem,
} from "./collection.js";

function elements(count: number) {
  const created = Array.from({ length: count }, () => document.createElement("div"));
  document.body.append(...created);
  return created;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("createCollection", () => {
  it("reads registered items back in document order regardless of registration order", () => {
    const [first, second, third] = elements(3);
    const collection = createCollection();
    collection.register({ key: "c", textValue: "Charlie", element: third! });
    collection.register({ key: "a", textValue: "Alpha", element: first! });
    collection.register({ key: "b", textValue: "Bravo", element: second! });

    expect(collection.items().map((item) => item.key)).toEqual(["a", "b", "c"]);
    expect(collection.get("b")?.textValue).toBe("Bravo");
  });

  it("re-sorts a cached order after elements move without re-registering", () => {
    const [first, second] = elements(2);
    const collection = createCollection();
    collection.register({ key: "a", textValue: "Alpha", element: first! });
    collection.register({ key: "b", textValue: "Bravo", element: second! });
    expect(collection.items().map((item) => item.key)).toEqual(["a", "b"]);

    document.body.prepend(second!);

    expect(collection.items().map((item) => item.key)).toEqual(["b", "a"]);
  });

  it("treats unchanged re-registration as a no-op and reports real changes", () => {
    const [element] = elements(1);
    const collection = createCollection();
    const listener = vi.fn();
    collection.subscribe(listener);

    expect(collection.register({ key: "a", textValue: "Alpha", element: element! })).toBe(true);
    expect(collection.register({ key: "a", textValue: "Alpha", element: element! })).toBe(false);
    expect(
      collection.register({ key: "a", textValue: "Alpha", element: element!, disabled: true }),
    ).toBe(true);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("unregisters items registered with a null element", () => {
    const [element] = elements(1);
    const collection = createCollection();
    collection.register({ key: "a", textValue: "Alpha", element: element! });

    expect(collection.register({ key: "a", textValue: "Alpha", element: null })).toBe(true);
    expect(collection.items()).toEqual([]);
  });

  it("ignores a stale unregister once another element took over the key", () => {
    const [previous, replacement] = elements(2);
    const collection = createCollection();
    collection.register({ key: "a", textValue: "Alpha", element: previous! });
    collection.register({ key: "a", textValue: "Alpha", element: replacement! });

    expect(collection.unregister("a", previous)).toBe(false);
    expect(collection.get("a")?.element).toBe(replacement);
    expect(collection.unregister("a", replacement)).toBe(true);
    expect(collection.get("a")).toBeUndefined();
  });

  it("filters disabled items and stops notifying after unsubscribe", () => {
    const [first, second] = elements(2);
    const collection = createCollection<CollectionItem & { group: string }>();
    const listener = vi.fn();
    const unsubscribe = collection.subscribe(listener);
    collection.register({ key: "a", textValue: "Alpha", element: first!, group: "x" });
    unsubscribe();
    collection.register({
      key: "b",
      textValue: "Bravo",
      element: second!,
      disabled: true,
      group: "x",
    });

    expect(collection.enabledItems().map((item) => item.key)).toEqual(["a"]);
    expect(listener).toHaveBeenCalledOnce();
  });
});

describe("useCollection", () => {
  it("keeps one registry for the component's lifetime", () => {
    const { result, rerender } = renderHook(() => useCollection());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});

describe("useCollectionNavigation", () => {
  const items = [
    { key: "apple", textValue: "Apple" },
    { key: "banana", textValue: "Banana", disabled: true },
    { key: "blueberry", textValue: "Blueberry" },
    { key: "cherry", textValue: "Cherry" },
  ];

  it("resolves arrow, Home, and End keys by orientation, direction, and looping", () => {
    const { result } = renderHook(() => useCollectionNavigation());
    const navigate = result.current;

    expect(navigate("ArrowDown", items, "apple", { orientation: "vertical" })).toBe("blueberry");
    expect(navigate("ArrowRight", items, "apple", { orientation: "vertical" })).toBeUndefined();
    expect(navigate("End", items, "apple")).toBe("cherry");
    expect(navigate("ArrowDown", items, "cherry")).toBe("cherry");
    expect(navigate("ArrowDown", items, "cherry", { loop: true })).toBe("apple");
    expect(navigate("ArrowLeft", items, "apple", { orientation: "horizontal", dir: "rtl" })).toBe(
      "blueberry",
    );
  });

  it("extends one typeahead buffer across printable keys until it times out", () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useCollectionNavigation());
      const navigate = result.current;

      expect(navigate("b", items, "apple")).toBe("blueberry");
      expect(navigate("l", items, "apple")).toBe("blueberry");
      vi.advanceTimersByTime(700);
      expect(navigate("c", items, "apple")).toBe("cherry");
      expect(navigate("x", items, "apple", { typeahead: false })).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});
