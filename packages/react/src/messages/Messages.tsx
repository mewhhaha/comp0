import { type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { BusyContext, useBusyRegion } from "../internal/busy.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type MessagesProps = ComponentProps<"div"> &
  AsProp & {
    /** Defers live-region processing while a message is being assembled. */
    busy?: boolean | undefined;
  };

/**
 * A chronological message log. Give it an accessible name and append new,
 * complete messages at the end so its implicit polite live region stays useful.
 */
export function Messages({ as, busy, ...props }: MessagesProps) {
  const resolvedBusy = useBusyRegion(busy);

  const Part = partElement(as, "div");
  return (
    <BusyContext value={resolvedBusy}>
      <Part
        {...props}
        role="log"
        aria-busy={Boolean(busy) || undefined}
        data-busy={dataAttr(resolvedBusy)}
      />
    </BusyContext>
  );
}
