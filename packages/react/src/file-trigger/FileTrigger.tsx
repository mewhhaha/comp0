import { type ComponentProps, type CSSProperties } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

// Clips the input like VisuallyHidden so it stays focusable, unlike the
// hidden attribute's display:none, which would remove the keyboard path.
const visuallyHiddenInput = {
  border: 0,
  clipPath: "inset(50%)",
  height: 1,
  margin: -1,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
} satisfies CSSProperties;

// `as` replaces the label that wraps the input; the remaining props go to the file input.
export type FileTriggerProps = Omit<
  ComponentProps<"input">,
  "children" | "className" | "style" | "type"
> &
  Pick<ComponentProps<"label">, "children" | "className" | "style"> &
  AsProp;

export function FileTrigger({
  as,
  children,
  className,
  hidden = false,
  style,
  ...inputProps
}: FileTriggerProps) {
  const Part = partElement(as, "label");
  return (
    <Part className={className} style={style} data-slot="file-trigger">
      <>
        <input {...inputProps} type="file" style={visuallyHiddenInput} hidden={hidden} />
        {children}
      </>
    </Part>
  );
}
