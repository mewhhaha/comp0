import { describe, expect, it } from "vitest";
import {
  assertUniqueRows,
  cloneOrder,
  currentPosition,
  destinationValues,
  getMoveProposal,
  keyboardCandidates,
  labelsMatch,
  ordersMatch,
  resolveListLabel,
  targetAtPosition,
} from "./grid-list-group-order.js";

const order = { todo: ["a", "b", "c"], done: ["d"], empty: [] as string[] };
const source = (list: string, value: string) => ({ list, value, label: value });

describe("group order arithmetic", () => {
  it("clones and compares orders", () => {
    const copy = cloneOrder(order);
    expect(copy).toEqual(order);
    expect(copy.todo).not.toBe(order.todo);
    expect(ordersMatch(order, copy)).toBe(true);
    expect(ordersMatch(order, { ...copy, todo: ["b", "a", "c"] })).toBe(false);
    expect(ordersMatch(order, { todo: ["a", "b", "c"], done: ["d"] })).toBe(false);
    expect(labelsMatch({ a: "A" }, { a: "A" })).toBe(true);
    expect(labelsMatch({ a: "A" }, { a: "B" })).toBe(false);
  });

  it("rejects a row value that appears in two lists", () => {
    expect(() => assertUniqueRows({ first: ["x"], second: ["x"] })).toThrow(
      'GridListReorderGroup value "x" appears in both "first" and "second"',
    );
    expect(() => assertUniqueRows(order)).not.toThrow();
  });

  it("proposes a move within a list", () => {
    const proposal = getMoveProposal(order, source("todo", "a"), {
      list: "todo",
      value: "c",
      edge: "after",
    });
    expect(proposal?.next).toEqual({ todo: ["b", "c", "a"], done: ["d"], empty: [] });
    expect(proposal?.move).toEqual({
      value: "a",
      from: { list: "todo", index: 0 },
      to: { list: "todo", index: 2 },
      before: null,
    });
    expect(order.todo).toEqual(["a", "b", "c"]);
  });

  it("proposes a move across lists, including into an empty list", () => {
    const toDone = getMoveProposal(order, source("todo", "b"), {
      list: "done",
      value: "d",
      edge: "before",
    });
    expect(toDone?.next).toEqual({ todo: ["a", "c"], done: ["b", "d"], empty: [] });
    expect(toDone?.move.before).toBe("d");
    const toEmpty = getMoveProposal(order, source("todo", "b"), {
      list: "empty",
      value: null,
      edge: "after",
    });
    expect(toEmpty?.next.empty).toEqual(["b"]);
    expect(toEmpty?.move.to).toEqual({ list: "empty", index: 0 });
  });

  it("proposes nothing for no-op, unknown, or missing targets", () => {
    expect(
      getMoveProposal(order, source("todo", "b"), { list: "todo", value: "a", edge: "after" }),
    ).toBeNull();
    expect(
      getMoveProposal(order, source("todo", "z"), { list: "done", value: null, edge: "after" }),
    ).toBeNull();
    expect(
      getMoveProposal(order, source("todo", "a"), { list: "nope", value: null, edge: "after" }),
    ).toBeNull();
    expect(
      getMoveProposal(order, source("todo", "a"), { list: "done", value: "z", edge: "before" }),
    ).toBeNull();
  });

  it("derives destination slots and targets", () => {
    expect(destinationValues(order, "todo", "a")).toEqual(["b", "c"]);
    expect(targetAtPosition(order, "todo", 1, "a")).toEqual({
      list: "todo",
      value: "c",
      edge: "before",
    });
    expect(targetAtPosition(order, "todo", 2, "a")).toEqual({
      list: "todo",
      value: null,
      edge: "after",
    });
    expect(currentPosition(order, source("todo", "b"), null)).toEqual({
      list: "todo",
      position: 1,
    });
    expect(
      currentPosition(order, source("todo", "a"), { list: "done", value: "d", edge: "after" }),
    ).toEqual({ list: "done", position: 1 });
    expect(
      currentPosition(order, source("todo", "a"), { list: "done", value: null, edge: "after" }),
    ).toEqual({ list: "done", position: 1 });
  });

  it("lists keyboard candidates nearest first", () => {
    const here = { list: "todo", position: 1 };
    expect(keyboardCandidates(order, source("todo", "b"), here, "up")).toEqual([
      { list: "todo", position: 0 },
    ]);
    expect(keyboardCandidates(order, source("todo", "b"), here, "down")).toEqual([
      { list: "todo", position: 2 },
    ]);
    expect(keyboardCandidates(order, source("todo", "b"), here, "left")).toEqual([]);
    expect(keyboardCandidates(order, source("todo", "b"), here, "right")).toEqual([
      { list: "done", position: 1 },
      { list: "done", position: 0 },
    ]);
  });
});

describe("list labels", () => {
  it("prefers aria-labelledby text, then aria-label, then the list key", () => {
    document.body.innerHTML =
      '<h2 id="heading">  Backlog </h2><div id="a" aria-labelledby="heading"></div><div id="b" aria-label=" Done "></div><div id="c"></div>';
    const element = (id: string) => document.getElementById(id)!;
    expect(resolveListLabel("x", element("a"))).toBe("Backlog");
    expect(resolveListLabel("x", element("b"))).toBe("Done");
    expect(resolveListLabel("x", element("c"))).toBe("x");
    expect(resolveListLabel("x", undefined)).toBe("x");
  });
});
