import { type ReactNode } from "react";
import { useCollection, useControllableState } from "@comp0/core";
import { fieldFeedback, useFieldIds } from "../field/field-shared.js";
import { FieldProvider } from "../field/FieldProvider.js";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { TagGroupContext } from "./tag-shared.js";

export type TagGroupProps = RootProps<{
  children: ReactNode;
  id?: string | undefined;
  /** Controlled or initial selected tag values; omit both for no selection. */
  value?: string[] | undefined;
  defaultValue?: string[] | undefined;
  onChange?: ((value: string[]) => void) | undefined;
  /** Receives a tag's value from Delete, Backspace, or a remove control. */
  onRemove?: ((value: string) => void) | undefined;
}>;

export function TagGroup({
  as,
  children,
  defaultValue,
  id,
  onChange,
  onRemove,
  value,
  ...props
}: TagGroupProps) {
  const ids = useFieldIds(id);
  const collection = useCollection();
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
    collection,
  };

  const Root = rootElement(as);
  return (
    <FieldProvider value={{ ...ids, ...feedback }}>
      <TagGroupContext value={context}>
        <Root data-slot="tag-group" {...props}>
          {children}
        </Root>
      </TagGroupContext>
    </FieldProvider>
  );
}
