import { useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { dataAttr, useComposedRefs, useControllableState } from "@comp0/core";
import { Autocomplete, type AutocompleteProps } from "../autocomplete/Autocomplete.js";
import { useFormReset } from "../internal/form-control-state.js";
import { FormValue } from "../internal/form-value.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { TagGroup } from "../tag-group/TagGroup.js";
import { TagPickerContext } from "./tag-picker-shared.js";
import { VisuallyHidden } from "../visually-hidden/VisuallyHidden.js";

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

/** The picker's current state and actions, passed to function children. */
export type TagPickerState = {
  value: string[];
  inputValue: string;
  add: (value: string) => void;
  remove: (value: string) => void;
};

export type TagPickerProps = Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange"> &
  AsProp & {
    /** Function children receive the picker state, so custom parts can add or remove values. */
    children?: ReactNode | ((state: TagPickerState) => ReactNode) | undefined;
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

export function TagPicker({
  as,
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
}: TagPickerProps) {
  if (value !== undefined) assertUniqueValues(value, "value");
  assertUniqueValues(defaultValue, "defaultValue");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Child options register labels without rerendering the picker as filtering
  // mounts and unmounts them; event callbacks read the latest registry value.
  const optionLabels = useRef(new Map<string, string>());
  const [announcement, setAnnouncement] = useState("");
  const [finalRemovalRequest, setFinalRemovalRequest] = useState("");
  const [selectedValues, setSelected, selectedState] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
  const [queryValue, setQuery, queryState] = useControllableState({
    value: inputValue,
    defaultValue: defaultInputValue,
    onChange: onInputChange,
  });
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
    setSelected([...selectedValues, tagValue]);
    setQuery("");
    setAnnouncement(`Added ${label}.`);
    inputRef.current?.focus();
  };

  const add = (tagValue: string) => addOption(tagValue, labelFor(tagValue));

  const remove = (tagValue: string) => {
    if (resolvedDisabled || !selectedValues.includes(tagValue)) return;
    if (selectedValues.length === 1) setFinalRemovalRequest(tagValue);
    setSelected(selectedValues.filter((value) => value !== tagValue));
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
    controlRef: inputRef,
    form,
    state: selectedState,
    readValue: () => selectedValues,
  });
  useFormReset({
    controlRef: inputRef,
    form,
    state: queryState,
    readValue: () => inputRef.current?.value ?? "",
  });

  const state = {
    value: selectedValues,
    inputValue: queryValue,
    add,
    remove,
  };
  const content = typeof children === "function" ? children(state) : children;

  const Part = partElement(as, "div");
  return (
    <TagGroup onRemove={remove}>
      <Autocomplete
        inputValue={queryValue}
        onInputChange={setQuery}
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
          <Part
            {...props}
            ref={composedRef}
            aria-disabled={props["aria-disabled"] ?? (resolvedDisabled || undefined)}
            data-disabled={dataAttr(resolvedDisabled)}
            data-empty={dataAttr(selectedValues.length === 0)}
            data-slot="tag-picker"
          >
            <>
              <FormValue
                name={name}
                form={form}
                value={selectedValues}
                disabled={resolvedDisabled}
              />
              {content}
              <VisuallyHidden aria-live="polite" aria-atomic="true">
                {announcement}
              </VisuallyHidden>
            </>
          </Part>
        </TagPickerContext>
      </Autocomplete>
    </TagGroup>
  );
}
