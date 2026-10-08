import { useId, type ComponentProps } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { DisclosureContext } from "./disclosure-shared.js";

// The root is a native <details>, whose open state and toggle event are the
// behavior, so it renders that element and takes no `as`.
export type DisclosureProps = Omit<ComponentProps<"details">, "open" | "onChange"> & {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
};

export function Disclosure({
  children,
  id,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onToggle,
  ...props
}: DisclosureProps) {
  const generatedId = useId();
  const panelId = `${id ?? generatedId}-panel`;
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  return (
    <DisclosureContext value={{ open, panelId }}>
      <details
        {...props}
        id={id}
        open={open}
        data-open={dataAttr(open)}
        onToggle={(event) => {
          onToggle?.(event);
          if (!event.defaultPrevented) setOpen(event.currentTarget.open);
        }}
      >
        {children}
      </details>
    </DisclosureContext>
  );
}
