import { useCallback, useState, type HTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { FeedContext, firstFocusableAfter, firstFocusableBefore } from "./feed-shared.js";

export type FeedProps = HTMLAttributes<HTMLDivElement> & {
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
export function Feed({
  busy,
  total,
  onKeyDown,
  ref,
  ...props
}: FeedProps & RefProp<HTMLDivElement>) {
  const [articles, setArticles] = useState<HTMLElement[]>([]);

  // The registration identity feeds a layout-effect dependency in every
  // FeedArticle; useCallback keeps articles from unregistering mid-render.
  const registerArticle = useCallback((element: HTMLElement) => {
    setArticles((current) => {
      if (current.includes(element)) return current;
      return [...current, element].sort((a, b) => {
        if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        return -1;
      });
    });
    return () => {
      setArticles((current) => current.filter((entry) => entry !== element));
    };
  }, []);

  return (
    <FeedContext value={{ articles, total, registerArticle }}>
      <div
        {...props}
        ref={ref}
        role="feed"
        aria-busy={busy || undefined}
        data-busy={dataAttr(busy)}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const target = event.target instanceof HTMLElement ? event.target : null;
          if (!target) return;
          if (event.key === "PageDown" || event.key === "PageUp") {
            const currentIndex = articles.findIndex(
              (article) => article === target || article.contains(target),
            );
            if (currentIndex === -1) return;
            let nextIndex = currentIndex - 1;
            if (event.key === "PageDown") nextIndex = currentIndex + 1;
            const nextArticle = articles[nextIndex];
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
