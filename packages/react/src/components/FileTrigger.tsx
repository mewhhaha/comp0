import { type RefProp } from "../shared.js";
import { type CSSProperties, type InputHTMLAttributes, type LabelHTMLAttributes } from "react";

type FileTriggerLabelProps = Pick<
  LabelHTMLAttributes<HTMLLabelElement>,
  "children" | "className" | "style"
>;

export type FileTriggerProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "children" | "className" | "style" | "type"
> &
  FileTriggerLabelProps;
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

export function FileTrigger({
  children,
  className,
  hidden = false,
  ref,
  style,
  ...inputProps
}: FileTriggerProps & RefProp<HTMLInputElement>) {
  return (
    <label className={className} style={style} data-slot="file-trigger">
      <input {...inputProps} ref={ref} type="file" style={visuallyHiddenInput} hidden={hidden} />
      {children}
    </label>
  );
}
