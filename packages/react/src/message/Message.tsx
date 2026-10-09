import { type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { BusyContext, useBusy } from "../internal/busy.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type MessageStatus = "streaming" | "complete" | "error";

export type MessageProps = ComponentProps<"article"> &
  AsProp & {
    /** Who wrote the message; styling hook only, exposed as `data-from`. */
    from?: "user" | "assistant" | "system" | undefined;
    /**
     * `streaming` marks the message busy while its content is still arriving,
     * `error` marks a response that failed or was cut off. Defaults to `complete`.
     */
    status?: MessageStatus | undefined;
  };

/**
 * One entry in a Messages log. While `status` is `streaming` the message is
 * `aria-busy` and its content is busy for nested comp0 parts, so they hold back
 * data warnings and focus moves until the message completes. Set `busy` on the
 * enclosing Messages as well so the log waits before announcing it.
 */
export function Message({ as, from, status = "complete", ...props }: MessageProps) {
  const parentBusy = useBusy();
  const streaming = status === "streaming";

  const Part = partElement(as, "article");
  return (
    <BusyContext value={streaming || parentBusy}>
      <Part
        data-slot="message"
        {...props}
        aria-busy={streaming || undefined}
        data-busy={dataAttr(streaming)}
        data-from={from}
        data-status={status}
      />
    </BusyContext>
  );
}

export type MessageAuthorProps = ComponentProps<"span"> & AsProp;

/** The visible name of the message's author. Keep it visible so the speaker is never implied by layout alone. */
export function MessageAuthor({ as, ...props }: MessageAuthorProps) {
  const Part = partElement(as, "span");
  return <Part data-slot="message-author" {...props} />;
}

export type MessageTimeProps = ComponentProps<"time"> & AsProp;

/** When the message was sent; pass a machine-readable `dateTime`. */
export function MessageTime({ as, ...props }: MessageTimeProps) {
  const Part = partElement(as, "time");
  return <Part data-slot="message-time" {...props} />;
}

export type MessageContentProps = ComponentProps<"div"> & AsProp;

/** The body of the message. */
export function MessageContent({ as, ...props }: MessageContentProps) {
  const Part = partElement(as, "div");
  return <Part data-slot="message-content" {...props} />;
}
