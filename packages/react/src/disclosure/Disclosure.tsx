import { useId, type ComponentProps } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { DisclosureContext } from "./disclosure-shared.js";

// The root is a native <details>, whose open state and toggle event are the
// behavior, so it renders that element and takes no `as`.
export type DisclosureProps = Omit<ComponentProps<"details">, "open" | "onToggle" | "onChange"> & {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state; the native toggle event remains internal to details. */
  onToggle?: ((open: boolean) => void) | undefined;
};

export function Disclosure({
  children,
  id,
  open: openProp,
  defaultOpen = false,
  onToggle,
  ...props
}: DisclosureProps) {
  const generatedId = useId();
  const panelId = `${id ?? generatedId}-panel`;
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onToggle,
  });

  return (
    <DisclosureContext value={{ open, panelId }}>
      <details
        {...props}
        id={id}
        open={open}
        data-open={dataAttr(open)}
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        {children}
      </details>
    </DisclosureContext>
  );
}
