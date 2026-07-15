import { useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { Autocomplete, type AutocompleteProps } from "./Autocomplete.js";
import { useFormControlState, useFormReset } from "./form-control-state.js";
import { TagGroup } from "./TagGroup.js";
import { TagPickerContext, type TagPickerState } from "./tag-picker-shared.js";
import { VisuallyHidden } from "./VisuallyHidden.js";
import { type RefProp } from "../shared.js";
export type { TagPickerState } from "./tag-picker-shared.js";

type TagPickerChildren = ReactNode | ((state: TagPickerState) => ReactNode);

export type TagPickerProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "defaultValue" | "onChange"
> & {
  children?: TagPickerChildren | undefined;
  value?: string[] | undefined;
  defaultValue?: string[] | undefined;
  onChange?: ((value: string[]) => void) | undefined;
  inputValue?: string | undefined;
  defaultInputValue?: string | undefined;
  onInputChange?: ((inputValue: string) => void) | undefined;
  filter?: AutocompleteProps["filter"];
  disableAutoFocusFirst?: boolean | undefined;
  disableVirtualFocus?: boolean | undefined;
  name?: string | undefined;
  form?: string | undefined;
  disabled?: boolean | undefined;
};

function assertUniqueValues(values: string[], prop: "value" | "defaultValue") {
  const encountered = new Set<string>();
  for (const value of values) {
    if (encountered.has(value)) {
      throw new Error(
        `TagPicker ${prop} contains duplicate value "${value}". Tag values must be unique.`,
      );
    }
    encountered.add(value);
  }
}

export function TagPicker({
  children,
  value,
  defaultValue = [],
  onChange,
  inputValue,
  defaultInputValue = "",
  onInputChange,
  filter,
  disableAutoFocusFirst,
  disableVirtualFocus,
  name,
  form,
  disabled,
  ref,
  ...props
}: TagPickerProps & RefProp<HTMLDivElement>) {
  if (value !== undefined) assertUniqueValues(value, "value");
  assertUniqueValues(defaultValue, "defaultValue");
  const rootRef = useRef<HTMLDivElement>(null);
  const resetControlRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Child options register labels without rerendering the picker as filtering
  // mounts and unmounts them; event callbacks read the latest registry value.
  const optionLabels = useRef(new Map<string, string>());
  const [announcement, setAnnouncement] = useState("");
  const [finalRemovalRequest, setFinalRemovalRequest] = useState("");
  const selectedState = useFormControlState({ value, defaultValue, onChange });
  const queryState = useFormControlState({
    value: inputValue,
    defaultValue: defaultInputValue,
    onChange: onInputChange,
  });
  const selectedValues = selectedState.value;
  const resolvedDisabled = Boolean(disabled);
  const composedRef = useComposedRefs(rootRef, ref);

  const labelFor = (tagValue: string) => optionLabels.current.get(tagValue) ?? tagValue;

  const addOption = (tagValue: string, label: string) => {
    if (resolvedDisabled) return;
    if (selectedValues.includes(tagValue)) {
      setAnnouncement(`${label} is already selected.`);
      return;
    }
    optionLabels.current.set(tagValue, label);
    selectedState.setValue([...selectedValues, tagValue]);
    queryState.setValue("");
    setAnnouncement(`Added ${label}.`);
    inputRef.current?.focus();
  };

  const add = (tagValue: string) => addOption(tagValue, labelFor(tagValue));

  const remove = (tagValue: string) => {
    if (resolvedDisabled || !selectedValues.includes(tagValue)) return;
    if (selectedValues.length === 1) setFinalRemovalRequest(tagValue);
    selectedState.setValue(selectedValues.filter((value) => value !== tagValue));
    setAnnouncement(`Removed ${labelFor(tagValue)}.`);
  };

  useLayoutEffect(() => {
    if (!finalRemovalRequest) return;
    if (selectedValues.includes(finalRemovalRequest)) {
      setFinalRemovalRequest("");
      return;
    }
    if (selectedValues.length === 0) inputRef.current?.focus();
    setFinalRemovalRequest("");
  }, [finalRemovalRequest, selectedValues]);

  useFormReset({
    controlRef: resetControlRef,
    controlled: selectedState.controlled,
    form,
    resetValue: selectedState.resetValue,
    restoreValue: selectedState.restoreValue,
    readValue: () =>
      [
        ...(rootRef.current?.querySelectorAll<HTMLInputElement>("input[data-tag-picker-value]") ??
          []),
      ]
        .filter((input) => input.parentElement === rootRef.current)
        .map((input) => input.value),
  });
  useFormReset({
    controlRef: resetControlRef,
    controlled: queryState.controlled,
    form,
    resetValue: queryState.resetValue,
    restoreValue: queryState.restoreValue,
    readValue: () => inputRef.current?.value ?? "",
  });

  const state = {
    value: selectedValues,
    inputValue: queryState.value,
    add,
    remove,
  };
  const content = typeof children === "function" ? children(state) : children;

  return (
    <TagGroup onRemove={remove}>
      <Autocomplete
        inputValue={queryState.value}
        onInputChange={queryState.setValue}
        filter={filter}
        disableAutoFocusFirst={disableAutoFocusFirst}
        disableVirtualFocus={disableVirtualFocus}
      >
        <TagPickerContext
          value={{
            ...state,
            disabled: resolvedDisabled,
            inputRef,
            addOption,
            registerOptionLabel(tagValue, label) {
              optionLabels.current.set(tagValue, label);
            },
          }}
        >
          <div
            {...props}
            ref={composedRef}
            aria-disabled={props["aria-disabled"] ?? (resolvedDisabled || undefined)}
            data-disabled={dataAttr(resolvedDisabled)}
            data-empty={dataAttr(selectedValues.length === 0)}
            data-slot="tag-picker"
          >
            <input ref={resetControlRef} type="hidden" form={form} disabled={resolvedDisabled} />
            {name &&
              selectedValues.map((tagValue) => (
                <input
                  key={tagValue}
                  type="hidden"
                  data-tag-picker-value=""
                  form={form}
                  name={name}
                  value={tagValue}
                  disabled={resolvedDisabled}
                />
              ))}
            {content}
            <VisuallyHidden aria-live="polite" aria-atomic="true">
              {announcement}
            </VisuallyHidden>
          </div>
        </TagPickerContext>
      </Autocomplete>
    </TagGroup>
  );
}
