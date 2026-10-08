import { type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
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
  const resolvedBusy = Boolean(busy);

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      role="log"
      aria-busy={resolvedBusy || undefined}
      data-busy={dataAttr(resolvedBusy)}
    />
  );
}
