import { describe, expect, it, vi } from "vitest";
import { createEditStore, type ClientEdit, type EditableNode } from "./edit-store.js";

function node(id: string, title = "Original"): EditableNode {
  return { id, name: "Card", props: { title }, inputs: { title } };
}
function update(id: string, expectedRevision: number, title = "Revised"): ClientEdit {
  return { kind: "update", target: id, expectedRevision, node: node(id, title) };
}

describe("mounted edit registry", () => {
  it("commits a turn once and leaves unrelated target snapshots stable", () => {
    const edits = createEditStore();
    edits.register("", "owner-a", node("a"));
    edits.register("", "owner-b", node("b"));
    const unrelated = edits.get("", "b");
    const notify = vi.fn();
    edits.subscribe(notify);
    expect(edits.apply("turn-2", "", [update("a", 0)])).toEqual([]);
    expect(edits.get("", "a")?.node.props.title).toBe("Revised");
    expect(edits.get("", "b")).toBe(unrelated);
    expect(edits.apply("turn-2", "", [update("a", 0)])).toEqual([]);
    expect(edits.get("", "a")?.revision).toBe(1);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("rejects stale and missing targets without committing earlier operations", () => {
    const edits = createEditStore();
    edits.register("", "owner", node("a"));
    expect(edits.apply("bad", "", [update("a", 0), update("missing", 0)])).not.toEqual([]);
    expect(edits.get("", "a")?.revision).toBe(0);
    expect(edits.apply("next", "", [update("a", 0)])).toEqual([]);
    expect(edits.apply("stale", "", [update("a", 0, "Stale")])).not.toEqual([]);
    expect(edits.get("", "a")?.node.props.title).toBe("Revised");
  });

  it("updates a just-appended target before it mounts and keeps the patch on registration", () => {
    const edits = createEditStore();
    edits.register("", "owner", node("a"));
    expect(
      edits.apply("next", "", [
        {
          kind: "append",
          target: "a",
          expectedRevision: 0,
          node: node("a"),
          children: "child",
          targets: [node("b")],
        },
        update("b", 0),
      ]),
    ).toEqual([]);
    edits.register("", "child-owner", node("b"));
    expect(edits.get("", "b")?.node.props.title).toBe("Revised");
    expect(edits.get("", "a")?.appends).toEqual(["child"]);
  });

  it("preserves StrictMode re-registration while rejecting duplicate and unmounted targets", () => {
    const edits = createEditStore();
    edits.register("", "owner", node("a"));
    edits.apply("next", "", [update("a", 0)]);
    edits.unregister("", "a", "owner");
    expect(edits.apply("unmounted", "", [update("a", 1)])).not.toEqual([]);
    edits.register("", "owner", node("a"));
    expect(edits.get("", "a")?.revision).toBe(1);
    expect(edits.register("", "other-owner", node("a"))).not.toEqual([]);
    edits.unregister("", "a", "other-owner");
    expect(edits.apply("latest", "", [update("a", 1)])).toEqual([]);
  });

  it("isolates IDs and receipts between holes", () => {
    const edits = createEditStore();
    edits.register("summary", "owner-a", node("a"));
    edits.register("controls", "owner-b", node("a"));
    edits.apply("next", "summary", [update("a", 0, "Summary")]);
    expect(edits.get("controls", "a")?.revision).toBe(0);
    expect(edits.apply("next", "controls", [update("a", 0, "Controls")])).toEqual([]);
    expect(edits.get("summary", "a")?.node.props.title).toBe("Summary");
    expect(edits.get("controls", "a")?.node.props.title).toBe("Controls");
  });
});
