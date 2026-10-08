import { useLayoutEffect, useState, type ComponentProps, type KeyboardEvent } from "react";
import { dataAttr, useCollection } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { FeedContext, firstFocusableAfter, firstFocusableBefore } from "./feed-shared.js";

export type FeedProps = ComponentProps<"div"> &
  AsProp & {
    /** Marks the feed as loading more articles via aria-busy. */
    busy?: boolean | undefined;
    /** Total article count when known beyond the rendered ones; feeds aria-setsize. */
    total?: number | undefined;
  };

/**
 * APG feed: a scroll-loaded list of articles. Needs an accessible name: pass
 * aria-label (or aria-labelledby) naming the content, such as "Article feed".
 * Inside the feed, PageDown and PageUp move focus between articles, and
 * Ctrl+End / Ctrl+Home jump to the first focusable element after / before
 * the feed so keyboard users can escape an infinite scroll.
 */
export function Feed({ as, busy, total, onKeyDown, ...props }: FeedProps) {
  const collection = useCollection();
  const [order, setOrder] = useState<string[]>([]);

  // Articles register in their own layout effects, which run before this one, so the order is
  // read once here and then kept current by the collection's change notifications.
  useLayoutEffect(() => {
    const syncOrder = () => {
      setOrder((previous) => {
        const next = collection.items().map((item) => item.key);
        if (next.length === previous.length && next.every((key, i) => key === previous[i])) {
          return previous;
        }
        return next;
      });
    };
    syncOrder();
    return collection.subscribe(syncOrder);
  }, [collection]);

  const Part = partElement(as, "div");
  return (
    <FeedContext value={{ collection, order, total }}>
      <Part
        {...props}
        role="feed"
        aria-busy={busy || undefined}
        data-busy={dataAttr(busy)}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const target = event.target instanceof HTMLElement ? event.target : null;
          if (!target) return;
          if (event.key === "PageDown" || event.key === "PageUp") {
            const articles = collection.items();
            const currentIndex = articles.findIndex(
              (article) => article.element === target || article.element?.contains(target),
            );
            if (currentIndex === -1) return;
            let nextIndex = currentIndex - 1;
            if (event.key === "PageDown") nextIndex = currentIndex + 1;
            const nextArticle = articles[nextIndex]?.element;
            if (!nextArticle) return;
            event.preventDefault();
            nextArticle.focus();
          }
          if (event.key === "End" && event.ctrlKey) {
            const after = firstFocusableAfter(event.currentTarget);
            if (!after) return;
            event.preventDefault();
            after.focus();
          }
          if (event.key === "Home" && event.ctrlKey) {
            const before = firstFocusableBefore(event.currentTarget);
            if (!before) return;
            event.preventDefault();
            before.focus();
          }
        }}
      />
    </FeedContext>
  );
}
