import { useContext, useId, useLayoutEffect, useRef, useState, type HTMLAttributes } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import {
  TreeContext,
  TreeGroupScopeContext,
  TreeItemContext,
  TreeLevelContext,
  treeRowText,
  type TreeItemContextValue,
} from "./tree-shared.js";

export type TreeItemProps = Omit<HTMLAttributes<HTMLDivElement>, "id"> & {
  /** Identifies the item for selection and expansion. */
  value: string;
  id?: string | undefined;
  disabled?: boolean | undefined;
  /** Overrides the text crawled from the row for typeahead. */
  textValue?: string | undefined;
};

export function TreeItem({
  id: idProp,
  value,
  disabled,
  textValue,
  children,
  onClick,
  onKeyDown,
  ref,
  ...props
}: TreeItemProps & RefProp<HTMLDivElement>) {
  const tree = useContext(TreeContext);
  const scope = useContext(TreeGroupScopeContext);
  const level = useContext(TreeLevelContext);
  const generatedId = useId().replace(/:/g, "");
  const id = idProp ?? `tree-item-${generatedId}`;
  const resolvedDisabled = Boolean(disabled);
  const selected = tree?.selectedKey === value;
  const active = tree?.activeKey === value;
  const expanded = Boolean(tree?.expanded.includes(value));
  const ariaLabel = props["aria-label"];
  const elementRef = useRef<HTMLDivElement | null>(null);

  // A mounted TreeGroup makes this item an expandable parent node; leaves
  // render no aria-expanded at all.
  const groupCount = useRef(0);
  const [hasGroup, setHasGroup] = useState(false);
  const registerGroup = () => {
    groupCount.current += 1;
    if (groupCount.current === 1) setHasGroup(true);
    return () => {
      groupCount.current -= 1;
      if (groupCount.current === 0) setHasGroup(false);
    };
  };
  const itemContext: TreeItemContextValue = { value, registerGroup };

  const label = (element: HTMLElement) => {
    if (textValue) return textValue;
    const crawled = treeRowText(element);
    if (crawled) return crawled;
    return ariaLabel ?? value;
  };

  const itemRef = (element: HTMLDivElement | null) => {
    elementRef.current = element;
    tree?.register(value, element ? label(element) : value, element, resolvedDisabled);
    scope?.registerPosition(value, element);
    composeRefs(ref)(element);
  };

  // Re-register after every render so crawled labels follow content changes
  // and the sibling scope re-sorts after DOM-order changes.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    tree?.register(value, label(element), element, resolvedDisabled);
    scope?.registerPosition(value, element);
  });

  let tabIndex: number | undefined = -1;
  if (resolvedDisabled) tabIndex = undefined;
  else if (active) tabIndex = 0;

  const index = scope ? scope.order.indexOf(value) : -1;
  let posInSet: number | undefined;
  let setSize: number | undefined;
  if (scope && index >= 0) {
    posInSet = index + 1;
    setSize = scope.order.length;
  }

  return (
    <div
      {...props}
      ref={itemRef}
      id={id}
      role="treeitem"
      tabIndex={tabIndex}
      aria-level={level}
      aria-posinset={posInSet}
      aria-setsize={setSize}
      aria-selected={selected || undefined}
      aria-expanded={hasGroup ? expanded : undefined}
      aria-disabled={resolvedDisabled || undefined}
      data-selected={dataAttr(selected)}
      data-open={dataAttr(hasGroup && expanded)}
      data-disabled={dataAttr(resolvedDisabled)}
      data-value={value}
      onClick={(event) => {
        // Clicks on a nested item bubble through every ancestor item; only
        // the item that was actually pressed reacts.
        const target = event.target instanceof HTMLElement ? event.target : null;
        const fromSelf = target?.closest('[role="treeitem"]') === event.currentTarget;
        if (fromSelf && resolvedDisabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (event.defaultPrevented || !fromSelf) return;
        tree?.setActiveKey(value);
        tree?.setSelectedKey(value);
        // v1 simplification: clicking an expandable row both selects it and
        // toggles its group, so pointer users need no separate chevron
        // control; keyboard expansion stays on the inline arrow keys.
        if (hasGroup) tree?.toggleExpanded(value);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        // Keydown from a focused nested item bubbles through ancestor items;
        // only the focused item itself selects.
        if (event.target !== event.currentTarget) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        tree?.setActiveKey(value);
        tree?.setSelectedKey(value);
      }}
    >
      <TreeItemContext value={itemContext}>{children}</TreeItemContext>
    </div>
  );
}
