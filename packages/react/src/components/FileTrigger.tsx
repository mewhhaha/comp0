import { type RefProp } from "../shared.js";
import { type CSSProperties, type InputHTMLAttributes, type LabelHTMLAttributes } from "react";

export type FileTriggerProps = LabelHTMLAttributes<HTMLLabelElement> & {
  inputProps?: InputHTMLAttributes<HTMLInputElement> | undefined;
};
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
  inputProps,
  ref,
  ...props
}: FileTriggerProps & RefProp<HTMLLabelElement>) {
  return (
    <label {...props} ref={ref} data-slot="file-trigger">
      <input
        {...inputProps}
        type="file"
        style={inputProps?.style ?? visuallyHiddenInput}
        hidden={inputProps?.hidden ?? false}
      />
      {children}
    </label>
  );
}
