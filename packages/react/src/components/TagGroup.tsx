import { type ReactNode } from "react";
import { useControllableState } from "@comp0/core";
import { fieldFeedback, FieldProvider, useFieldIds } from "../field.js";
import { TagGroupContext } from "./tag-shared.js";

export type TagGroupProps = {
  children: ReactNode;
  id?: string | undefined;
  /** Controlled or initial selected tag values; omit both for no selection. */
  value?: string[] | undefined;
  defaultValue?: string[] | undefined;
  onChange?: ((value: string[]) => void) | undefined;
  /** Receives a tag's value from Delete, Backspace, or a remove control. */
  onRemove?: ((value: string) => void) | undefined;
};

export function TagGroup({ children, defaultValue, id, onChange, onRemove, value }: TagGroupProps) {
  const ids = useFieldIds(id);
  const feedback = fieldFeedback(children);
  const selectionEnabled =
    value !== undefined || defaultValue !== undefined || onChange !== undefined;
  const [selected, setSelected] = useControllableState<string[]>({
    value,
    defaultValue: defaultValue ?? [],
    onChange,
  });
  const context = {
    selectionEnabled,
    selected,
    toggle(tagValue: string) {
      setSelected((current) => {
        if (current.includes(tagValue)) return current.filter((entry) => entry !== tagValue);
        return [...current, tagValue];
      });
    },
    remove: onRemove,
  };

  return (
    <FieldProvider value={{ ...ids, ...feedback }}>
      <TagGroupContext value={context}>{children}</TagGroupContext>
    </FieldProvider>
  );
}
