import { useEffect, useMemo, useState, type HTMLAttributes } from "react";
import { chainHandlers } from "./utils.js";

let hadKeyboardEvent = false;
const subscribers = new Set<() => void>();

function notifyFocusVisibleSubscribers() {
  for (const subscriber of subscribers) subscriber();
}

if (typeof window !== "undefined") {
  window.addEventListener(
    "keydown",
    (event) => {
      if (event.metaKey || event.altKey || event.ctrlKey) return;
      hadKeyboardEvent = true;
      notifyFocusVisibleSubscribers();
    },
    true,
  );

  window.addEventListener(
    "pointerdown",
    () => {
      hadKeyboardEvent = false;
      notifyFocusVisibleSubscribers();
    },
    true,
  );
}

export function useFocusRing<TElement extends HTMLElement = HTMLElement>(
  options: { disabled?: boolean } = {},
) {
  const [isFocused, setFocused] = useState(false);
  const [isFocusVisible, setFocusVisible] = useState(false);

  useEffect(() => {
    const subscriber = () => {
      if (isFocused) setFocusVisible(hadKeyboardEvent);
    };
    subscribers.add(subscriber);
    return () => {
      subscribers.delete(subscriber);
    };
  }, [isFocused]);

  const focusProps = useMemo<HTMLAttributes<TElement>>(
    () => ({
      onFocus(event) {
        if (options.disabled) return;
        setFocused(true);
        setFocusVisible(hadKeyboardEvent || event.currentTarget.matches(":focus-visible"));
      },
      onBlur() {
        setFocused(false);
        setFocusVisible(false);
      },
    }),
    [options.disabled],
  );

  return { focusProps, isFocused, isFocusVisible };
}

export function useHover<TElement extends HTMLElement = HTMLElement>(
  options: { disabled?: boolean } = {},
) {
  const [isHovered, setHovered] = useState(false);
  const hoverProps = useMemo<HTMLAttributes<TElement>>(
    () => ({
      onPointerEnter(event) {
        if (options.disabled || event.pointerType === "touch") return;
        setHovered(true);
      },
      onPointerLeave() {
        setHovered(false);
      },
    }),
    [options.disabled],
  );

  return { hoverProps, isHovered };
}

export function usePress<TElement extends HTMLElement = HTMLElement>(
  options: { disabled?: boolean } = {},
) {
  const [isPressed, setPressed] = useState(false);
  const pressProps = useMemo<HTMLAttributes<TElement>>(
    () => ({
      onPointerDown(event) {
        if (options.disabled || event.button !== 0) return;
        setPressed(true);
      },
      onPointerUp() {
        setPressed(false);
      },
      onPointerCancel() {
        setPressed(false);
      },
      onPointerLeave() {
        setPressed(false);
      },
      onKeyDown(event) {
        if (options.disabled) return;
        if (event.key === " " || event.key === "Enter") setPressed(true);
      },
      onKeyUp() {
        setPressed(false);
      },
    }),
    [options.disabled],
  );

  return { pressProps, isPressed };
}

export function mergeInteractionProps<T extends HTMLAttributes<HTMLElement>>(...propsList: T[]) {
  return propsList.reduce((acc, props) => {
    for (const [key, value] of Object.entries(props)) {
      if (
        /^on[A-Z]/.test(key) &&
        typeof value === "function" &&
        typeof acc[key as keyof T] === "function"
      ) {
        acc[key as keyof T] = chainHandlers(
          acc[key as keyof T] as never,
          value as never,
        ) as T[keyof T];
      } else {
        acc[key as keyof T] = value as T[keyof T];
      }
    }
    return acc;
  }, {} as T);
}
