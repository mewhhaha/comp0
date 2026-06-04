import { createContext, type HTMLAttributes } from "react";

export interface FeedArticleRecord {
  key: string;
  element: HTMLElement | null;
}

export interface FeedContextValue {
  version: number;
  registerArticle: (key: string, element: HTMLElement | null) => void;
  articles: () => FeedArticleRecord[];
  articlePosition: (key: string) => { index: number; count: number };
}

export const FeedContext = createContext<FeedContextValue | null>(null);

export type FeedProps = HTMLAttributes<HTMLDivElement> & {
  busy?: boolean | undefined;
};

export type FeedArticleProps = HTMLAttributes<HTMLElement> & {
  id: string;
};

export function sortArticles(articles: FeedArticleRecord[]) {
  return [...articles].sort((a, b) => {
    if (!a.element || !b.element || a.element === b.element) return 0;
    if (a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_PRECEDING) {
      return 1;
    }
    return -1;
  });
}
