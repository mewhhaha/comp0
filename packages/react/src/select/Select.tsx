import {
  Children,
  useRef,
  isValidElement,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { dataAttr, useCollection, useControllableState } from "@comp0/core";
import { fieldFeedback, useFieldIds } from "../field/field-shared.js";
import { FieldProvider } from "../field/FieldProvider.js";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { resolveAutocompleteItemText } from "../autocomplete/autocomplete-shared.js";
import { PopoverContext, usePopoverState } from "../internal/overlay/index.js";
import { useFormReset } from "../internal/form-control-state.js";
import { SelectContext } from "./select-shared.js";
import { SelectOption } from "./SelectOption.js";

const nativeSelectStyle: CSSProperties = {
  border: 0,
  clipPath: "inset(50%)",
  height: 1,
  margin: -1,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
};

type DeclarativeSelectOptionProps = {
  "aria-label"?: string | undefined;
  children?: ReactNode;
  textValue?: string | undefined;
  value?: string | undefined;
};

export type SelectProps = RootProps<{
  /** Base for the generated trigger, listbox and field ids; also the wrapper id when `as` is set. */
  id?: string | undefined;
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the selected option value; native input change events stay on leaf controls. */
  onChange?: ((value: string) => void) | undefined;
  /** Controlled or initial open state of the listbox; Select owns its own popover. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state. */
  onOpenChange?: ((open: boolean) => void) | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  name?: string | undefined;
  form?: string | undefined;
  children?: ReactNode | undefined;
}>;

export function Select({
  id,
  value,
  defaultValue,
  onChange,
  open,
  defaultOpen,
  onOpenChange,
  disabled,
  invalid,
  required,
  name,
  form,
  as,
  children,
  ...props
}: SelectProps) {
  const ids = useFieldIds(id);
  const popover = usePopoverState({
    open,
    defaultOpen,
    onOpenChange,
    triggerId: ids.controlId,
    contentId: `${ids.controlId}-listbox`,
  });
  const collection = useCollection();
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const resolvedDisabled = Boolean(disabled);
  const resolvedRequired = Boolean(required);
  const resolvedInvalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true" || Boolean(invalid);
  const feedback = fieldFeedback(children, resolvedInvalid);
  const [selected, setSelected, selectedState] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  // The registered label is authoritative once options mount. The children
  // walk below only covers the render before that: server output and the
  // first client paint, where options have not registered yet, so the trigger
  // would otherwise render the placeholder for a selected value.
  const registeredText = useSyncExternalStore(
    collection.subscribe,
    () => collection.get(selected)?.textValue,
    () => undefined,
  );
  let declarativeSelectedText: string | undefined;
  const visitSelectOptions = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if (declarativeSelectedText !== undefined) return;
      if (!isValidElement<DeclarativeSelectOptionProps>(child)) return;
      if (child.type === SelectOption && child.props.value === selected) {
        declarativeSelectedText =
          child.props.textValue ??
          resolveAutocompleteItemText(child.props.children).text ??
          child.props["aria-label"];
        return;
      }
      visitSelectOptions(child.props.children);
    });
  };
  visitSelectOptions(children);
  useFormReset({
    controlRef: selectRef,
    form,
    state: selectedState,
    readValue: (element) => element.value,
  });
  const { controlId, descriptionId, errorId, labelId } = ids;
  const fieldContext = {
    controlId,
    descriptionId,
    errorId,
    labelId,
    disabled: resolvedDisabled,
    invalid: resolvedInvalid,
    required: resolvedRequired,
    ...feedback,
  };
  const context = {
    disabled: resolvedDisabled,
    selectedKey: selected,
    triggerId: controlId,
    listBoxId: `${controlId}-listbox`,
    labelId,
    descriptionId,
    selectedText: registeredText ?? declarativeSelectedText,
    collection,
    popover,
    setSelectedKey: setSelected,
  };

  const Root = rootElement(as);
  return (
    <FieldProvider value={fieldContext}>
      <PopoverContext value={popover}>
        <SelectContext value={context}>
          <Root
            data-slot="select"
            {...props}
            id={id}
            aria-invalid={props["aria-invalid"] ?? (resolvedInvalid || undefined)}
            data-disabled={dataAttr(resolvedDisabled)}
            data-invalid={dataAttr(resolvedInvalid)}
            data-placeholder={dataAttr(selected === "")}
            data-required={dataAttr(resolvedRequired)}
            data-value={selected || undefined}
          >
            <>
              <select
                ref={selectRef}
                aria-hidden="true"
                aria-labelledby={labelId}
                disabled={resolvedDisabled}
                form={form}
                name={name}
                onChange={() => undefined}
                onInvalid={(event) => {
                  event.preventDefault();
                  event.currentTarget.ownerDocument.getElementById(controlId)?.focus();
                }}
                required={resolvedRequired}
                style={nativeSelectStyle}
                tabIndex={-1}
                value={selected}
              >
                <option aria-label="No selection" value="" />
                {selected && <option value={selected}>{selected}</option>}
              </select>
              {children}
            </>
          </Root>
        </SelectContext>
      </PopoverContext>
    </FieldProvider>
  );
}
