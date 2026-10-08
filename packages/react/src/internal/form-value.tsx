import { type Ref } from "react";

export type FormValueProps = {
  /** Attached to the first input, for controls that anchor form reset or validity on it. */
  ref?: Ref<HTMLInputElement> | undefined;
  name: string | undefined;
  value: string | readonly string[] | undefined;
  form?: string | undefined;
  disabled?: boolean | undefined;
};

/**
 * Submits a composite control's value with its form through hidden inputs:
 * one per value, so a multi-value control serializes like a native multiple
 * select. Renders nothing without a name or a value.
 */
export function FormValue({ ref, name, value, form, disabled }: FormValueProps) {
  if (!name || value === undefined) return null;
  const values = typeof value === "string" ? [value] : value;
  return (
    <>
      {values.map((entry, index) => (
        <input
          key={index}
          ref={index === 0 ? ref : undefined}
          type="hidden"
          name={name}
          value={entry}
          form={form}
          disabled={disabled}
        />
      ))}
    </>
  );
}
