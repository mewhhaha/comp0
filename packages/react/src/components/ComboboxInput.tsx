import { type ChangeEventHandler, type InputHTMLAttributes } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { describedBy, useFieldContext } from "../field.js";
import { useComboBoxRootContext, type RefProp } from "../shared.js";
import { triggerAnchorStyle, usePopoverContext } from "./overlay-shared.js";

export type ComboboxInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue"
> & {
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

export function ComboboxInput({
  onChange,
  onKeyDown,
  ref,
  style,
  ...props
}: ComboboxInputProps & RefProp<HTMLInputElement>) {
  const combobox = useComboBoxRootContext();
  const popover = usePopoverContext();
  const field = useFieldContext();
  if (!combobox || !popover) throw new Error("ComboboxInput must be rendered inside Combobox.");
  const disabled = Boolean(props.disabled || combobox.disabled);
  const required = Boolean(props.required || combobox.required);
  const invalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true" || Boolean(combobox.invalid);
  const description = describedBy(field, props["aria-describedby"]);
  let activeDescendant: string | undefined;
  if (popover.open) {
    activeDescendant = (props["aria-activedescendant"] ?? combobox.activeId) || undefined;
  }
  return (
    <input
      {...props}
      ref={composeRefs(ref, popover.setTriggerElement)}
      id={props.id ?? combobox.inputId}
      role={props.role ?? "combobox"}
      style={triggerAnchorStyle(combobox.inputId, style)}
      value={combobox.displayValue}
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
      onChange={(event) => {
        onChange?.(event);
        if (!event.defaultPrevented) {
          combobox.setActiveId("");
          combobox.setActiveKey("");
          combobox.setSelectedKey("");
          combobox.setInputValue(event.currentTarget.value);
          popover.setOpen(true);
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        const options = [
          ...(document
            .getElementById(combobox.listBoxId)
            ?.querySelectorAll<HTMLElement>("[role='option']") ?? []),
        ].filter((option) => option.getAttribute("aria-disabled") !== "true");
        const index = options.findIndex((option) => option.id === combobox.activeId);
        const setActive = (next: HTMLElement | undefined) => {
          if (!next) return;
          event.preventDefault();
          popover.setOpen(true);
          combobox.setActiveId(next.id);
          combobox.setActiveKey(next.dataset.value ?? next.id);
          next.scrollIntoView?.({ block: "nearest" });
        };
        if (event.key === "ArrowDown")
          setActive(options[index < 0 ? 0 : Math.min(index + 1, options.length - 1)]);
        else if (event.key === "ArrowUp")
          setActive(options[index < 0 ? options.length - 1 : Math.max(index - 1, 0)]);
        else if (event.key === "Home") setActive(options[0]);
        else if (event.key === "End") setActive(options.at(-1));
        else if (event.key === "Enter" && combobox.activeId) {
          const option = options.find((item) => item.id === combobox.activeId);
          if (option) {
            event.preventDefault();
            combobox.setSelectedKey(option.dataset.value ?? option.id);
            popover.setOpen(false);
          }
        } else if (event.key === "Escape" && popover.open) {
          event.preventDefault();
          popover.setOpen(false);
        }
      }}
    />
  );
}
