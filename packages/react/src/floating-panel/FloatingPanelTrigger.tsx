import { type ComponentProps, type MouseEvent } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { triggerAnchorStyle } from "../internal/overlay/index.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useFloatingPanelContext } from "./floating-panel-shared.js";

export type FloatingPanelTriggerProps = ComponentProps<"button"> &
  Pick<ComponentProps<"a">, "download" | "href" | "rel" | "target"> &
  AsProp;

export function FloatingPanelTrigger({
  as,
  onClick,
  ref,
  style,
  ...props
}: FloatingPanelTriggerProps) {
  const panel = useFloatingPanelContext("FloatingPanelTrigger");
  const triggerRef = useComposedRefs(ref, panel.setTriggerElement);
  const isNativeButton = as === undefined || as === "button";

  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      ref={triggerRef}
      id={props.id ?? panel.triggerId}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      style={triggerAnchorStyle(panel.triggerId, style)}
      aria-controls={props["aria-controls"] ?? panel.contentId}
      aria-expanded={panel.open}
      aria-haspopup={props["aria-haspopup"] ?? "dialog"}
      data-open={dataAttr(panel.open)}
      data-slot={dataSlot(props, "floating-panel-trigger")}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        panel.setOpen(!panel.open);
        if (!panel.open) panel.activate();
      }}
    />
  );
}
