import { useContext, useEffect, useId, useLayoutEffect, useRef, type HTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { useSelectRootContext, type RefProp } from "../shared.js";
import { resolveItemLabel } from "./collection-shared.js";
import { SelectCollectionContext } from "./pickers-shared.js";
import { usePopoverContext } from "./overlay-shared.js";

export type SelectOptionProps = Omit<HTMLAttributes<HTMLDivElement>, "id"> & {
  value: string;
  id?: string;
  disabled?: boolean;
  /** Overrides the text crawled from children for display and typeahead. */
  textValue?: string;
};

export function SelectOption({
  value,
  id: idProp,
  disabled,
  textValue,
  children,
  onClick,
  onKeyDown,
  ref,
  ...props
}: SelectOptionProps & RefProp<HTMLDivElement>) {
  const select = useSelectRootContext();
  const popover = usePopoverContext();
  if (!select || !popover) throw new Error("SelectOption must be rendered inside Select.");
  const generatedId = useId().replace(/:/g, "");
  const id = idProp ?? `${select?.listBoxId ?? "select"}-option-${generatedId}`;
  const ariaLabel = props["aria-label"];
  const resolvedDisabled = Boolean(disabled || select.disabled);
  const collection = useContext(SelectCollectionContext);
  const element = useRef<HTMLDivElement>(null);
  // registerItem and unregisterItem are stable; depending on them instead of
  // the whole select context keeps re-renders from unregistering the option.
  const { registerItem, unregisterItem } = select;
  // Register with the rendered element's text (or the textValue override) so
  // options with markup children still display and typeahead by their text.
  // Runs every render; the root ignores unchanged registrations.
  useLayoutEffect(() => {
    const label = resolveItemLabel({
      textValue,
      children,
      element: element.current,
      ariaLabel,
      fallback: value,
    });
    registerItem(value, label);
    collection?.register({
      value,
      id,
      text: label,
      disabled: resolvedDisabled,
      element: element.current,
    });
  });
  useEffect(() => {
    return () => {
      unregisterItem(value);
      collection?.unregister(value);
    };
  }, [collection, unregisterItem, value]);
  const selected = select?.selectedKey === value;
  return (
    <div
      {...props}
      ref={(node) => {
        element.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      id={id}
      role="option"
      tabIndex={resolvedDisabled ? undefined : -1}
      aria-selected={selected}
      aria-disabled={resolvedDisabled || undefined}
      data-disabled={dataAttr(resolvedDisabled)}
      data-selected={dataAttr(selected)}
      data-value={value}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !resolvedDisabled) {
          select.setSelectedKey(value);
          popover.requestClose();
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        select.setSelectedKey(value);
        popover.requestClose();
      }}
    >
      {children}
    </div>
  );
}
