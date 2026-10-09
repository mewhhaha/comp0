/**
 * Everything a model writes is untrusted. These helpers turn model-provided values into values
 * that are safe to put in the DOM; facades never pass a model value through unchecked.
 */

import { isValidElement, type ReactNode } from "react";

/**
 * The most entries any list renders. A model that writes thousands of rows or options would
 * otherwise lock the page; entries beyond the limit are left out.
 */
export const maxItems = 500;

const linkSchemes = new Set(["http:", "https:", "mailto:", "tel:"]);
const imageSchemes = new Set(["http:", "https:"]);
const schemePattern = /^([a-zA-Z][a-zA-Z0-9+.-]*:)/;
// Whitespace and control characters hide schemes from checks ("java\tscript:"); the backslash is
// read as a slash by browsers ("/\evil.example" is protocol-relative).
// oxlint-disable-next-line no-control-regex -- matching control characters is the point.
const unsafeCharacters = /[\u0000- \u007f\\]/;

function checkUrl(value: unknown, schemes: ReadonlySet<string>, allowFragment: boolean) {
  if (typeof value !== "string") return undefined;
  const url = value.trim();
  if (url === "" || unsafeCharacters.test(url)) return undefined;
  if (url.startsWith("//")) return undefined;
  const scheme = schemePattern.exec(url)?.[1]?.toLowerCase();
  if (scheme !== undefined) return schemes.has(scheme) ? url : undefined;
  if (url.startsWith("#")) return allowFragment ? url : undefined;
  // A colon before the first slash, query, or fragment would have matched a scheme above.
  return url;
}

/**
 * A link target a model may use: absolute http(s), mailto, tel, a path, or a fragment.
 * Returns the trimmed URL, or `undefined` for anything else (`javascript:`, `data:`, `vbscript:`,
 * `blob:`, `file:`, protocol-relative URLs, and URLs hiding a scheme behind whitespace).
 */
export function safeHref(value: unknown): string | undefined {
  return checkUrl(value, linkSchemes, true);
}

/** An image source a model may use: absolute http(s) or a path; never `data:` or `blob:`. */
export function safeImageSrc(value: unknown): string | undefined {
  return checkUrl(value, imageSchemes, false);
}

/** Whether a link target passes {@link safeHref}. */
export function isSafeHref(value: unknown): boolean {
  return safeHref(value) !== undefined;
}

/** A string, or the empty string for anything else (including values still streaming in). */
export function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** A finite number, or `undefined`. */
export function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/**
 * The largest magnitude plotted or summed. Beyond it, sums overflow to Infinity and chart
 * geometry becomes NaN, so such values are treated as data the model got wrong.
 */
export const maxDataMagnitude = 1e12;

/** A finite number small enough to plot, or `undefined`. */
export function asDatum(value: unknown): number | undefined {
  const number = asNumber(value);
  return number !== undefined && Math.abs(number) <= maxDataMagnitude ? number : undefined;
}

/**
 * Rendered nested components, or nothing. Parts that arrive as plain objects carry whatever the
 * model wrote in their nested slots, and an object is not a valid React child.
 */
export function asNode(value: unknown): ReactNode {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (isValidElement(value)) return value;
  if (Array.isArray(value)) return value.map((item) => asNode(item));
  return null;
}

/** A boolean, or `undefined`. */
export function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

/** The value when it is one of the allowed tokens, else `undefined`. */
export function asToken<const TAllowed extends readonly string[]>(
  value: unknown,
  allowed: TAllowed,
): TAllowed[number] | undefined {
  return typeof value === "string" && allowed.includes(value) ? value : undefined;
}

/** The array's non-empty strings (numbers are stringified), skipping anything half-streamed. */
export function asStrings(value: unknown, limit: number = maxItems): string[] {
  if (!Array.isArray(value)) return [];
  const strings: string[] = [];
  for (const item of value) {
    if (strings.length >= limit) break;
    if (typeof item === "string") strings.push(item);
    else if (typeof item === "number" && Number.isFinite(item)) strings.push(String(item));
  }
  return strings;
}

/** The array's plain-object entries, skipping nulls and unresolved references. */
export function asRecords(value: unknown, limit: number = maxItems): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  const records: Record<string, unknown>[] = [];
  for (const item of value) {
    if (records.length >= limit) break;
    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      records.push(item as Record<string, unknown>);
    }
  }
  return records;
}

/** Keeps the first entry for each key; collections reject duplicate values. */
export function uniqueBy<TItem>(items: readonly TItem[], key: (item: TItem) => string): TItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = key(item);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** A cell value as display text. */
export function asCell(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "";
}

/** A computed value as display text: numbers are rounded for reading, anything else is empty. */
export function asResult(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "";
}
