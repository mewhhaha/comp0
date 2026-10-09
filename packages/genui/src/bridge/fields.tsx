import { createContext, use, useEffect } from "react";
import { describeFormValues, type FormFieldDescriptor } from "../describe.js";
import { type JsonValue } from "../json/parse.js";
import { useGenUI, type GenUIAction } from "../render/context.js";

/** A control as the form knows it: how to describe it and where its value is stored. */
export type RegisteredField = FormFieldDescriptor & {
  /** The state key the control's value is stored under. */
  key: string;
  /** The value shown while the person has not changed the control. */
  initial?: JsonValue | undefined;
};

/** Collects the controls of one form so a submit can describe them by their visible labels. */
export class FieldRegistry {
  #fields = new Map<string, RegisteredField>();
  // A name keeps the position of its first registration, so a control that re-registers after a
  // change stays where it is on the form.
  #order = new Map<string, number>();

  /** Adds or replaces a control; returns the function that removes it. */
  register(field: RegisteredField): () => void {
    if (!this.#order.has(field.name)) this.#order.set(field.name, this.#order.size);
    this.#fields.set(field.name, field);
    return () => {
      if (this.#fields.get(field.name) === field) this.#fields.delete(field.name);
    };
  }

  /** The registered controls in the order they first appeared, which is DOM order. */
  list(): RegisteredField[] {
    return [...this.#fields.values()].sort(
      (a, b) => (this.#order.get(a.name) ?? 0) - (this.#order.get(b.name) ?? 0),
    );
  }
}

export const FieldRegistryContext = createContext<FieldRegistry | null>(null);

/** The name of the enclosing form; controls store their values under it. */
export const FormNameContext = createContext<string | undefined>(undefined);

/** Makes a control known to the enclosing form, if there is one. */
export function useRegisterField(field: RegisteredField) {
  const registry = use(FieldRegistryContext);
  useEffect(() => registry?.register(field), [registry, field]);
}

/**
 * The key a control's name is stored under. A model that forgot the name still gets a stable
 * key from the visible label.
 */
export function fieldKey(name: unknown, label: unknown): string {
  if (typeof name === "string" && name.trim() !== "") return name.trim();
  if (typeof label === "string") {
    const slug = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (slug !== "") return slug;
  }
  return "field";
}

/** The state key of a control that is not bound: its name, inside its form's namespace. */
export function useStateKey(name: string): string {
  const form = use(FormNameContext);
  return form === undefined ? name : `${form}.${name}`;
}

/**
 * Describes the values of the controls of the enclosing form, if there is one, as an action
 * carries them: the form's name, a map of control name to value, and the message built from the
 * visible labels.
 */
export function useFormSnapshot(): () => {
  name: string | undefined;
  values: Record<string, JsonValue> | undefined;
  message: string;
} {
  const { store } = useGenUI();
  const registry = use(FieldRegistryContext);
  const name = use(FormNameContext);
  return () => {
    if (registry === null) return { name, values: undefined, message: "" };
    const fields = registry.list();
    const values: Record<string, JsonValue> = {};
    for (const field of fields) {
      const value = store.get(field.key) ?? field.initial;
      if (value !== undefined) values[field.name] = value;
    }
    return { name, values, message: describeFormValues(fields, values) };
  };
}

export type { GenUIAction };
