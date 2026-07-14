import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import { chainHandlers } from "./utils.js";

type FocusVisibleDocumentState = {
  hadKeyboardEvent: boolean;
  subscribers: Set<() => void>;
  onKeyDown: (event: KeyboardEvent) => void;
  onPointerDown: () => void;
};

const focusVisibleDocumentStates = new WeakMap<Document, FocusVisibleDocumentState>();

function getFocusVisibleDocumentState(ownerDocument: Document) {
  let state = focusVisibleDocumentStates.get(ownerDocument);
  if (!state) {
    const subscribers = new Set<() => void>();
    const notify = () => {
      for (const callback of subscribers) callback();
    };
    const nextState: FocusVisibleDocumentState = {
      hadKeyboardEvent: false,
      subscribers,
      onKeyDown(event) {
        if (event.metaKey || event.altKey || event.ctrlKey) return;
        nextState.hadKeyboardEvent = true;
        notify();
      },
      onPointerDown() {
        nextState.hadKeyboardEvent = false;
        notify();
      },
    };
    state = nextState;
    focusVisibleDocumentStates.set(ownerDocument, state);
  }
  return state;
}

function subscribeToFocusVisible(ownerDocument: Document, subscriber: () => void) {
  const state = getFocusVisibleDocumentState(ownerDocument);

  if (state.subscribers.size === 0) {
    ownerDocument.addEventListener("keydown", state.onKeyDown, true);
    ownerDocument.addEventListener("pointerdown", state.onPointerDown, true);
  }
  state.subscribers.add(subscriber);

  return () => {
    state.subscribers.delete(subscriber);
    if (state.subscribers.size !== 0) return;
    ownerDocument.removeEventListener("keydown", state.onKeyDown, true);
    ownerDocument.removeEventListener("pointerdown", state.onPointerDown, true);
    focusVisibleDocumentStates.delete(ownerDocument);
  };
}

/**
 * Tracks focus and keyboard-visible focus for an element.
 *
 * Modality listeners are installed only after the element receives focus, on that
 * element's `ownerDocument`, and are removed when no focus ring remains focused.
 */
export function useFocusRing<TElement extends HTMLElement = HTMLElement>(
  options: { disabled?: boolean } = {},
) {
  const [isFocused, setFocused] = useState(false);
  const [isFocusVisible, setFocusVisible] = useState(false);
  const [ownerDocument, setOwnerDocument] = useState<Document>();
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!ownerDocument || !isFocused) return;
    return subscribeToFocusVisible(ownerDocument, () => {
      if (isFocusedRef.current) {
        setFocusVisible(getFocusVisibleDocumentState(ownerDocument).hadKeyboardEvent);
      }
    });
  }, [isFocused, ownerDocument]);

  const focusProps: HTMLAttributes<TElement> = {
    onFocus(event) {
      if (options.disabled) return;
      const document = event.currentTarget.ownerDocument;
      isFocusedRef.current = true;
      setOwnerDocument(document);
      setFocused(true);
      setFocusVisible(
        getFocusVisibleDocumentState(document).hadKeyboardEvent ||
          event.currentTarget.matches(":focus-visible"),
      );
    },
    onBlur() {
      isFocusedRef.current = false;
      setFocused(false);
      setFocusVisible(false);
    },
  };

  return { focusProps, isFocused, isFocusVisible };
}

/** Tracks pointer hover while ignoring touch pointers and disabled elements. */
export function useHover<TElement extends HTMLElement = HTMLElement>(
  options: { disabled?: boolean } = {},
) {
  const [isHovered, setHovered] = useState(false);
  const hoverProps: HTMLAttributes<TElement> = {
    onPointerEnter(event) {
      if (options.disabled || event.pointerType === "touch") return;
      setHovered(true);
    },
    onPointerLeave() {
      setHovered(false);
    },
  };

  return { hoverProps, isHovered };
}

/** Tracks pointer and keyboard press state for an element. */
export function usePress<TElement extends HTMLElement = HTMLElement>(
  options: { disabled?: boolean } = {},
) {
  const [isPressed, setPressed] = useState(false);
  const pressProps: HTMLAttributes<TElement> = {
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
  };

  return { pressProps, isPressed };
}

/** Merges interaction props, chaining event handlers in declaration order. */
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
