import { useLayoutEffect } from "react";
import { type RefProp } from "../shared.js";
import { resolveAutocompleteItemText } from "./autocomplete-shared.js";
import { ListBoxItem, type ListBoxItemProps } from "./ListBoxItem.js";
import { useTagPickerContext } from "./tag-picker-shared.js";

export type TagPickerOptionProps = Omit<ListBoxItemProps, "value"> & {
  value: string;
};

export function TagPickerOption({
  value,
  textValue,
  children,
  disabled,
  onClick,
  ref,
  ...props
}: TagPickerOptionProps & RefProp<HTMLDivElement>) {
  const tagPicker = useTagPickerContext("TagPickerOption");
  const renderedText = resolveAutocompleteItemText(children);
  const label = textValue ?? renderedText.text ?? props["aria-label"] ?? value;

  useLayoutEffect(() => {
    tagPicker.registerOptionLabel(value, label);
  }, [label, tagPicker, value]);

  if (tagPicker.value.includes(value)) return null;

  return (
    <ListBoxItem
      {...props}
      ref={ref}
      value={value}
      textValue={textValue}
      disabled={Boolean(disabled || tagPicker.disabled)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) tagPicker.addOption(value, label);
      }}
    >
      {children}
    </ListBoxItem>
  );
}
