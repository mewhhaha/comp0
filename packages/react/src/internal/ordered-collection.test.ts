import { afterEach, describe, expect, it, vi } from "vitest";
import { type OrderedCollectionSeed } from "./collection-pass.js";
import { createOrderedCollection } from "./ordered-collection.js";

function fakeSeed(): OrderedCollectionSeed {
  return {
    add: () => {},
    resolve: () => null,
    position: () => undefined,
    size: () => 0,
    clear: vi.fn(),
  };
}

function elements(count: number) {
  const parent = document.createElement("div");
  document.body.append(parent);
  return Array.from({ length: count }, () => parent.appendChild(document.createElement("div")));
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("createOrderedCollection", () => {
  it("answers each key's document position and the size, whatever the registration order", () => {
    const store = createOrderedCollection(fakeSeed());
    const [first, second, third] = elements(3);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.collection.register({ key: "c", textValue: "", element: third! });
    store.collection.register({ key: "a", textValue: "", element: first! });
    store.collection.register({ key: "b", textValue: "", element: second! });

    expect(["a", "b", "c", "missing"].map(store.position)).toEqual([0, 1, 2, undefined]);
    expect(store.size()).toBe(3);
    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
    store.collection.unregister("a", first);
    expect(listener).toHaveBeenCalledTimes(3);
    expect(store.position("b")).toBe(0);
  });

  it("keeps one cached order between notifications", () => {
    const store = createOrderedCollection(fakeSeed());
    elements(4).forEach((element, index) => {
      store.collection.register({ key: `${index}`, textValue: "", element });
    });
    store.position("0");
    const compare = vi.spyOn(Node.prototype, "compareDocumentPosition");

    for (let read = 0; read < 10; read += 1) {
      expect(store.position("3")).toBe(3);
      expect(store.size()).toBe(4);
    }
    expect(compare).not.toHaveBeenCalled();
  });

  it("clears every given seed on its first non-empty read and not on an empty one", () => {
    const seeds = [fakeSeed(), fakeSeed()];
    const store = createOrderedCollection(...seeds);

    expect(store.size()).toBe(0);
    for (const seed of seeds) expect(seed.clear).not.toHaveBeenCalled();

    const [element] = elements(1);
    store.collection.register({ key: "a", textValue: "", element: element! });
    expect(store.position("a")).toBe(0);
    expect(store.size()).toBe(1);
    for (const seed of seeds) expect(seed.clear).toHaveBeenCalledTimes(1);
  });

  it("notifies from verify only when a key's element no longer precedes the next one", () => {
    const store = createOrderedCollection(fakeSeed());
    const [first, second] = elements(2);
    store.collection.register({ key: "a", textValue: "", element: first! });
    store.collection.register({ key: "b", textValue: "", element: second! });
    const listener = vi.fn();
    store.subscribe(listener);
    expect(store.position("a")).toBe(0);

    store.verify("a");
    store.verify("b");
    store.verify("missing");
    expect(listener).not.toHaveBeenCalled();

    first!.parentElement!.append(first!);
    store.verify("a");
    expect(listener).toHaveBeenCalledTimes(1);
    expect([store.position("a"), store.position("b")]).toEqual([1, 0]);
  });
});
