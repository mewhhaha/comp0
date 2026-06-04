import { type RefProp } from "../shared.js";
import { type FileTriggerProps } from "./parity-shared.js";
export type { FileTriggerProps } from "./parity-shared.js";
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
