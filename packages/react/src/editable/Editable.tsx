import { useEffect, useRef, useState, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { EditableContext } from "./editable-shared.js";

export type EditableProps = RootProps<{
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the committed value when an edit commits, not per keystroke. */
  onChange?: ((value: string) => void) | undefined;
  /** Whether the input is shown in place of the view. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state as editing starts, commits, or cancels. */
  onToggle?: ((open: boolean) => void) | undefined;
  disabled?: boolean | undefined;
  children?: ReactNode | undefined;
}>;

export function Editable({
  as,
  children,
  value: valueProp,
  defaultValue,
  onChange,
  open: openProp,
  defaultOpen = false,
  onToggle,
  disabled = false,
  ...props
}: EditableProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const viewRef = useRef<HTMLButtonElement>(null);
  const previousOpenRef = useRef(false);
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onToggle,
  });
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    const wasOpen = previousOpenRef.current;
    previousOpenRef.current = open;
    if (open) {
      if (wasOpen) return;
      inputRef.current?.focus();
      inputRef.current?.select();
      return;
    }
    if (!wasOpen) return;
    // Refocus the view only when hiding the input orphaned focus; a blur
    // commit already moved focus to the target the user chose.
    const ownerDocument = inputRef.current?.ownerDocument;
    const activeElement = ownerDocument?.activeElement;
    if (activeElement !== inputRef.current && activeElement !== ownerDocument?.body) return;
    viewRef.current?.focus();
  }, [open]);

  const context = {
    value,
    draft,
    open,
    disabled,
    inputRef,
    viewRef,
    setDraft,
    startEditing() {
      if (disabled) return;
      setDraft(value);
      setOpen(true);
    },
    commit(nextDraft: string) {
      setValue(nextDraft);
      setOpen(false);
    },
    cancel() {
      setOpen(false);
    },
  };

  const Root = rootElement(as);
  return (
    <EditableContext value={context}>
      <Root
        {...props}
        data-slot={dataSlot(props, "editable")}
        data-open={dataAttr(open)}
        data-disabled={dataAttr(disabled)}
      >
        {children}
      </Root>
    </EditableContext>
  );
}
