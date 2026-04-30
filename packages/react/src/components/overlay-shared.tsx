import { type DialogHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { type AnchorAttributeProps } from "../shared.js";

export type DialogProps = HTMLAttributes<HTMLDivElement> & {
  role?: "dialog" | "alertdialog" | undefined;
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
};

export type ModalProps = Omit<
  DialogHTMLAttributes<HTMLDialogElement>,
  "open" | "children" | "onChange"
> & {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onChange?: (open: boolean) => void;
  children?: ReactNode | ((state: { open: boolean }) => ReactNode);
};

export type PopoverProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> &
  AnchorAttributeProps & {
    open?: boolean | undefined;
    defaultOpen?: boolean | undefined;
    onChange?: (open: boolean) => void;
  };

export type TooltipProps = HTMLAttributes<HTMLDivElement> & {
  open?: boolean | undefined;
};
