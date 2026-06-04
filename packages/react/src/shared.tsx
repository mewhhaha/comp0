import { createContext, useContext, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { dataAttr, renderProp, type RenderProp } from "@comp0/core";

export type RefProp<TElement> = {
  ref?: Ref<TElement> | undefined;
};

export type StateChildren<TState> = RenderProp<TState>;
export type StateClassName<TState> = string | ((state: TState) => string | undefined);

export function InteractiveDiv(props: HTMLAttributes<HTMLDivElement> & RefProp<HTMLDivElement>) {
  const { ref } = props;
  return <div {...props} ref={ref} />;
}

export type SharedStateProps<TState> = {
  children?: StateChildren<TState>;
  className?: StateClassName<TState>;
};

export function resolveClassName<TState>(
  className: StateClassName<TState> | undefined,
  state: TState,
) {
  return typeof className === "function" ? className(state) : className;
}

export function resolveChildren<TState>(
  children: StateChildren<TState> | undefined,
  state: TState,
) {
  return renderProp(children, state);
}

export function disabledProps(disabled: boolean | undefined) {
  return {
    "aria-disabled": disabled || undefined,
    "data-disabled": dataAttr(disabled),
  };
}

export function dataSlot(props: Record<string, unknown>, fallback: string) {
  return (props["data-slot"] as string | undefined) ?? fallback;
}

export function useDataState(states: Record<string, boolean | undefined>) {
  const attrs: Record<string, string> = {};
  for (const [key, value] of Object.entries(states)) {
    if (value) attrs[`data-${key}`] = "";
  }
  return attrs;
}

export type AsChildProps = {
  asChild?: boolean | undefined;
};

export type CommandAttributeProps = {
  command?:
    | "show-popover"
    | "hide-popover"
    | "toggle-popover"
    | "show-modal"
    | "close"
    | `--${string}`
    | (string & {})
    | undefined;
  commandfor?: string | undefined;
};

export type AnchorAttributeProps = {
  anchor?: string | undefined;
};

export interface SelectRootContextValue {
  disabled: boolean;
  open: boolean;
  selectedKey: string;
  triggerId: string;
  listBoxId: string;
  popoverId: string;
  labelId: string;
  descriptionId: string;
  selectedText: ReactNode;
  setOpen: (open: boolean) => void;
  setSelectedKey: (key: string) => void;
  registerItem: (key: string, textValue: ReactNode) => void;
  unregisterItem: (key: string) => void;
}

export const SelectRootContext = createContext<SelectRootContextValue | null>(null);

export function useSelectRootContext() {
  return useContext(SelectRootContext);
}

export interface ComboBoxRootContextValue {
  activeKey: string;
  disabled: boolean;
  open: boolean;
  inputValue: string;
  selectedKey: string;
  inputId: string;
  listBoxId: string;
  popoverId: string;
  labelId: string;
  descriptionId: string;
  setActiveKey: (key: string) => void;
  setOpen: (open: boolean) => void;
  setInputValue: (value: string) => void;
  setSelectedKey: (key: string) => void;
  registerItem: (key: string, textValue: ReactNode) => void;
  unregisterItem: (key: string) => void;
}

export const ComboBoxRootContext = createContext<ComboBoxRootContextValue | null>(null);

export function useComboBoxRootContext() {
  return useContext(ComboBoxRootContext);
}

export interface SearchFieldContextValue {
  value: string;
  disabled: boolean;
  controlled: boolean;
  clear: () => void;
  submit: (value?: string) => void;
  setValue: (value: string) => void;
}

export const SearchFieldContext = createContext<SearchFieldContextValue | null>(null);

export function useSearchFieldContext() {
  return useContext(SearchFieldContext);
}

export interface PickerRootContextValue {
  disabled: boolean;
  open: boolean;
  triggerId: string;
  popoverId: string;
  setOpen: (open: boolean) => void;
}

export const PickerRootContext = createContext<PickerRootContextValue | null>(null);

export function usePickerRootContext() {
  return useContext(PickerRootContext);
}

export interface AutocompleteContextValue {
  inputValue: string;
  allowsEmptyCollection: boolean;
  isItemVisible: (textValue: string) => boolean;
  selectItem: (key: string, textValue: string) => void;
}

export const AutocompleteContext = createContext<AutocompleteContextValue | null>(null);

export function useAutocompleteContext() {
  return useContext(AutocompleteContext);
}
