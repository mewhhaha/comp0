import { type ReactNode } from "react";
import { useControllableState } from "@comp0/core";
import { fieldFeedback, useFieldIds } from "../field/field-shared.js";
import { FieldProvider } from "../field/FieldProvider.js";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
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

  const Root = rootElement(as);
  return (
    <FieldProvider value={{ ...ids, ...feedback }}>
      <TagGroupContext value={context}>
        <Root {...props} data-slot={dataSlot(props, "tag-group")}>
          {children}
        </Root>
      </TagGroupContext>
    </FieldProvider>
  );
}
