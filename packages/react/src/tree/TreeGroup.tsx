import { use, useLayoutEffect, type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
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
export function TreeGroup({ as, children, ...props }: TreeGroupProps) {
  const tree = useTreeContext("TreeGroup");
  const item = useOptionalTreeItemContext();
  const level = use(TreeLevelContext);
  const scope = useTreeGroupScope();
  useLayoutEffect(() => item?.registerGroup(), [item]);
  let hidden = false;
  if (item && !tree.open.includes(item.value)) hidden = true;

  const Part = partElement(as, "div");
  return (
    <TreeLevelContext value={level + 1}>
      <TreeGroupScopeContext value={scope}>
        <Part {...props} role="group" hidden={hidden}>
          {children}
        </Part>
      </TreeGroupScopeContext>
    </TreeLevelContext>
  );
}
