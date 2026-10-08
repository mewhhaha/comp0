import { useLayoutEffect } from "react";
import { resolveAutocompleteItemText } from "../autocomplete/autocomplete-shared.js";
import { ListBoxOption, type ListBoxOptionProps } from "../list-box/ListBoxOption.js";
import { useTagPickerContext } from "./tag-picker-shared.js";

export type TagPickerOptionProps = ListBoxOptionProps;

export function TagPickerOption({
  value,
  textValue,
  children,
  disabled,
  onClick,
  ...props
}: TagPickerOptionProps) {
  const tagPicker = useTagPickerContext("TagPickerOption");
  const renderedText = resolveAutocompleteItemText(children);
  const label = textValue ?? renderedText.text ?? props["aria-label"] ?? value;

  const { registerOptionLabel } = tagPicker;
  useLayoutEffect(() => {
    registerOptionLabel(value, label);
  }, [label, registerOptionLabel, value]);

  if (tagPicker.value.includes(value)) return null;

  return (
    <ListBoxOption
      {...props}
      value={value}
      textValue={textValue}
      disabled={Boolean(disabled || tagPicker.disabled)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) tagPicker.addOption(value, label);
      }}
    >
      {children}
    </ListBoxOption>
  );
}
