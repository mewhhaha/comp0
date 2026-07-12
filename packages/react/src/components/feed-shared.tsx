import { createContext, useContext } from "react";
import { FOCUSABLE_SELECTOR } from "./grid-list-shared.js";

export interface FeedContextValue {
  /** Registered article elements, kept in document order. */
  articles: HTMLElement[];
  /** Total article count when known beyond the rendered ones. */
  total: number | undefined;
  /** Adds an article, kept sorted in document order; returns its unregister. */
  registerArticle: (element: HTMLElement) => () => void;
}

export const FeedContext = createContext<FeedContextValue | null>(null);

export function useFeedContext(part: string) {
  const context = useContext(FeedContext);
  if (!context) throw new Error(`${part} must be rendered inside Feed.`);
  return context;
}

/** Visible focusable elements in the document outside the feed itself. */
function focusablesOutside(feed: HTMLElement) {
  return [...feed.ownerDocument.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) => {
      if (feed.contains(element)) return false;
      if (element.closest("[hidden]")) return false;
      return element.tabIndex >= 0;
    },
  );
}

/** Best-effort tree walk to the first focusable element after the feed. */
export function firstFocusableAfter(feed: HTMLElement) {
  const following = focusablesOutside(feed).find(
    (element) => feed.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
  return following ?? null;
}

/** Best-effort tree walk to the first focusable element before the feed. */
export function firstFocusableBefore(feed: HTMLElement) {
  const preceding = focusablesOutside(feed).filter(
    (element) => feed.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING,
  );
  return preceding[preceding.length - 1] ?? null;
}
