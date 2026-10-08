import { useComposedRefs } from "@comp0/core";
import { Input, type InputProps } from "../text-field/Input.js";
import { useTagGroupContext } from "../tag-group/tag-shared.js";
import { useTagPickerContext } from "./tag-picker-shared.js";
import { writingDirection } from "../internal/writing-direction.js";

export type TagPickerInputProps = Omit<InputProps, "defaultValue" | "value">;

export function TagPickerInput({ disabled, onKeyDown, ref, ...props }: TagPickerInputProps) {
  const tagPicker = useTagPickerContext("TagPickerInput");
  const tagGroup = useTagGroupContext("TagPickerInput");
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
        const lastTag = tagGroup.collection.enabledItems().at(-1);
        if (!lastTag?.element) return;
        event.preventDefault();
        lastTag.element.focus();
      }}
    />
  );
}
