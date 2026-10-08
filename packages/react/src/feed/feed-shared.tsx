import { type Collection } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";
import { FOCUSABLE_SELECTOR } from "../internal/focusable.js";

export type FeedContextValue = {
  /** Registered articles; the feed reads them back in document order. */
  collection: Collection;
  /** Article keys in document order. */
  order: readonly string[];
  /** Total article count when known beyond the rendered ones. */
  total: number | undefined;
};

export const [FeedContext, useFeedContext] = createRequiredContext<FeedContextValue>("Feed");

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
