import { type RefProp } from "./shared.js";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { composeRefs, dataAttr } from "@comp0/core";

type DivProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

const toolbarFocusableSelector = [
  "button",
  "[href]",
  "input",
  "select",
  "textarea",
  "[tabindex]",
].join(",");

function isToolbarControl(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  if (element.hidden || element.getAttribute("aria-hidden") === "true") return false;
  if (element.getAttribute("aria-disabled") === "true") return false;
  if ("disabled" in element && Boolean(element.disabled)) return false;
  return true;
}

function getToolbarControls(root: HTMLDivElement | null) {
  if (!root) return [];
  return [...root.querySelectorAll(toolbarFocusableSelector)].filter(isToolbarControl);
}

function createDivComponent(name: string, role?: string) {
  return function ParityComponent({ children, ref, ...props }: DivProps & RefProp<HTMLDivElement>) {
    const slot = (props as Record<string, unknown>)["data-slot"] ?? name;
    return (
      <div {...props} ref={ref} role={props.role ?? role} data-slot={slot as string}>
        {children}
      </div>
    );
  };
}

function hasFileDrag(dataTransfer: DataTransfer | null) {
  if (!dataTransfer) return false;
  return Array.from(dataTransfer.types).includes("Files");
}

function acceptFileDrag(event: DragEvent<HTMLDivElement>) {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
}

export const CollectionBuilder = createDivComponent("collection-builder");
export const DefaultCollectionRenderer = createDivComponent("default-collection-renderer");
export const ComboBoxValue = createDivComponent("combobox-value");

export const DialogTrigger = createDivComponent("dialog-trigger");
export const DisclosureGroup = createDivComponent("disclosure-group");
export type DropZoneProps = HTMLAttributes<HTMLDivElement> & {
  disabled?: boolean | undefined;
};

export function DropZone({
  disabled,
  children,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  role,
  tabIndex,
  ref,
  ...props
}: DropZoneProps & RefProp<HTMLDivElement>) {
  const dragDepthRef = useRef(0);
  const [dropTarget, setDropTarget] = useState(false);
  const resolvedDisabled = Boolean(disabled);

  return (
    <div
      {...props}
      ref={ref}
      role={role ?? "group"}
      tabIndex={resolvedDisabled ? undefined : tabIndex}
      aria-disabled={resolvedDisabled || undefined}
      data-disabled={dataAttr(resolvedDisabled)}
      data-drop-target={dataAttr(dropTarget)}
      data-slot="drop-zone"
      onDragEnter={(event) => {
        onDragEnter?.(event);
        if (event.defaultPrevented || resolvedDisabled || !hasFileDrag(event.dataTransfer)) return;
        acceptFileDrag(event);
        dragDepthRef.current += 1;
        setDropTarget(true);
      }}
      onDragLeave={(event) => {
        onDragLeave?.(event);
        if (resolvedDisabled || !hasFileDrag(event.dataTransfer)) return;
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) setDropTarget(false);
      }}
      onDragOver={(event) => {
        onDragOver?.(event);
        if (event.defaultPrevented || resolvedDisabled || !hasFileDrag(event.dataTransfer)) return;
        acceptFileDrag(event);
        setDropTarget(true);
      }}
      onDrop={(event) => {
        onDrop?.(event);
        if (resolvedDisabled || !hasFileDrag(event.dataTransfer)) return;
        acceptFileDrag(event);
        dragDepthRef.current = 0;
        setDropTarget(false);
      }}
    >
      {children}
    </div>
  );
}
export type FileTriggerProps = HTMLAttributes<HTMLLabelElement> & {
  inputProps?: React.InputHTMLAttributes<HTMLInputElement> | undefined;
};
export function FileTrigger({
  children,
  inputProps,
  ref,
  ...props
}: FileTriggerProps & RefProp<HTMLLabelElement>) {
  return (
    <label {...props} ref={ref} data-slot="file-trigger">
      <input {...inputProps} type="file" hidden={inputProps?.hidden ?? true} />
      {children}
    </label>
  );
}

export const GridList = createDivComponent("grid-list", "grid");
export const GridListItem = createDivComponent("grid-list-item", "row");
export const GridListHeader = createDivComponent("grid-list-header", "rowheader");
export const GridListSection = createDivComponent("grid-list-section", "group");
export const GridListLoadMoreItem = createDivComponent("grid-list-load-more-item", "row");
export function Header(props: HTMLAttributes<HTMLElement> & RefProp<HTMLElement>) {
  const { ref } = props;
  return <header {...props} ref={ref} data-slot="header" />;
}
export function Keyboard(props: HTMLAttributes<HTMLElement> & RefProp<HTMLElement>) {
  const { ref } = props;
  return <kbd {...props} ref={ref} data-slot="keyboard" />;
}

export const ListBoxLoadMoreItem = createDivComponent("listbox-load-more-item", "option");
export const MenuTrigger = createDivComponent("menu-trigger");
export const SubmenuTrigger = createDivComponent("submenu-trigger");
export const ModalOverlay = createDivComponent("modal-overlay");
export const OverlayArrow = createDivComponent("overlay-arrow");
export const SelectionIndicator = createDivComponent("selection-indicator");
export const SharedElementTransition = createDivComponent("shared-element-transition");
export const SharedElement = createDivComponent("shared-element");

