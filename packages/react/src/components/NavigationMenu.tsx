import { useEffect, useRef, type HTMLAttributes } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import {
  NavigationMenuContext,
  type NavigationMenuContextValue,
} from "./navigation-menu-shared.js";

/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions -- Escape handling, focusout closing, and hover-intent timers coordinate the disclosures inside the nav landmark; the handlers trigger no action of their own, so the nav stays non-interactive. */

export type NavigationMenuProps = Omit<HTMLAttributes<HTMLElement>, "defaultValue" | "onChange"> & {
  /** Value of the open item; "" means every panel is closed. */
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the next open item value rather than a DOM ChangeEvent. */
  onChange?: ((value: string) => void) | undefined;
};

/**
 * APG disclosure navigation menu: a nav landmark whose triggers expand link
 * panels, not role="menu". Tab moves through triggers and links in document
 * order. Name it with aria-label or aria-labelledby when the page has more
 * than one navigation landmark.
 */
export function NavigationMenu({
  value: valueProp,
  defaultValue = "",
  onChange,
  onBlur,
  onKeyDown,
  onPointerEnter,
  onPointerLeave,
  ref,
  ...props
}: NavigationMenuProps & RefProp<HTMLElement>) {
  const triggerMap = useRef(new Map<string, HTMLElement>());
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
  });

  const clearTimers = () => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  };
  useEffect(() => clearTimers, []);

  const context: NavigationMenuContextValue = {
    value,
    open(next) {
      clearTimers();
      setValue(next);
    },
    close() {
      clearTimers();
      setValue("");
    },
    scheduleOpen(next) {
      clearTimers();
      // Hover intent: switching from an already-open panel is quick, while a
      // cold hover waits longer so a passing pointer opens nothing.
      const delay = value === "" ? 300 : 150;
      openTimer.current = window.setTimeout(() => setValue(next), delay);
    },
    cancelOpen() {
      window.clearTimeout(openTimer.current);
    },
    registerTrigger(itemValue, element) {
      if (element) triggerMap.current.set(itemValue, element);
      else triggerMap.current.delete(itemValue);
    },
  };

  return (
    <NavigationMenuContext value={context}>
      <nav
        {...props}
        ref={ref}
        data-slot={dataSlot(props, "navigation-menu")}
        data-open={dataAttr(value !== "")}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.key !== "Escape" || value === "") return;
          event.preventDefault();
          triggerMap.current.get(value)?.focus();
          context.close();
        }}
        onBlur={(event) => {
          onBlur?.(event);
          if (event.defaultPrevented || value === "") return;
          const next = event.relatedTarget;
          if (next instanceof Node && event.currentTarget.contains(next)) return;
          context.close();
        }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (!event.defaultPrevented) window.clearTimeout(closeTimer.current);
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          if (event.defaultPrevented) return;
          window.clearTimeout(openTimer.current);
          if (value === "") return;
          // Delayed so the pointer can dip outside the nav and come back.
          closeTimer.current = window.setTimeout(() => setValue(""), 300);
        }}
      />
    </NavigationMenuContext>
  );
}
