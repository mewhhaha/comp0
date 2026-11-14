import {
  Children,
  isValidElement,
  use,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import {
  useCollectedItem,
  useIsCollectionPass,
  useRenderOrderSeed,
} from "../internal/collection-pass.js";
import { useHydrationRepair } from "../internal/hydration-repair.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useIsTabStop } from "../internal/tab-stop.js";
import {
  TreeCollapsedContext,
  TreeItemContext,
  TreeLevelContext,
  treeRowText,
  useTreeContext,
  useTreeGroupScopeContext,
  type TreeItemContextValue,
} from "./tree-shared.js";

function TreeItemPart({
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
  const { collection } = tree;
  const scope = useTreeGroupScopeContext("TreeItem");
  const scopeCollection = scope.collection;
  const level = use(TreeLevelContext);
  // An item inside a collapsed group is out of reach: it registers as disabled, so neither the
  // stop nor the seed can land on it.
  const collapsed = use(TreeCollapsedContext);
  const generatedId = useId().replace(/:/g, "");
  const id = idProp ?? `tree-item-${generatedId}`;
  const resolvedDisabled = Boolean(disabled);
  const unavailable = resolvedDisabled || collapsed;
  const selected = tree.selectedKey === value;
  const open = tree.open.includes(value);
  const ariaLabel = props["aria-label"];
  const elementRef = useRef<HTMLDivElement | null>(null);
  const itemRef = useComposedRefs(elementRef, ref);

  useRenderOrderSeed(tree.seed, value, unavailable);
  const isTabStop = useIsTabStop(tree.tabStops, value, tree.selection);
  let tabIndex: number | undefined = -1;
  if (resolvedDisabled) tabIndex = undefined;
  else if (isTabStop) tabIndex = 0;

  // The stop depends on the whole collection, which the server can see in another order.
  useHydrationRepair(
    elementRef,
    { tabindex: tabIndex === undefined ? undefined : String(tabIndex) },
    () => {
      if (!unavailable) tree.setFocusedKey(value);
    },
  );

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

  // Re-register after every render so crawled labels follow content changes; registering an
  // unchanged item is a no-op in both collections.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) {
      collection.unregister(value);
      scopeCollection.unregister(value);
      return;
    }
    let label = textValue || treeRowText(element);
    if (!label) label = ariaLabel ?? value;
    const item = { key: value, id, textValue: label, element, disabled: unavailable };
    collection.register(item);
    scopeCollection.register(item);
  });

  useLayoutEffect(() => {
    return () => {
      collection.unregister(value);
      scopeCollection.unregister(value);
    };
    // The cleanup must run only when the item unmounts or changes identity, not whenever its
    // label or disabled state changes.
  }, [collection, scopeCollection, value]);

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
          tree.setFocusedKey(value);
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
          tree.setFocusedKey(value);
          tree.setSelectedKey(value);
        }}
      >
        {children}
      </Part>
    </TreeItemContext>
  );
}

export type TreeItemProps = ComponentProps<"div"> &
  AsProp & {
    /** Identifies the item for selection and expansion. */
    value: string;
    disabled?: boolean | undefined;
    /** Overrides the text crawled from the row for typeahead. */
    textValue?: string | undefined;
  };

export function TreeItem(props: TreeItemProps) {
  // Inside a collection pass the item only records itself and passes through to its nested
  // groups, so the real items know the whole tree before they render.
  const collecting = useIsCollectionPass();
  if (collecting) return <CollectedTreeItem {...props} />;
  return <TreeItemPart {...props} />;
}

function CollectedTreeItem({ value, disabled, children }: TreeItemProps) {
  const tree = useTreeContext("TreeItem");
  const collapsed = use(TreeCollapsedContext);
  useCollectedItem(tree.seed, value, Boolean(disabled) || collapsed);
  // Nested groups only need to know which item they belong to, to read whether it is open. The
  // row's own text cannot hold items, so it stays out of the pass's hidden copy.
  const itemContext: TreeItemContextValue = { value, registerGroup: ignoreGroup };
  const elements = Children.map(children, (child) => (isValidElement(child) ? child : null));
  return <TreeItemContext value={itemContext}>{elements}</TreeItemContext>;
}

const ignoreGroup = () => () => {};
