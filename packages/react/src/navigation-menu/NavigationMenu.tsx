import {
  useEffect,
  useRef,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  dataAttr,
  useCollection,
  useCollectionNavigation,
  useControllableState,
} from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
  NavigationMenuContext,
  type NavigationMenuContextValue,
  type NavigationStop,
} from "./navigation-menu-shared.js";
import { writingDirection } from "../internal/writing-direction.js";

const MOVEMENT_KEYS = new Set(["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"]);

type Navigate = ReturnType<typeof useCollectionNavigation>;

/**
 * Resolves an arrow, Home, or End press against an ordered row of focus
 * stops. Movement never wraps; null at an edge keeps the key's default
 * behavior so the page can still scroll.
 */
function focusStopAfterMovement(
  navigate: Navigate,
  stops: NavigationStop[],
  target: NavigationStop,
  key: string,
  dir: "ltr" | "rtl",
) {
  const next = navigate(key, stops, target.key, { dir, typeahead: false });
  if (next === undefined || next === target.key) return null;
  return stops.find((stop) => stop.key === next)?.element ?? null;
}

/**
 * The APG disclosure navigation example's optional arrow-key layer: arrows,
 * Home, and End move focus along the top-level row, from an expanded trigger
 * into its panel's first link, and between the links of one panel. Movement
 * never wraps and never toggles a panel; null keeps the key's default
 * behavior, so unhandled edges still scroll the page.
 */
function arrowFocusTarget(
  navigate: Navigate,
  stops: NavigationStop[],
  openValue: string,
  dir: "ltr" | "rtl",
  target: HTMLElement,
  key: string,
) {
  // Only registered triggers and links take part; a text input or other
  // widget a consumer placed in a mega-menu keeps its own arrow-key behavior.
  const current = stops.find((stop) => stop.element === target);
  if (!current) return null;
  if (current.panel !== undefined) {
    const links = stops.filter((stop) => stop.panel === current.panel);
    return focusStopAfterMovement(navigate, links, current, key, dir);
  }
  const intoPanel = key === "ArrowDown" || key === (dir === "ltr" ? "ArrowRight" : "ArrowLeft");
  if (intoPanel && current.kind === "trigger" && current.value === openValue) {
    return stops.find((stop) => stop.panel === current.value)?.element ?? null;
  }
  // The APG row holds only buttons; plain sibling links join the row here so
  // arrow movement does not silently skip them.
  const row = stops.filter((stop) => stop.panel === undefined);
  return focusStopAfterMovement(navigate, row, current, key, dir);
}

export type NavigationMenuProps = Omit<ComponentProps<"nav">, "defaultValue" | "onChange"> &
  AsProp & {
    /** Value of the open item; "" means every panel is closed. */
    value?: string | undefined;
    defaultValue?: string | undefined;
    /** Receives the next open item value rather than a DOM ChangeEvent. */
    onChange?: ((value: string) => void) | undefined;
  };

/**
 * APG disclosure navigation menu: a nav landmark whose triggers expand link
 * panels, not role="menu". Tab moves through triggers and links in document
 * order, and arrows, Home, and End move focus without opening panels. Name it
 * with aria-label or aria-labelledby when the page has more than one
 * navigation landmark.
 */
export function NavigationMenu({
  as,
  value: valueProp,
  defaultValue = "",
  onChange,
  onBlur,
  onKeyDown,
  onPointerEnter,
  onPointerLeave,
  ...props
}: NavigationMenuProps) {
  const stops = useCollection<NavigationStop>();
  const navigate = useCollectionNavigation();
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
    stops,
  };

  const Part = partElement(as, "nav");
  return (
    <NavigationMenuContext value={context}>
      <Part
        data-slot="navigation-menu"
        {...props}
        data-open={dataAttr(value !== "")}
        onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === "Escape") {
            if (value === "") return;
            event.preventDefault();
            stops
              .items()
              .find((stop) => stop.kind === "trigger" && stop.value === value)
              ?.element?.focus();
            context.close();
            return;
          }
          if (!MOVEMENT_KEYS.has(event.key)) return;
          if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
          const ownerWindow = event.currentTarget.ownerDocument.defaultView;
          if (!ownerWindow || !(event.target instanceof ownerWindow.HTMLElement)) return;
          const next = arrowFocusTarget(
            navigate,
            stops.items(),
            value,
            writingDirection(event.currentTarget),
            event.target,
            event.key,
          );
          if (!next) return;
          event.preventDefault();
          next.focus();
        }}
        onBlur={(event: FocusEvent<HTMLElement>) => {
          onBlur?.(event);
          if (event.defaultPrevented || value === "") return;
          const next = event.relatedTarget;
          const ownerWindow = event.currentTarget.ownerDocument.defaultView;
          if (
            ownerWindow &&
            next instanceof ownerWindow.Node &&
            event.currentTarget.contains(next)
          ) {
            return;
          }
          context.close();
        }}
        onPointerEnter={(event: PointerEvent<HTMLElement>) => {
          onPointerEnter?.(event);
          if (!event.defaultPrevented) window.clearTimeout(closeTimer.current);
        }}
        onPointerLeave={(event: PointerEvent<HTMLElement>) => {
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
