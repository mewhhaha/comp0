import { useCallback, useMemo, useRef, useState } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { FeedContext, sortArticles } from "./feed-shared.js";
import { type FeedArticleRecord, type FeedProps } from "./feed-shared.js";
export type { FeedProps } from "./feed-shared.js";

export function Feed({
  busy = false,
  onKeyDown,
  ref,
  ...props
}: FeedProps & RefProp<HTMLDivElement>) {
  const articleMap = useRef(new Map<string, FeedArticleRecord>());
  const [version, setVersion] = useState(0);
  const registerArticle = useCallback((key: string, element: HTMLElement | null) => {
    const previous = articleMap.current.get(key);
    if (element) {
      if (previous?.element === element) return;
      articleMap.current.set(key, { key, element });
      setVersion((current) => current + 1);
      return;
    }

    if (!previous) return;
    articleMap.current.delete(key);
    setVersion((current) => current + 1);
  }, []);
  const context = useMemo(
    () => ({
      version,
      registerArticle,
      articles() {
        return sortArticles([...articleMap.current.values()]);
      },
      articlePosition(key: string) {
        const articles = sortArticles([...articleMap.current.values()]);
        const index = articles.findIndex((article) => article.key === key);
        return { index, count: articles.length };
      },
    }),
    [registerArticle, version],
  );

  return (
    <FeedContext.Provider value={context}>
      <div
        {...props}
        ref={ref}
        role="feed"
        aria-busy={busy || undefined}
        data-busy={dataAttr(busy)}
        data-slot={dataSlot(props, "feed")}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          let articleElement: HTMLElement | null = null;
          if (event.target instanceof HTMLElement) {
            articleElement = event.target.closest<HTMLElement>("[role='article']");
          }
          if (!articleElement) return;
          const articles = context.articles();
          const currentIndex = articles.findIndex((article) => article.element === articleElement);
          if (currentIndex < 0) return;

          let nextIndex = currentIndex;
          if (event.key === "PageDown") nextIndex = Math.min(articles.length - 1, currentIndex + 1);
          else if (event.key === "PageUp") nextIndex = Math.max(0, currentIndex - 1);
          else if (event.key === "Home" && event.ctrlKey) nextIndex = 0;
          else if (event.key === "End" && event.ctrlKey) nextIndex = articles.length - 1;
          else return;

          event.preventDefault();
          articles[nextIndex]?.element?.focus();
        }}
      />
    </FeedContext.Provider>
  );
}
