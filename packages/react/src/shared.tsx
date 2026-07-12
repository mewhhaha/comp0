import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { composeRefs, dataAttr } from "@comp0/core";

export type RefProp<TElement> = {
  ref?: Ref<TElement> | undefined;
};

export type StateChildren<TState> = ReactNode | ((state: TState) => ReactNode);
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
  return typeof children === "function" ? children(state) : children;
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

export type SelectRootContextValue = {
  disabled: boolean;
  selectedKey: string;
  triggerId: string;
  listBoxId: string;
  labelId: string;
  descriptionId: string;
  selectedText: ReactNode;
  setSelectedKey: (key: string) => void;
  registerItem: (key: string, textValue: ReactNode) => void;
  unregisterItem: (key: string) => void;
};

export const SelectRootContext = createContext<SelectRootContextValue | null>(null);

export function useSelectRootContext() {
  return useContext(SelectRootContext);
}

export type ComboBoxRootContextValue = {
  activeKey: string;
  activeId: string;
  disabled: boolean;
  invalid: boolean;
  required: boolean;
  displayValue: string;
  inputValue: string;
  selectedKey: string;
  inputId: string;
  listBoxId: string;
  labelId: string;
  descriptionId: string;
  setActiveKey: (key: string) => void;
  setActiveId: (id: string) => void;
  setInputValue: (value: string) => void;
  setSelectedKey: (key: string) => void;
  isItemVisible: (textValue: string) => boolean;
  registerItem: (key: string, textValue: ReactNode) => void;
  unregisterItem: (key: string) => void;
};

export const ComboBoxRootContext = createContext<ComboBoxRootContextValue | null>(null);

export function useComboBoxRootContext() {
  return useContext(ComboBoxRootContext);
}

export interface SearchFieldContextValue {
  value: string;
  disabled: boolean;
  clear: () => void;
  submit: (value?: string) => void;
  setValue: (value: string) => void;
}

export const SearchFieldContext = createContext<SearchFieldContextValue | null>(null);

export function useSearchFieldContext() {
  return useContext(SearchFieldContext);
}

type SlotProps = Record<string, unknown> & { children?: ReactNode };

/**
 * Merges behavior props onto a single element child. Triggers render this
 * when given as={Fragment}, so consumers supply their own element and the
 * trigger contributes wiring instead of a wrapper button.
 */
export function Slot({ children, ...props }: SlotProps) {
  if (!isValidElement<Record<string, unknown>>(children)) {
    throw new Error("A Fragment trigger needs exactly one element child to attach behavior to.");
  }
  const childProps = children.props;
  const merged: Record<string, unknown> = { ...props };
  for (const key of Object.keys(childProps)) {
    if (key === "children" || key === "ref") continue;
    const ours = merged[key];
    const theirs = childProps[key];
    if (ours === undefined) {
      merged[key] = theirs;
    } else if (typeof ours === "function" && typeof theirs === "function") {
      merged[key] = (...args: unknown[]) => {
        (theirs as (...eventArgs: unknown[]) => void)(...args);
        (ours as (...eventArgs: unknown[]) => void)(...args);
      };
    } else if (key === "className" && typeof ours === "string" && typeof theirs === "string") {
      merged[key] = `${theirs} ${ours}`;
    } else if (key === "style" && typeof ours === "object" && typeof theirs === "object") {
      merged[key] = { ...theirs, ...ours };
    }
  }
  merged["ref"] = composeRefs(
    props["ref"] as Ref<unknown>,
    childProps["ref"] as Ref<unknown> | undefined,
  );
  return cloneElement(children, merged);
}
