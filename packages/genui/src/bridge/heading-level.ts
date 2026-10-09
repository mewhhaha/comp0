import { createContext, use } from "react";

/**
 * The heading level the next card or accordion section should use. A card titles itself at this
 * level and gives its content the next one, so nested cards keep a valid outline.
 */
export const HeadingLevelContext = createContext(2);

export function useHeadingLevel(): 1 | 2 | 3 | 4 | 5 | 6 {
  const level = Math.round(use(HeadingLevelContext));
  return Math.min(6, Math.max(1, level)) as 1 | 2 | 3 | 4 | 5 | 6;
}
