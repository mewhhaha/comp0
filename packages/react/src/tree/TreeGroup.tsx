import { use, useLayoutEffect, type ComponentProps } from "react";
import { useIsCollectionPass } from "../internal/collection-pass.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
  TreeCollapsedContext,
  TreeGroupScopeContext,
  TreeLevelContext,
  useOptionalTreeItemContext,
  useTreeContext,
  useTreeGroupScope,
} from "./tree-shared.js";

export type TreeGroupProps = ComponentProps<"div"> & AsProp;

/**
 * Container for a TreeItem's child items. Nesting one inside a TreeItem
 * makes that item expandable; while the item is collapsed the group renders
 * with the hidden attribute so its rows leave the visible and focusable
 * order without unmounting.
 */
export function TreeGroup(props: TreeGroupProps) {
  // A collection pass only needs the items inside the group, and whether they are collapsed.
  const collecting = useIsCollectionPass();
  if (collecting) return <CollectedTreeGroup {...props} />;
  return <TreeGroupPart {...props} />;
}

/** Whether the group's own item is closed, which hides the group and every item inside it. */
function useGroupHidden() {
  const tree = useTreeContext("TreeGroup");
  const item = useOptionalTreeItemContext();
  return { item, hidden: item !== null && !tree.open.includes(item.value) };
}

function TreeGroupPart({ as, children, ...props }: TreeGroupProps) {
  const { item, hidden } = useGroupHidden();
  const level = use(TreeLevelContext);
  const collapsed = use(TreeCollapsedContext);
  const scope = useTreeGroupScope();
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
  const { hidden } = useGroupHidden();
  const collapsed = use(TreeCollapsedContext);
  return <TreeCollapsedContext value={collapsed || hidden}>{children}</TreeCollapsedContext>;
}
