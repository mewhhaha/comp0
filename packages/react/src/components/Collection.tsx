import { type ReactNode } from "react";
import { type CollectionProps } from "./collection-shared.js";
export type { CollectionProps } from "./collection-shared.js";
export function Collection<TItem>({ items, children }: CollectionProps<TItem>) {
  if (!items) return <>{children as ReactNode}</>;
  return (
    <>{Array.from(items, (item) => (typeof children === "function" ? children(item) : children))}</>
  );
}
