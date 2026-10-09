/** A form control as the person sees it: its visible label and, for choices, the option labels. */
export type FormFieldDescriptor = {
  /** The key the control's value is stored under. */
  name: string;
  /** The visible label of the control. */
  label: string;
  /** For choice controls, the visible label of each option value. */
  options?: readonly { value: string; label: string }[] | undefined;
};

function displayValue(field: FormFieldDescriptor, value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (Array.isArray(value)) {
    return value
      .map((item) => displayValue(field, item))
      .filter((item) => item !== "")
      .join(", ");
  }
  if (typeof value !== "string") return "";
  const option = field.options?.find((candidate) => candidate.value === value);
  return option?.label ?? value;
}

/**
 * Describes submitted form values in the words on the screen, for the `humanFriendlyMessage` of
 * an action: `"Plan: Pro; Seats: 5"`. Each entry uses the control's visible label and, for
 * choices, the visible option label rather than the stored value. Controls without a value are
 * left out, and entries follow the order of `fields`.
 */
export function describeFormValues(
  fields: readonly FormFieldDescriptor[],
  values: Readonly<Record<string, unknown>>,
): string {
  const parts: string[] = [];
  for (const field of fields) {
    const display = displayValue(field, values[field.name]);
    if (display === "") continue;
    parts.push(`${field.label.trim() === "" ? field.name : field.label.trim()}: ${display}`);
  }
  return parts.join("; ");
}
