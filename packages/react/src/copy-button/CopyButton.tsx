import { useEffect, useState, type ElementType } from "react";
import { dataAttr } from "@comp0/core";
import { Button, type ButtonProps } from "../button/Button.js";
import { Status } from "../status/Status.js";
import { VisuallyHidden } from "../visually-hidden/VisuallyHidden.js";

/** Resolves to the failure, or undefined once the clipboard accepted the text. */
async function writeToClipboard(value: string): Promise<unknown> {
  try {
    if (!navigator.clipboard) return new Error("The Clipboard API is unavailable.");
    await navigator.clipboard.writeText(value);
    return undefined;
  } catch (error) {
    return error ?? new Error("The clipboard write failed.");
  }
}

type CopyState = { phase: "idle" | "copied" | "failed"; count: number };

export type CopyButtonProps<TElement extends ElementType = "button"> = Omit<
  ButtonProps<TElement>,
  "value" | "onCopied" | "onCopyError" | "command" | "commandfor" | "pending"
> & {
  /** The text written to the clipboard. */
  value: string;
  /** Announced politely after a successful copy. */
  copiedText?: string | undefined;
  /** Announced politely when the clipboard refuses or is unavailable. */
  failedText?: string | undefined;
  /** How long, in milliseconds, `data-copied` and `data-failed` stay set. */
  resetDelay?: number | undefined;
  /** Called with the copied text after the clipboard accepted it. Not the native `onCopy` clipboard event. */
  onCopied?: ((value: string) => void) | undefined;
  /** Called with the rejection when the clipboard write fails. */
  onCopyError?: ((error: unknown) => void) | undefined;
};

/**
 * Copies `value` with the async Clipboard API. The button keeps one stable
 * accessible name; the outcome is announced through a visually hidden polite
 * status next to it, and mirrored on the button as `data-copied` / `data-failed`
 * for a transient visual change.
 */
export function CopyButton<TElement extends ElementType = "button">({
  value,
  copiedText = "Copied",
  failedText = "Copy failed",
  resetDelay = 2000,
  onCopied,
  onCopyError,
  onClick,
  ...props
}: CopyButtonProps<TElement>) {
  const [state, setState] = useState<CopyState>({ phase: "idle", count: 0 });

  useEffect(() => {
    if (state.phase === "idle") return;
    const timer = setTimeout(
      () => setState((current) => ({ ...current, phase: "idle" })),
      resetDelay,
    );
    return () => clearTimeout(timer);
  }, [state, resetDelay]);

  async function copy() {
    const error = await writeToClipboard(value);
    if (error !== undefined) {
      setState((current) => ({ phase: "failed", count: current.count + 1 }));
      onCopyError?.(error);
      return;
    }
    setState((current) => ({ phase: "copied", count: current.count + 1 }));
    onCopied?.(value);
  }

  let message = "";
  if (state.phase === "copied") message = copiedText;
  if (state.phase === "failed") message = failedText;

  return (
    <>
      <Button
        data-slot="copy-button"
        {...(props as ButtonProps)}
        data-copied={dataAttr(state.phase === "copied")}
        data-failed={dataAttr(state.phase === "failed")}
        onClick={(event) => {
          (onClick as ButtonProps["onClick"])?.(event);
          if (!event.defaultPrevented) void copy();
        }}
      />
      <VisuallyHidden as={Status}>
        {/* A new node per copy, so repeating the same outcome is announced again. */}
        <span key={state.count}>{message}</span>
      </VisuallyHidden>
    </>
  );
}
