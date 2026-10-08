import {
  use,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
  TreeItemContext,
  TreeLevelContext,
  treeRowText,
  useTreeContext,
  useTreeGroupScopeContext,
  type TreeItemContextValue,
} from "./tree-shared.js";

export type TreeItemProps = ComponentProps<"div"> &
  AsProp & {
    /** Identifies the item for selection and expansion. */
    value: string;
    disabled?: boolean | undefined;
    /** Overrides the text crawled from the row for typeahead. */
    textValue?: string | undefined;
  };

export function TreeItem({
  as,
  id: idProp,
  value,
  disabled,
  textValue,
  children,
  onClick,
  onKeyDown,
  ref,
  ...props
}: TreeItemProps) {
  const tree = useTreeContext("TreeItem");
  const scope = useTreeGroupScopeContext("TreeItem");
  const level = use(TreeLevelContext);
  const generatedId = useId().replace(/:/g, "");
  const id = idProp ?? `tree-item-${generatedId}`;
  const resolvedDisabled = Boolean(disabled);
  const selected = tree.selectedKey === value;
  const active = tree.activeKey === value;
  const open = tree.open.includes(value);
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

  const registerItem = (element: HTMLElement | null) => {
    const item = {
      key: value,
      id,
      textValue: element ? label(element) : value,
      element,
      disabled: resolvedDisabled,
    };
    tree.register(item);
    scope.collection.register(item);
  };

  const itemRef = (element: HTMLDivElement | null) => {
    elementRef.current = element;
    registerItem(element);
    composeRefs(ref)(element);
  };

  // Re-register after every render so crawled labels follow content changes;
  // registration is idempotent, so unchanged items cost nothing.
  useLayoutEffect(() => {
    registerItem(elementRef.current);
  });

  let tabIndex: number | undefined = -1;
  if (resolvedDisabled) tabIndex = undefined;
  else if (active) tabIndex = 0;

  const index = scope.order.indexOf(value);
  let posInSet: number | undefined;
  let setSize: number | undefined;
  if (index >= 0) {
    posInSet = index + 1;
    setSize = scope.order.length;
  }

  const Part = partElement(as, "div");
  return (
    <TreeItemContext value={itemContext}>
      <Part
        {...props}
        ref={itemRef}
        id={id}
        role="treeitem"
        tabIndex={tabIndex}
        aria-level={level}
        aria-posinset={posInSet}
        aria-setsize={setSize}
        aria-selected={selected || undefined}
        aria-expanded={hasGroup ? open : undefined}
        aria-disabled={resolvedDisabled || undefined}
        data-selected={dataAttr(selected)}
        data-open={dataAttr(hasGroup && open)}
        data-disabled={dataAttr(resolvedDisabled)}
        data-value={value}
        onClick={(event: MouseEvent<HTMLDivElement>) => {
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
          tree.setActiveKey(value);
          tree.setSelectedKey(value);
          // Clicking an expandable row both selects it and toggles its group,
          // so pointer users need no separate chevron control; keyboard
          // expansion stays on the inline arrow keys.
          if (hasGroup) tree.toggleOpen(value);
        }}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || resolvedDisabled) return;
          // Keydown from a focused nested item bubbles through ancestor items;
          // only the focused item itself selects.
          if (event.target !== event.currentTarget) return;
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          tree.setActiveKey(value);
          tree.setSelectedKey(value);
        }}
      >
        {children}
      </Part>
    </TreeItemContext>
  );
}
