import { type ComponentProps, type KeyboardEvent } from "react";
import { useCollectionNavigation } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useOverlaySurface, type PopoverPlacementProps } from "../internal/overlay/index.js";
import { useRenderedId } from "../internal/rendered-id.js";
import { useSelectContext } from "./select-shared.js";

export type SelectPopoverProps = ComponentProps<"div"> & AsProp & PopoverPlacementProps;

export function SelectPopover({
  as,
  offset,
  onKeyDown,
  onToggle,
  placement,
  ref,
  style,
  ...props
}: SelectPopoverProps) {
  const select = useSelectContext("SelectPopover");
  const { collection, popover } = select;
  const navigate = useCollectionNavigation();
  const surface = useOverlaySurface<HTMLDivElement>({
    id: props.id ?? select.listBoxId,
    offset,
    onToggle,
    placement,
    popover: "auto",
    ref,
    style,
    initialFocus() {
      const selected = collection.get(select.selectedKey);
      const target = selected && !selected.disabled ? selected : collection.enabledItems()[0];
      return target?.element;
    },
  });
  // Reference the label only when one is rendered; otherwise the trigger names the list.
  const label = useRenderedId(surface.surfaceRef, select.labelId, select);
  let labelledBy = props["aria-labelledby"];
  if (!props["aria-label"]) labelledBy = labelledBy ?? label ?? select.triggerId;

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      {...surface.props}
      role={props.role ?? "listbox"}
      aria-labelledby={labelledBy}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "Escape") {
          event.preventDefault();
          popover.requestClose();
          return;
        }
        const activeElement = event.currentTarget.ownerDocument.activeElement;
        const current = collection.items().find((item) => item.element === activeElement);
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (current && !current.disabled) select.setSelectedKey(current.key);
          popover.requestClose();
          return;
        }
        const next = navigate(event.key, collection.items(), current?.key, {
          orientation: "vertical",
          loop: true,
        });
        if (!next) return;
        event.preventDefault();
        collection.get(next)?.element?.focus();
      }}
    />
  );
}
