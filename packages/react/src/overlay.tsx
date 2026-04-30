import {
  useEffect,
  useId,
  useRef,
  useState,
  type DialogHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { composeRefs, dataAttr, useControllableState } from "@comp0/core";
import {
  useComboBoxRootContext,
  usePickerRootContext,
  useSelectRootContext,
  type AnchorAttributeProps,
  type RefProp,
} from "./shared.js";

export type DialogProps = HTMLAttributes<HTMLDivElement> & {
  role?: "dialog" | "alertdialog" | undefined;
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
};

export function Dialog({
  role = "dialog",
  tabIndex = -1,
  ref,
  ...props
}: DialogProps & RefProp<HTMLDivElement>) {
  return <div {...props} ref={ref} role={role} tabIndex={tabIndex} />;
}

export type ModalProps = Omit<
  DialogHTMLAttributes<HTMLDialogElement>,
  "open" | "children" | "onChange"
> & {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onChange?: (open: boolean) => void;
  children?: ReactNode | ((state: { open: boolean }) => ReactNode);
};

export function Modal({
  open: openProp,
  defaultOpen = false,
  onChange,
  children,
  onCancel,
  onClose,
  ref,
  ...props
}: ModalProps & RefProp<HTMLDialogElement>) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange,
  });
  const localRef = useRef<HTMLDialogElement | null>(null);
  const restoreFocusRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const dialog = localRef.current;
    if (!dialog) return;

    if (open) {
      restoreFocusRef.current = document.activeElement;
      if (!dialog.open && typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    } else if (dialog.open) {
      dialog.close();
      if (restoreFocusRef.current instanceof HTMLElement) restoreFocusRef.current.focus();
    }
  }, [open]);

  const dialog = (
    <dialog
      {...props}
      ref={(element) => {
        localRef.current = element;
        composeRefs(ref)(element);
      }}
      aria-modal={props["aria-modal"] ?? true}
      data-open={dataAttr(open)}
      onCancel={(event) => {
        onCancel?.(event);
        if (!event.defaultPrevented) setOpen(false);
      }}
      onClose={(event) => {
        onClose?.(event);
        if (open) setOpen(false);
      }}
    >
      {typeof children === "function" ? children({ open }) : children}
    </dialog>
  );

  if (!mounted || typeof document === "undefined") return dialog;
  return createPortal(dialog, document.body);
}

export type PopoverProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> &
  AnchorAttributeProps & {
    open?: boolean | undefined;
    defaultOpen?: boolean | undefined;
    onChange?: (open: boolean) => void;
  };

export function Popover({
  open: openProp,
  defaultOpen = false,
  onChange,
  hidden,
  popover,
  ref,
  ...props
}: PopoverProps & RefProp<HTMLDivElement>) {
  const select = useSelectRootContext();
  const comboBox = useComboBoxRootContext();
  const datePicker = usePickerRootContext();
  const picker = select ?? comboBox ?? datePicker;
  const [open] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange,
  });
  const generatedId = useId();
  const id = props.id ?? picker?.popoverId ?? generatedId;
  const isOpenResolved = picker?.open ?? open;
  const divProps = {
    ...props,
    anchor: props.anchor ?? select?.triggerId ?? comboBox?.inputId ?? datePicker?.triggerId,
  } as HTMLAttributes<HTMLDivElement> & AnchorAttributeProps;

  return (
    <div
      {...divProps}
      ref={ref}
      id={id}
      role={props.role ?? (datePicker || !picker ? "dialog" : undefined)}
      popover={popover}
      hidden={hidden ?? (popover === undefined ? !isOpenResolved : undefined)}
      data-open={dataAttr(isOpenResolved)}
    />
  );
}

export type TooltipProps = HTMLAttributes<HTMLDivElement> & {
  open?: boolean | undefined;
};

export function Tooltip({
  id,
  role = "tooltip",
  open = true,
  hidden,
  ref,
  ...props
}: TooltipProps & RefProp<HTMLDivElement>) {
  const generatedId = useId();
  return (
    <div
      {...props}
      ref={ref}
      id={id ?? generatedId}
      role={role}
      hidden={hidden ?? !open}
      data-open={dataAttr(open)}
    />
  );
}
