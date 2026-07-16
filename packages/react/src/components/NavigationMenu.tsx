import { useEffect, useRef, type HTMLAttributes } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import {
  NavigationMenuContext,
  type NavigationMenuContextValue,
} from "./navigation-menu-shared.js";

/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions -- Escape and arrow-key handling, focusout closing, and hover-intent timers coordinate the disclosures inside the nav landmark; the handlers trigger no action of their own, so the nav stays non-interactive. */

export type NavigationMenuProps = Omit<HTMLAttributes<HTMLElement>, "defaultValue" | "onChange"> & {
  /** Value of the open item; "" means every panel is closed. */
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the next open item value rather than a DOM ChangeEvent. */
  onChange?: ((value: string) => void) | undefined;
};

const FORWARD_KEYS = new Set(["ArrowDown", "ArrowRight"]);
const BACKWARD_KEYS = new Set(["ArrowUp", "ArrowLeft"]);
const MOVEMENT_KEYS = new Set([...FORWARD_KEYS, ...BACKWARD_KEYS, "Home", "End"]);

function panelLinks(scope: Element) {
  return [...scope.querySelectorAll<HTMLElement>('[data-slot="navigation-menu-link"]')];
}

function focusStopAfterMovement(stops: HTMLElement[], target: HTMLElement, key: string) {
  const index = stops.indexOf(target);
  if (index < 0) return null;
  if (FORWARD_KEYS.has(key)) return stops[index + 1] ?? null;
  if (BACKWARD_KEYS.has(key)) return stops[index - 1] ?? null;
  if (key === "Home" && index > 0) return stops[0] ?? null;
  if (key === "End" && index < stops.length - 1) return stops[stops.length - 1] ?? null;
  return null;
}

/**
 * The APG disclosure navigation example's optional arrow-key layer: arrows,
 * Home, and End move focus along the top-level row, from an expanded trigger
 * into its panel's first link, and between the links of one panel. Movement
 * never wraps and never toggles a panel; null keeps the key's default
 * behavior, so unhandled edges still scroll the page.
 */
function arrowFocusTarget(nav: HTMLElement, target: HTMLElement, key: string) {
  const slot = target.getAttribute("data-slot");
  const panel = target.closest('[data-slot="navigation-menu-content"]');
  if (panel) {
    // Only the panel's links take part; a text input or other widget a
    // consumer placed in a mega-menu keeps its own arrow-key behavior.
    if (slot !== "navigation-menu-link") return null;
    return focusStopAfterMovement(panelLinks(panel), target, key);
  }
  if (slot !== "navigation-menu-trigger" && slot !== "navigation-menu-link") return null;
  if (
    FORWARD_KEYS.has(key) &&
    slot === "navigation-menu-trigger" &&
    target.getAttribute("aria-expanded") === "true"
  ) {
    const contentId = target.getAttribute("aria-controls");
    const content = contentId ? target.ownerDocument.getElementById(contentId) : null;
    if (content) return panelLinks(content)[0] ?? null;
    return null;
  }
  // The APG row holds only buttons; plain sibling links join the row here so
  // arrow movement does not silently skip them.
  const stops = [
    ...nav.querySelectorAll<HTMLElement>(
      '[data-slot="navigation-menu-trigger"], [data-slot="navigation-menu-link"]',
    ),
  ].filter((element) => !element.closest('[data-slot="navigation-menu-content"]'));
  return focusStopAfterMovement(stops, target, key);
}

/**
 * APG disclosure navigation menu: a nav landmark whose triggers expand link
 * panels, not role="menu". Tab moves through triggers and links in document
 * order, and arrows, Home, and End move focus without opening panels. Name it
 * with aria-label or aria-labelledby when the page has more than one
 * navigation landmark.
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
          if (event.defaultPrevented) return;
          if (event.key === "Escape") {
            if (value === "") return;
            event.preventDefault();
            triggerMap.current.get(value)?.focus();
            context.close();
            return;
          }
          if (!MOVEMENT_KEYS.has(event.key)) return;
          if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
          if (!(event.target instanceof HTMLElement)) return;
          const next = arrowFocusTarget(event.currentTarget, event.target, event.key);
          if (!next) return;
          event.preventDefault();
          next.focus();
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
