import { type ReactNode } from "react";
import { type JsonValue } from "../json/parse.js";
import { type GenUIError } from "../validate/errors.js";

/** Serializable metadata; implementations and rendered children travel separately through RSC. */
export type EditableNode = {
  id: string;
  name: string;
  props: Record<string, JsonValue>;
  inputs: Record<string, JsonValue>;
  binding?: string | undefined;
  text?: readonly (string | { $expr: string })[] | undefined;
};

export type ClientEdit = {
  target: string;
  expectedRevision: number;
  node: EditableNode;
} & (
  | { kind: "update" }
  | { kind: "append"; children: ReactNode; targets: readonly EditableNode[] }
);

type Target = {
  node: EditableNode;
  revision: number;
  appends: readonly ReactNode[];
  owner: string | undefined;
  active: boolean;
};

function targetKey(scope: string, id: string) {
  return JSON.stringify([scope, id]);
}
function problem(id: string, message: string): GenUIError {
  return { path: id, code: "invalid-prop", message };
}

/** Keeps mounted targets and accepted edit receipts for one conversation root. */
export function createEditStore() {
  let targets = new Map<string, Target>();
  const receipts = new Set<string>();
  const listeners = new Set<() => void>();
  function notify() {
    for (const listener of listeners) listener();
  }
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    get(scope: string, id: string) {
      return targets.get(targetKey(scope, id));
    },
    register(scope: string, owner: string, node: EditableNode): GenUIError[] {
      const key = targetKey(scope, node.id);
      const previous = targets.get(key);
      if (previous?.owner !== undefined && previous.owner !== owner) {
        return [problem(node.id, `Component id ${JSON.stringify(node.id)} is already in use.`)];
      }
      if (!previous && targets.size >= 1000) {
        return [problem(node.id, "A conversation accepts at most 1000 component IDs.")];
      }
      let target: Target = { node, revision: 0, appends: [], owner, active: true };
      if (previous) target = { ...previous, owner, active: true };
      targets.set(key, target);
      notify();
      return [];
    },
    unregister(scope: string, id: string, owner: string) {
      const key = targetKey(scope, id);
      const target = targets.get(key);
      if (!target || target.owner !== owner) return;
      // Retain revisions across StrictMode's effect cleanup and replay. IDs cannot be recycled.
      targets.set(key, { ...target, active: false });
      notify();
    },
    apply(turn: string, scope: string, operations: readonly ClientEdit[]): GenUIError[] {
      const receipt = targetKey(scope, turn);
      if (receipts.has(receipt)) return [];
      if (receipts.size >= 1000) {
        return [problem(turn, "A conversation accepts at most 1000 edit turns.")];
      }
      const next = new Map(targets);
      for (const operation of operations) {
        const key = targetKey(scope, operation.target);
        const target = next.get(key);
        if (!target?.active) {
          return [
            problem(
              operation.target,
              `No mounted component has id ${JSON.stringify(operation.target)}.`,
            ),
          ];
        }
        if (target.revision !== operation.expectedRevision) {
          return [
            problem(
              operation.target,
              "This edit is stale. Include the latest accepted turns in history.",
            ),
          ];
        }
        let appends = target.appends;
        if (operation.kind === "append") {
          for (const node of operation.targets) {
            const childKey = targetKey(scope, node.id);
            if (next.has(childKey)) {
              return [
                problem(node.id, `Component id ${JSON.stringify(node.id)} is already in use.`),
              ];
            }
            if (next.size >= 1000) {
              return [problem(node.id, "A conversation accepts at most 1000 component IDs.")];
            }
            // Newly appended targets can be updated later in this batch, before React mounts them.
            next.set(childKey, { node, revision: 0, appends: [], owner: undefined, active: true });
          }
          appends = [...appends, operation.children];
        }
        next.set(key, { ...target, node: operation.node, revision: target.revision + 1, appends });
      }
      targets = next;
      receipts.add(receipt);
      notify();
      return [];
    },
  };
}

export type EditStore = ReturnType<typeof createEditStore>;
