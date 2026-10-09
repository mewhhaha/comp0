import { useLayoutEffect, useState, type ComponentProps } from "react";
import { composeRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { sourceId, useCitationsContext } from "./citation-shared.js";

export type SourceProps = Omit<ComponentProps<"li">, "id" | "title"> &
  AsProp & {
    /** Identity that pairs this source with the Citation parts that point at it. */
    value: string;
    /** The name of the source, shown in the list and announced by every citation of it. */
    title: string;
    /** Where the source lives; the title links there when given. */
    href?: string | undefined;
  };

/**
 * One entry in the source list. The title links to `href` when there is one;
 * children add a publisher, date, or excerpt after it.
 */
export function Source({ as, children, href, ref, title, value, ...props }: SourceProps) {
  const { baseId, collection, sources } = useCitationsContext("Source");
  const [element, setElement] = useState<HTMLLIElement | null>(null);
  const id = sourceId(baseId, value);

  useLayoutEffect(() => {
    if (!element) return;
    collection.register({ key: value, id, textValue: title, element });
    return () => {
      collection.unregister(value, element);
    };
  }, [collection, element, id, title, value]);

  const position = sources.findIndex((source) => source.value === value);
  let number: number | undefined;
  if (position >= 0) number = position + 1;

  let heading = <span data-slot="source-title">{title}</span>;
  if (href) {
    heading = (
      <a data-slot="source-title" href={href}>
        {title}
      </a>
    );
  }

  const Part = partElement(as, "li");
  return (
    <Part
      data-slot="source"
      {...props}
      ref={composeRefs(ref, setElement)}
      id={id}
      data-value={value}
      data-number={number}
    >
      {heading}
      {children}
    </Part>
  );
}
