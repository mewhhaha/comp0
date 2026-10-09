import { Button, type ButtonProps } from "../button/Button.js";
import { useComposerContext } from "./composer-shared.js";

export type ComposerSendProps = Omit<ButtonProps, "command" | "commandfor" | "pending">;

/** Submits the draft. It is disabled while the draft is empty or a response is generating. */
export function ComposerSend({ disabled, ...props }: ComposerSendProps) {
  const composer = useComposerContext("ComposerSend");
  const blocked = Boolean(disabled) || composer.disabled || composer.generating;

  return (
    <Button
      data-slot="composer-send"
      type="submit"
      {...props}
      disabled={blocked || composer.value.trim() === ""}
    />
  );
}
