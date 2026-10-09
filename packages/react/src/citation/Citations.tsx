import { useId, useLayoutEffect, useState, type ReactNode } from "react";
import { useCollection } from "@comp0/core";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { CitationsContext, type CitationSource } from "./citation-shared.js";

export type CitationsProps = RootProps<{
  children?: ReactNode | undefined;
}>;

/**
 * Connects inline Citation parts to the Sources list, wherever each sits in
 * the answer. Citations are numbered by their source's position in the list.
 */
export function Citations({ as, children, ...props }: CitationsProps) {
  const baseId = useId();
  const collection = useCollection();
  const [sources, setSources] = useState<CitationSource[]>([]);

  // Sources register in their own layout effects, which run before this one, so the order is
  // read once here and then kept current by the collection's change notifications.
  useLayoutEffect(() => {
    const syncSources = () => {
      setSources((previous) => {
        const next = collection.items().map((item) => ({ value: item.key, title: item.textValue }));
        if (
          next.length === previous.length &&
          next.every(
            (entry, index) =>
              entry.value === previous[index]?.value && entry.title === previous[index]?.title,
          )
        ) {
          return previous;
        }
        return next;
      });
    };
    syncSources();
    return collection.subscribe(syncSources);
  }, [collection]);

  const Root = rootElement(as);
  return (
    <CitationsContext value={{ baseId, sources, collection }}>
      <Root data-slot="citations" {...props}>
        {children}
      </Root>
    </CitationsContext>
  );
}