export function SliderOutput(
  props: React.OutputHTMLAttributes<HTMLOutputElement> & RefProp<HTMLOutputElement>,
) {
  const { ref } = props;
  return <output {...props} ref={ref} data-slot="slider-output" />;
}
export const SliderTrack = createDivComponent("slider-track");
export const SliderThumb = createDivComponent("slider-thumb", "slider");

export function TableLoadMoreItem(
  props: HTMLAttributes<HTMLTableRowElement> & RefProp<HTMLTableRowElement>,
) {
  const { ref } = props;
  return <tr {...props} ref={ref} data-slot="table-load-more-item" />;
}
export const ColumnResizer = createDivComponent("column-resizer", "separator");
export const ResizableTableContainer = createDivComponent("resizable-table-container");

export const TabPanels = createDivComponent("tab-panels");
export const TagGroup = createDivComponent("tag-group", "group");
export const TagList = createDivComponent("tag-list", "list");
export const Tag = createDivComponent("tag", "listitem");
export const ToggleButtonGroup = createDivComponent("toggle-button-group", "group");
export type ToolbarProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical" | undefined;
  loop?: boolean | undefined;
};

export function Toolbar({
  children,
  loop = true,
  orientation = "horizontal",
  onFocus,
  onKeyDown,
  "aria-orientation": ariaOrientation,
  ref,
  ...props
}: ToolbarProps & RefProp<HTMLDivElement>) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const activeIndexRef = useRef(0);
  const syncTabStops = useCallback((activeIndex = activeIndexRef.current) => {
    const controls = getToolbarControls(rootRef.current);
    const boundedIndex = Math.max(0, Math.min(activeIndex, Math.max(controls.length - 1, 0)));
    activeIndexRef.current = boundedIndex;
    controls.forEach((control, index) => {
      control.tabIndex = index === boundedIndex ? 0 : -1;
    });
    return controls;
  }, []);
  const moveFocus = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, nextIndex: number) => {
      const controls = getToolbarControls(rootRef.current);
      if (!controls.length) return;
      let boundedIndex = Math.max(0, Math.min(nextIndex, controls.length - 1));
      if (loop) boundedIndex = (nextIndex + controls.length) % controls.length;

      event.preventDefault();
      syncTabStops(boundedIndex);
      controls[boundedIndex]?.focus();
    },
    [loop, syncTabStops],
  );

  useEffect(() => {
    syncTabStops();
  }, [children, syncTabStops]);

  return (
    <div
      {...props}
      role="toolbar"
      ref={(element) => {
        rootRef.current = element;
        composeRefs(ref)(element);
      }}
      aria-orientation={orientation === "vertical" ? "vertical" : ariaOrientation}
      data-orientation={orientation}
      data-slot="toolbar"
      onFocus={(event) => {
        onFocus?.(event);
        const controls = getToolbarControls(rootRef.current);
        const focusedIndex = controls.indexOf(event.target as HTMLElement);
        if (focusedIndex >= 0) syncTabStops(focusedIndex);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;

        const controls = getToolbarControls(rootRef.current);
        const focusedIndex = controls.indexOf(document.activeElement as HTMLElement);
        const activeIndex = focusedIndex >= 0 ? focusedIndex : activeIndexRef.current;
        const previousKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
        const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";

        if (event.key === previousKey) moveFocus(event, activeIndex - 1);
        else if (event.key === nextKey) moveFocus(event, activeIndex + 1);
        else if (event.key === "Home") moveFocus(event, 0);
        else if (event.key === "End") moveFocus(event, controls.length - 1);
      }}
    >
      {children}
    </div>
  );
}
export const TooltipTrigger = createDivComponent("tooltip-trigger");

export const Tree = createDivComponent("tree", "tree");
export const TreeItem = createDivComponent("tree-item", "treeitem");
export const TreeItemContent = createDivComponent("tree-item-content");
export const TreeHeader = createDivComponent("tree-header");
export const TreeSection = createDivComponent("tree-section", "group");
export const TreeLoadMoreItem = createDivComponent("tree-load-more-item", "treeitem");

export const DropIndicator = createDivComponent("drop-indicator");
export const Pressable = createDivComponent("pressable");
export const Focusable = createDivComponent("focusable");
export function VisuallyHidden(props: DivProps & RefProp<HTMLDivElement>) {
  const { ref } = props;
  return (
    <div
      {...props}
      ref={ref}
      data-slot="visually-hidden"
      style={{
        border: 0,
        clip: "rect(0 0 0 0)",
        height: 1,
        margin: -1,
        overflow: "hidden",
        padding: 0,
        position: "absolute",
        width: 1,
        whiteSpace: "nowrap",
        ...props.style,
      }}
    />
  );
}

export const UNSTABLE_Toast = createDivComponent("toast", "status");
export const UNSTABLE_ToastContent = createDivComponent("toast-content");
export const UNSTABLE_ToastList = createDivComponent("toast-list", "region");
export const UNSTABLE_ToastRegion = createDivComponent("toast-region", "region");
