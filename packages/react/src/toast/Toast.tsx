import { useRef, type ComponentProps } from "react";
import { composeRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { ToastItemContext, type ToastRecord } from "./toast-shared.js";

export type ToastProps = ComponentProps<"div"> &
  AsProp & {
    toast: ToastRecord;
  };

export function Toast({ as, children, ref, toast, ...props }: ToastProps) {
  const itemRef = useRef<HTMLDivElement | null>(null);
  let role = props.role;
  if (role === undefined) role = toast.kind === "alert" ? "alert" : "status";
  // The element carries its live-region role and content in the same commit;
  // browsers announce that reliably for toasts appended one at a time.
  const Part = partElement(as, "div");
  return (
    <ToastItemContext value={{ itemRef, toast }}>
      <Part
        {...props}
        ref={composeRefs(itemRef, ref)}
        role={role}
        data-kind={toast.kind}
        data-slot={dataSlot(props, "toast")}
      >
        {children ?? toast.content}
      </Part>
    </ToastItemContext>
  );
}
