import type { RefObject } from "react";
import { createRequiredContext } from "../internal/context.js";

export type ComposerContextValue = {
  value: string;
  setValue: (value: string) => void;
  generating: boolean;
  disabled: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  /** Submits the form through `requestSubmit`, so validation and `onSubmit` run. */
  submit: () => void;
  stop: () => void;
};

export const [ComposerContext, useComposerContext] =
  createRequiredContext<ComposerContextValue>("Composer");
