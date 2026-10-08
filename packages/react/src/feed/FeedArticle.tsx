import { useId, useLayoutEffect, useState, type ComponentProps } from "react";
import { composeRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useFeedContext } from "./feed-shared.js";

export type FeedArticleProps = ComponentProps<"article"> & AsProp;

/**
 * One article in the feed: a native article element that can receive focus
 * (tabIndex -1) so PageDown and PageUp can walk the list. Articles register
 * in document order and announce their aria-posinset and aria-setsize
 * automatically. Give each article an aria-labelledby pointing at its title
 * so screen readers hear what it is about.
 */
export function FeedArticle({ as, ref, ...props }: FeedArticleProps) {
  const feed = useFeedContext("FeedArticle");
  const key = useId();
  const [element, setElement] = useState<HTMLElement | null>(null);
  const { collection } = feed;

  useLayoutEffect(() => {
    if (!element) return;
    collection.register({ key, textValue: "", element });
    return () => {
      collection.unregister(key, element);
    };
  }, [collection, element, key]);

  const position = feed.order.indexOf(key);
  const setSize = feed.total ?? feed.order.length;

  const Part = partElement(as, "article");
  return (
    <Part
      {...props}
      ref={composeRefs(ref, setElement)}
      // In the tab sequence per the APG feed pattern, so keyboard users can
      // reach articles and the feed's PageUp/PageDown navigation.
      tabIndex={props.tabIndex ?? 0}
      aria-posinset={props["aria-posinset"] ?? (position >= 0 ? position + 1 : undefined)}
      aria-setsize={props["aria-setsize"] ?? (position >= 0 ? setSize : undefined)}
    />
  );
}
