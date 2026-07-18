import { useComposedRefs } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { Input, type InputProps } from "./Input.js";
import { useTagPickerContext } from "./tag-picker-shared.js";
import { writingDirection } from "./writing-direction.js";

export type TagPickerInputProps = Omit<InputProps, "defaultValue" | "value">;

export function TagPickerInput({
  disabled,
  onKeyDown,
  ref,
  ...props
}: TagPickerInputProps & RefProp<HTMLInputElement>) {
  const tagPicker = useTagPickerContext("TagPickerInput");
  const composedRef = useComposedRefs(ref, tagPicker.inputRef);

  return (
    <Input
      {...props}
      ref={composedRef}
      disabled={Boolean(disabled || tagPicker.disabled)}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.nativeEvent.isComposing) return;
        const previousTagKey =
          writingDirection(event.currentTarget) === "rtl" ? "ArrowRight" : "ArrowLeft";
        if (event.key !== "Backspace" && event.key !== previousTagKey) return;
        if (event.currentTarget.value || event.currentTarget.selectionStart !== 0) return;
        const root = event.currentTarget.closest<HTMLElement>("[data-slot='tag-picker']");
        const tags = [
          ...(root?.querySelectorAll<HTMLElement>("[role='grid'] > [role='row']") ?? []),
        ].filter(
          (tag) =>
            tag.getAttribute("aria-disabled") !== "true" &&
            tag.closest("[data-slot='tag-picker']") === root,
        );
        const lastTag = tags.at(-1);
        if (!lastTag) return;
        event.preventDefault();
        lastTag.focus();
      }}
    />
  );
}
