import { use, useLayoutEffect, useState, type ComponentProps } from "react";
import { useIsCollectionPass, useIsCollectionPassOf } from "../internal/collection-pass.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
  TreeCollapsedContext,
  TreeGroupScopeContext,
  TreeLevelContext,
  TreeSetContext,
  useOptionalTreeItemContext,
  useTreeContext,
  useTreeScope,
} from "./tree-shared.js";

export type TreeGroupProps = ComponentProps<"div"> & AsProp;

/**
 * Container for a TreeItem's child items. Nesting one inside a TreeItem
 * makes that item expandable; while the item is collapsed the group renders
 * with the hidden attribute so its rows leave the visible and focusable
 * order without unmounting.
 */
export function TreeGroup(props: TreeGroupProps) {
  // A collection pass only needs the items inside the group, which item owns it, and whether
  // they are collapsed.
  const collecting = useIsCollectionPass();
  if (collecting) return <CollectedTreeGroup {...props} />;
  return <TreeGroupPart {...props} />;
}

/** Whether the group's own item is closed, which hides the group and every item inside it. */
function useGroupHidden() {
  const tree = useTreeContext("TreeGroup");
  const item = useOptionalTreeItemContext();
  return { tree, item, hidden: item !== null && !tree.open.includes(item.value) };
}

function TreeGroupPart({ as, children, ...props }: TreeGroupProps) {
  const { item, hidden } = useGroupHidden();
  const level = use(TreeLevelContext);
  const collapsed = use(TreeCollapsedContext);
  const scope = useTreeScope();
  useLayoutEffect(() => item?.registerGroup(), [item]);

  const Part = partElement(as, "div");
  return (
    <TreeLevelContext value={level + 1}>
      <TreeCollapsedContext value={collapsed || hidden}>
        <TreeGroupScopeContext value={scope}>
          <Part {...props} role="group" hidden={hidden}>
            {children}
          </Part>
        </TreeGroupScopeContext>
      </TreeCollapsedContext>
    </TreeLevelContext>
  );
}

function CollectedTreeGroup({ children }: TreeGroupProps) {
  const { tree, item, hidden } = useGroupHidden();
  const collapsed = use(TreeCollapsedContext);
  // The group's own sibling set, so a group with no owning item does not number its items
  // together with the items around it.
  const [set] = useState(() => ({}));
  // A render-time write under the same limits as `useCollectedItem`: only in the tree's own pass.
  const own = useIsCollectionPassOf(tree.seed);
  if (own && item) tree.shape.addGroup(item.value);
  return (
    <TreeCollapsedContext value={collapsed || hidden}>
      <TreeSetContext value={set}>{children}</TreeSetContext>
    </TreeCollapsedContext>
  );
}
