import { useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { composeRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
  ToastItemContext,
  useOptionalToastRegionContext,
  type ToastRecord,
} from "./toast-shared.js";

export type ToastProps = ComponentProps<"div"> &
  AsProp & {
    toast: ToastRecord;
  };

export function Toast({ as, children, ref, toast, ...props }: ToastProps) {
  const itemRef = useRef<HTMLDivElement | null>(null);
  const [element, setElement] = useState<HTMLElement | null>(null);
  const collection = useOptionalToastRegionContext()?.collection;
  const id = toast.id;
  useLayoutEffect(() => {
    if (!element || !collection) return;
    collection.register({ key: id, textValue: "", element });
    return () => {
      collection.unregister(id, element);
    };
  }, [collection, element, id]);
  let role = props.role;
  if (role === undefined) role = toast.kind === "alert" ? "alert" : "status";
  // The element carries its live-region role and content in the same commit;
  // browsers announce that reliably for toasts appended one at a time.
  const Part = partElement(as, "div");
  return (
    <ToastItemContext value={{ itemRef, toast }}>
      <Part
        data-slot="toast"
        {...props}
        ref={composeRefs(itemRef, setElement, ref)}
        role={role}
        data-kind={toast.kind}
      >
        {children ?? toast.content}
      </Part>
    </ToastItemContext>
  );
}
