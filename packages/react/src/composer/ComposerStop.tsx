import { Button, type ButtonProps } from "../button/Button.js";
import { useComposerContext } from "./composer-shared.js";

export type ComposerStopProps = Omit<ButtonProps, "command" | "commandfor" | "pending">;

/** Stops the response being generated. It renders nothing unless the Composer is `generating`. */
export function ComposerStop({ onClick, ...props }: ComposerStopProps) {
  const composer = useComposerContext("ComposerStop");
  if (!composer.generating) return null;

  return (
    <Button
      data-slot="composer-stop"
      type="button"
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) composer.stop();
      }}
    />
  );
}
