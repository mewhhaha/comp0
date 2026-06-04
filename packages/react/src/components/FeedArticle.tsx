import { useCallback, useContext } from "react";
import { composeRefs } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { FeedContext } from "./feed-shared.js";
import { type FeedArticleProps } from "./feed-shared.js";
export type { FeedArticleProps } from "./feed-shared.js";

export function FeedArticle({ id, ref, ...props }: FeedArticleProps & RefProp<HTMLElement>) {
  const feed = useContext(FeedContext);
  const registerArticle = feed?.registerArticle;
  const position = feed?.articlePosition(id);
  const articleRef = useCallback(
    (element: HTMLElement | null) => {
      registerArticle?.(id, element);
      composeRefs(ref)(element);
    },
    [id, ref, registerArticle],
  );

  return (
    <article
      {...props}
      ref={articleRef}
      id={id}
      role="article"
      tabIndex={props.tabIndex ?? 0}
      aria-posinset={position && position.index >= 0 ? position.index + 1 : undefined}
      aria-setsize={position?.count || undefined}
      data-slot={dataSlot(props, "feed-article")}
    />
  );
}
