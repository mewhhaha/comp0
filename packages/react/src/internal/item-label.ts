import { type ReactNode } from "react";

/**
 * The text a collection item is known by: an explicit textValue, plain string
 * children, the rendered element's text, an aria-label, then the value.
 */
export function resolveItemLabel(options: {
  textValue: string | undefined;
  children: ReactNode;
  element: HTMLElement | null | undefined;
  ariaLabel: string | undefined;
  fallback: string;
}) {
  if (options.textValue) return options.textValue;
  if (typeof options.children === "string") return options.children;
  const crawled = options.element?.textContent?.replace(/\s+/g, " ").trim();
  if (crawled) return crawled;
  return options.ariaLabel ?? options.fallback;
}
