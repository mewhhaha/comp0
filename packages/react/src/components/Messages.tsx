import { type HTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";

export type MessagesProps = HTMLAttributes<HTMLDivElement> & {
  /** Defers live-region processing while a message is being assembled. */
  busy?: boolean | undefined;
};

/**
 * A chronological message log. Give it an accessible name and append new,
 * complete messages at the end so its implicit polite live region stays useful.
 */
export function Messages({ busy, ref, ...props }: MessagesProps & RefProp<HTMLDivElement>) {
  const resolvedBusy = Boolean(busy);

  return (
    <div
      {...props}
      ref={ref}
      role="log"
      aria-busy={resolvedBusy || undefined}
      data-busy={dataAttr(resolvedBusy)}
    />
  );
}
