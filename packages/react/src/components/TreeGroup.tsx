import { useContext, useLayoutEffect, type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import {
  TreeContext,
  TreeGroupScopeContext,
  TreeItemContext,
  TreeLevelContext,
  useTreeGroupScope,
} from "./tree-shared.js";

export type TreeGroupProps = HTMLAttributes<HTMLDivElement>;

/**
 * Container for a TreeItem's child items. Nesting one inside a TreeItem
 * makes that item expandable; while the item is collapsed the group renders
 * with the hidden attribute so its rows leave the visible and focusable
 * order without unmounting.
 */
export function TreeGroup({ children, ref, ...props }: TreeGroupProps & RefProp<HTMLDivElement>) {
  const tree = useContext(TreeContext);
  const item = useContext(TreeItemContext);
  const level = useContext(TreeLevelContext);
  const scope = useTreeGroupScope();
  useLayoutEffect(() => item?.registerGroup(), [item]);
  let hidden = false;
  if (item && !tree?.expanded.includes(item.value)) hidden = true;

  return (
    <div {...props} ref={ref} role="group" hidden={hidden}>
      <TreeLevelContext value={level + 1}>
        <TreeGroupScopeContext value={scope}>{children}</TreeGroupScopeContext>
      </TreeLevelContext>
    </div>
  );
}
