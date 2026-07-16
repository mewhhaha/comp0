import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type HTMLAttributes,
} from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { EditableContext } from "./editable-shared.js";
import { ProviderRoot } from "./provider-root.js";

export type EditableProps = Omit<HTMLAttributes<HTMLElement>, "defaultValue" | "onChange"> & {
  as?: ElementType | typeof Fragment | undefined;
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the committed value when an edit commits, not per keystroke. */
  onChange?: ((value: string) => void) | undefined;
  editing?: boolean | undefined;
  defaultEditing?: boolean | undefined;
  onEditingChange?: ((editing: boolean) => void) | undefined;
  disabled?: boolean | undefined;
};

export function Editable({
  as,
  children,
  value: valueProp,
  defaultValue,
  onChange,
  editing: editingProp,
  defaultEditing = false,
  onEditingChange,
  disabled = false,
  ref,
  ...props
}: EditableProps & RefProp<HTMLElement>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const viewRef = useRef<HTMLButtonElement>(null);
  const previousEditingRef = useRef(false);
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const [editing, setEditing] = useControllableState({
    value: editingProp,
    defaultValue: defaultEditing,
    onChange: onEditingChange,
  });
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    const wasEditing = previousEditingRef.current;
    previousEditingRef.current = editing;
    if (editing) {
      if (wasEditing) return;
      inputRef.current?.focus();
      inputRef.current?.select();
      return;
    }
    if (!wasEditing) return;
    // Refocus the view only when hiding the input orphaned focus; a blur
    // commit already moved focus to the target the user chose.
    const ownerDocument = inputRef.current?.ownerDocument;
    const activeElement = ownerDocument?.activeElement;
    if (activeElement !== inputRef.current && activeElement !== ownerDocument?.body) return;
    viewRef.current?.focus();
  }, [editing]);

  const context = {
    value,
    draft,
    editing,
    disabled,
    inputRef,
    viewRef,
    setDraft,
    startEditing() {
      if (disabled) return;
      setDraft(value);
      setEditing(true);
    },
    commit(nextDraft: string) {
      setValue(nextDraft);
      setEditing(false);
    },
    cancel() {
      setEditing(false);
    },
  };

  return (
    <EditableContext value={context}>
      <ProviderRoot
        as={as}
        {...props}
        ref={ref}
        data-slot={dataSlot(props, "editable")}
        data-editing={dataAttr(editing)}
        data-disabled={dataAttr(disabled)}
      >
        {children}
      </ProviderRoot>
    </EditableContext>
  );
}
