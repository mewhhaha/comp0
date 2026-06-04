import { type RefProp } from "../shared.js";
import { type DragEvent, type HTMLAttributes, type ReactNode } from "react";
export type DivProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

export const toolbarFocusableSelector = [
  "button",
  "[href]",
  "input",
  "select",
  "textarea",
  "[tabindex]",
].join(",");

export function isToolbarControl(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  if (element.hidden || element.getAttribute("aria-hidden") === "true") return false;
  if (element.getAttribute("aria-disabled") === "true") return false;
  if ("disabled" in element && Boolean(element.disabled)) return false;
  return true;
}

export function getToolbarControls(root: HTMLDivElement | null) {
  if (!root) return [];
  return [...root.querySelectorAll(toolbarFocusableSelector)].filter(isToolbarControl);
}

export function createDivComponent(name: string, role?: string) {
  return function ParityComponent({ children, ref, ...props }: DivProps & RefProp<HTMLDivElement>) {
    const slot = (props as Record<string, unknown>)["data-slot"] ?? name;
    return (
      <div {...props} ref={ref} role={props.role ?? role} data-slot={slot as string}>
        {children}
      </div>
    );
  };
}

export function hasFileDrag(dataTransfer: DataTransfer | null) {
  if (!dataTransfer) return false;
  return Array.from(dataTransfer.types).includes("Files");
}

export function acceptFileDrag(event: DragEvent<HTMLDivElement>) {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
}

export type DropZoneProps = HTMLAttributes<HTMLDivElement> & {
  disabled?: boolean | undefined;
};

export type FileTriggerProps = HTMLAttributes<HTMLLabelElement> & {
  inputProps?: React.InputHTMLAttributes<HTMLInputElement> | undefined;
};
export type ToolbarProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical" | undefined;
  loop?: boolean | undefined;
};
