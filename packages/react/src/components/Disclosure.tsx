import { type RefProp } from "../shared.js";
import { useId } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { DisclosureContext } from "./disclosure-shared.js";
import { type DisclosureProps } from "./disclosure-shared.js";
export type { DisclosureProps } from "./disclosure-shared.js";
export function Disclosure({
  children,
  id,
  open: openProp,
  defaultOpen = false,
  onChange,
  ref,
  ...props
}: DisclosureProps & RefProp<HTMLDetailsElement>) {
  const generatedId = useId();
  const panelId = `${id ?? generatedId}-panel`;
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange,
  });

  return (
    <DisclosureContext value={{ open, panelId }}>
      <details
        {...props}
        ref={ref}
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
