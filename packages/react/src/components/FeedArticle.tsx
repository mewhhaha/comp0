import { useLayoutEffect, useState, type HTMLAttributes } from "react";
import { composeRefs } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { useFeedContext } from "./feed-shared.js";

export type FeedArticleProps = HTMLAttributes<HTMLElement>;

/**
 * One article in the feed: a native article element that can receive focus
 * (tabIndex -1) so PageDown and PageUp can walk the list. Articles register
 * in document order and announce their aria-posinset and aria-setsize
 * automatically. Give each article an aria-labelledby pointing at its title
 * so screen readers hear what it is about.
 */
export function FeedArticle({ ref, ...props }: FeedArticleProps & RefProp<HTMLElement>) {
  const feed = useFeedContext("FeedArticle");
  const [element, setElement] = useState<HTMLElement | null>(null);
  const { registerArticle } = feed;

  useLayoutEffect(() => {
    if (!element) return;
    return registerArticle(element);
  }, [element, registerArticle]);

  const position = element ? feed.articles.indexOf(element) : -1;
  const setSize = feed.total ?? feed.articles.length;

  return (
    <article
      {...props}
      ref={composeRefs(ref, setElement)}
      tabIndex={-1}
      aria-posinset={position >= 0 ? position + 1 : undefined}
      aria-setsize={position >= 0 ? setSize : undefined}
    />
  );
}
