import { type ChangeEvent, type ComponentProps, type KeyboardEvent } from "react";
import { dataAttr, useCollectionNavigation, useComposedRefs } from "@comp0/core";
import { describedBy, useFieldContext } from "../field/field-shared.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { triggerAnchorStyle } from "../internal/overlay/index.js";
import { useComboboxContext } from "./combobox-shared.js";

export type ComboboxInputProps = Omit<ComponentProps<"input">, "value" | "defaultValue"> & AsProp;

export function ComboboxInput({
  as,
  onChange,
  onKeyDown,
  ref,
  style,
  ...props
}: ComboboxInputProps) {
  const combobox = useComboboxContext("ComboboxInput");
  const { collection, popover } = combobox;
  const field = useFieldContext();
  const navigate = useCollectionNavigation();
  const composedRef = useComposedRefs(ref, popover.setTriggerElement, combobox.inputRef);
  const disabled = Boolean(props.disabled || combobox.disabled);
  const required = Boolean(props.required || combobox.required);
  const invalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true" || Boolean(combobox.invalid);
  const description = describedBy(field, props["aria-describedby"]);
  let activeDescendant: string | undefined;
  if (popover.open) {
    activeDescendant =
      (props["aria-activedescendant"] ?? collection.get(combobox.activeKey)?.id) || undefined;
  }
  const Part = partElement(as, "input");
  return (
    <Part
      {...props}
      ref={composedRef}
      id={props.id ?? combobox.inputId}
      role={props.role ?? "combobox"}
      style={triggerAnchorStyle(combobox.inputId, style)}
      value={combobox.displayValue}
      form={props.form ?? combobox.form}
      disabled={disabled}
      required={required}
      aria-activedescendant={activeDescendant}
      aria-autocomplete={props["aria-autocomplete"] ?? "list"}
      aria-controls={props["aria-controls"] ?? combobox.listBoxId}
      aria-describedby={description || undefined}
      aria-expanded={popover.open}
      aria-haspopup={props["aria-haspopup"] ?? "listbox"}
      aria-invalid={props["aria-invalid"] ?? (invalid || undefined)}
      data-disabled={dataAttr(disabled)}
      data-invalid={dataAttr(invalid)}
      data-open={dataAttr(popover.open)}
      data-required={dataAttr(required)}
      data-value={combobox.displayValue || undefined}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        onChange?.(event);
        if (event.defaultPrevented) return;
        combobox.setActiveKey("");
        combobox.setSelectedKey("");
        combobox.setInputValue(event.currentTarget.value);
        popover.setOpen(true);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "Enter") {
          const active = collection.get(combobox.activeKey);
          if (!active || active.disabled) return;
          event.preventDefault();
          combobox.setSelectedKey(active.key);
          popover.setOpen(false);
          return;
        }
        if (event.key === "Escape") {
          if (!popover.open) return;
          event.preventDefault();
          popover.setOpen(false);
          return;
        }
        // Printable keys edit the text, so typeahead stays off.
        const next = navigate(event.key, collection.items(), combobox.activeKey || undefined, {
          orientation: "vertical",
          typeahead: false,
        });
        if (!next) return;
        event.preventDefault();
        popover.setOpen(true);
        combobox.setActiveKey(next);
        collection.get(next)?.element?.scrollIntoView?.({ block: "nearest" });
      }}
    />
  );
}
