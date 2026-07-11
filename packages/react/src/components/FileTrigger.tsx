import { type RefProp } from "../shared.js";
import { type InputHTMLAttributes, type LabelHTMLAttributes } from "react";

export type FileTriggerProps = LabelHTMLAttributes<HTMLLabelElement> & {
  inputProps?: InputHTMLAttributes<HTMLInputElement> | undefined;
};
export function FileTrigger({
  children,
  inputProps,
  ref,
  ...props
}: FileTriggerProps & RefProp<HTMLLabelElement>) {
  return (
    <label {...props} ref={ref} data-slot="file-trigger">
      <input {...inputProps} type="file" hidden={inputProps?.hidden ?? true} />
      {children}
    </label>
  );
}
