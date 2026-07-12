import { useRef, type HTMLAttributes } from "react";
import { composeRefs } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { ToastItemContext, type ToastRecord } from "./toast-shared.js";

export type ToastProps = HTMLAttributes<HTMLDivElement> & {
  toast: ToastRecord;
};

export function Toast({ children, ref, toast, ...props }: ToastProps & RefProp<HTMLDivElement>) {
  const itemRef = useRef<HTMLDivElement | null>(null);
  let role = props.role;
  if (role === undefined) role = toast.kind === "alert" ? "alert" : "status";
  // The element carries its live-region role and content in the same commit;
  // browsers announce that reliably for toasts appended one at a time.
  return (
    <ToastItemContext value={{ itemRef, toast }}>
      <div
        {...props}
        ref={composeRefs(itemRef, ref)}
        role={role}
        data-kind={toast.kind}
        data-slot={dataSlot(props, "toast")}
      >
        {children ?? toast.content}
      </div>
    </ToastItemContext>
  );
}
