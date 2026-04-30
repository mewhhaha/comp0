import { type RefProp } from "../shared.js";
import { useMemo } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { describedBy, FieldProvider, useFieldIds } from "../field.js";
import { CheckboxGroupContext } from "./choices-shared.js";
import { type CheckboxGroupProps } from "./choices-shared.js";
export type { CheckboxGroupProps } from "./choices-shared.js";
export function CheckboxGroup({
  children,
  id,
  value,
  defaultValue = [],
  onChange,
  invalid,
  required,
  name,
  ref,
  ...props
}: CheckboxGroupProps & RefProp<HTMLFieldSetElement>) {
  const ids = useFieldIds(id);
  const [selectedValues, setSelectedValues] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
  const disabled = Boolean(props.disabled);
  const resolvedInvalid = Boolean(invalid);
  const resolvedRequired = Boolean(required);
  const { controlId, descriptionId, errorId, labelId } = ids;
  const fieldContext = useMemo(
    () => ({
      controlId,
      descriptionId,
      errorId,
      labelId,
      disabled,
      invalid: resolvedInvalid,
      required: resolvedRequired,
    }),
    [disabled, controlId, descriptionId, errorId, labelId, resolvedInvalid, resolvedRequired],
  );

  return (
    <FieldProvider value={fieldContext}>
      <CheckboxGroupContext.Provider
        value={{
          name,
          value: selectedValues,
          disabled,
          onChange(nextValue, selected) {
            setSelectedValues((current) => {
              if (selected) return [...new Set([...current, nextValue])];
              return current.filter((item) => item !== nextValue);
            });
          },
        }}
      >
        <fieldset
          {...props}
          ref={ref}
          id={id}
          name={name}
          disabled={disabled}
          aria-describedby={describedBy({ ...ids, invalid: resolvedInvalid })}
          aria-invalid={resolvedInvalid || undefined}
          data-disabled={dataAttr(disabled)}
          data-invalid={dataAttr(resolvedInvalid)}
          data-required={dataAttr(resolvedRequired)}
        >
          {children}
        </fieldset>
      </CheckboxGroupContext.Provider>
    </FieldProvider>
  );
}
