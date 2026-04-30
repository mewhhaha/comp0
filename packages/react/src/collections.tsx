import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import {
  composeRefs,
  dataAttr,
  findTypeaheadMatch,
  getRovingFocusTarget,
  useControllableState,
} from "@comp0/core";
import {
  InteractiveDiv,
  useAutocompleteContext,
  useComboBoxRootContext,
  useSelectRootContext,
  type RefProp,
} from "./shared.js";

export type CollectionProps<TItem> = {
  items?: Iterable<TItem> | undefined;
  children: ReactNode | ((item: TItem) => ReactNode);
};

export function Collection<TItem>({ items, children }: CollectionProps<TItem>) {
  if (!items) return <>{children as ReactNode}</>;
  return (
    <>{Array.from(items, (item) => (typeof children === "function" ? children(item) : children))}</>
  );
}

interface SelectableCollectionContextValue {
  activeKey: string;
  selectedKey: string;
  setActiveKey: (key: string) => void;
  setSelectedKey: (key: string) => void;
  register: (
    key: string,
    textValue: string,
    element: HTMLElement | null,
    disabled?: boolean,
  ) => void;
  items: () => CollectionItemRecord[];
}

interface CollectionItemRecord {
  key: string;
  textValue: string;
  disabled?: boolean | undefined;
  element: HTMLElement | null;
}

const ListBoxContext = createContext<SelectableCollectionContextValue | null>(null);
const MenuContext = createContext<SelectableCollectionContextValue | null>(null);

function sortItems<TItem extends { element: HTMLElement | null }>(items: TItem[]) {
  return [...items].sort((a, b) => {
    if (!a.element || !b.element || a.element === b.element) return 0;
    return a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1;
  });
}

export type ListBoxProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: (value: string) => void;
  orientation?: "vertical" | "horizontal" | undefined;
};

export function ListBox({
  value,
  defaultValue,
  onChange,
  orientation = "vertical",
  onKeyDown,
  ref,
  ...props
}: ListBoxProps & RefProp<HTMLDivElement>) {
  const select = useSelectRootContext();
  const comboBox = useComboBoxRootContext();
  const picker = select ?? comboBox;
  const [selected, setSelected] = useControllableState({
    value: picker?.selectedKey ?? value,
    defaultValue: picker?.selectedKey ?? defaultValue ?? "",
    onChange: picker?.setSelectedKey ?? onChange,
  });
  const [activeKey, setActiveKey] = useState(selected);
  const activeKeyRef = useRef(activeKey);
  const selectedRef = useRef(selected);
  const itemMap = useRef(new Map<string, CollectionItemRecord>());

  useEffect(() => {
    selectedRef.current = selected;
    if (selected) {
      activeKeyRef.current = selected;
      setActiveKey(selected);
    }
  }, [selected]);

  useEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);

  const context: SelectableCollectionContextValue = {
    activeKey,
    selectedKey: selected,
    setActiveKey,
    setSelectedKey: setSelected,
    register(key, textValue, element, disabled) {
      if (element) {
        itemMap.current.set(key, { key, textValue, element, disabled });
        if (!selectedRef.current && !activeKeyRef.current && !disabled) {
          activeKeyRef.current = key;
          setActiveKey(key);
        }
      } else {
        itemMap.current.delete(key);
      }
    },
    items() {
      return sortItems([...itemMap.current.values()]);
    },
  };

  return (
    <ListBoxContext.Provider value={context}>
      <div
        {...props}
        ref={ref}
        id={props.id ?? picker?.listBoxId}
        role="listbox"
        aria-labelledby={props["aria-labelledby"] ?? picker?.labelId}
        aria-orientation={orientation}
        data-orientation={orientation}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (picker && event.key === "Escape") {
            event.preventDefault();
            picker.setOpen(false);
            document.getElementById(select?.triggerId ?? comboBox?.inputId ?? "")?.focus();
            return;
          }
          const items = context.items();
          const key =
            getRovingFocusTarget(items, selected, event.key, { orientation, loop: true }) ??
            (event.key.length === 1 ? findTypeaheadMatch(items, event.key, selected) : undefined);
          if (!key) return;
          event.preventDefault();
          setActiveKey(key);
          comboBox?.setActiveKey(key);
          setSelected(key);
          items.find((item) => item.key === key)?.element?.focus();
          if (picker && (event.key === "Enter" || event.key === " ")) picker.setOpen(false);
        }}
      />
    </ListBoxContext.Provider>
  );
}

export type ListBoxItemProps = Omit<HTMLAttributes<HTMLDivElement>, "id"> & {
  id: string;
  disabled?: boolean | undefined;
};

export function ListBoxItem({
  id,
  disabled,
  children,
  onClick,
  onKeyDown,
  ref,
  ...props
}: ListBoxItemProps & RefProp<HTMLDivElement>) {
  const listBox = useContext(ListBoxContext);
  const select = useSelectRootContext();
  const comboBox = useComboBoxRootContext();
  const autocomplete = useAutocompleteContext();
  const picker = select ?? comboBox;
  const registerPickerItem = picker?.registerItem;
  const unregisterPickerItem = picker?.unregisterItem;
  const resolvedDisabled = Boolean(disabled);
  const selected = listBox?.selectedKey === id;
  const active = !listBox?.selectedKey && listBox?.activeKey === id;
  let tabIndex: number | undefined = -1;
  if (resolvedDisabled) tabIndex = undefined;
  else if (selected || active) tabIndex = 0;
  const label = typeof children === "string" ? children : (props["aria-label"] ?? id);
  const visible = autocomplete?.isItemVisible(label) ?? true;

  useEffect(() => {
    if (!visible) return undefined;
    registerPickerItem?.(id, label);
    return () => unregisterPickerItem?.(id);
  }, [id, label, registerPickerItem, unregisterPickerItem, visible]);

  if (!visible) return null;

  return (
    <div
      {...props}
      ref={(element) => {
        listBox?.register(id, label, element, resolvedDisabled);
        composeRefs(ref)(element);
      }}
      id={id}
      role="option"
      tabIndex={tabIndex}
      aria-selected={selected}
      aria-disabled={resolvedDisabled || undefined}
      data-selected={dataAttr(selected)}
      data-disabled={dataAttr(resolvedDisabled)}
      data-value={id}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !resolvedDisabled) {
          listBox?.setActiveKey(id);
          comboBox?.setActiveKey(id);
          listBox?.setSelectedKey(id);
          autocomplete?.selectItem(id, label);
          picker?.setOpen(false);
          document.getElementById(select?.triggerId ?? comboBox?.inputId ?? "")?.focus();
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        listBox?.setActiveKey(id);
        comboBox?.setActiveKey(id);
        listBox?.setSelectedKey(id);
        autocomplete?.selectItem(id, label);
        picker?.setOpen(false);
        document.getElementById(select?.triggerId ?? comboBox?.inputId ?? "")?.focus();
      }}
    >
      {children}
    </div>
  );
}

export type MenuProps = HTMLAttributes<HTMLDivElement>;

export function Menu({ onKeyDown, ref, ...props }: MenuProps & RefProp<HTMLDivElement>) {
  const itemMap = useRef(new Map<string, CollectionItemRecord>());
  const selectedRef = useRef("");
  const comboBox = useComboBoxRootContext();
  const autocomplete = useAutocompleteContext();
  const context: SelectableCollectionContextValue = {
    activeKey: selectedRef.current,
    selectedKey: selectedRef.current,
    setActiveKey(key) {
      selectedRef.current = key;
    },
    setSelectedKey(key) {
      selectedRef.current = key;
    },
    register(key, textValue, element, disabled) {
      if (element) itemMap.current.set(key, { key, textValue, element, disabled });
      else itemMap.current.delete(key);
    },
    items() {
      return sortItems([...itemMap.current.values()]);
    },
  };

  return (
    <MenuContext.Provider value={context}>
      <InteractiveDiv
        {...props}
        ref={ref}
        id={props.id ?? comboBox?.listBoxId}
        role={props.role ?? (autocomplete ? "listbox" : "menu")}
        aria-labelledby={props["aria-labelledby"] ?? comboBox?.labelId}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const items = context.items();
          const current =
            document.activeElement instanceof HTMLElement ? document.activeElement.id : undefined;
          const key =
            getRovingFocusTarget(items, current, event.key, {
              orientation: "vertical",
              loop: true,
            }) ??
            (event.key.length === 1 ? findTypeaheadMatch(items, event.key, current) : undefined);
          if (!key) return;
          event.preventDefault();
          context.setActiveKey(key);
          items.find((item) => item.key === key)?.element?.focus();
        }}
      />
    </MenuContext.Provider>
  );
}

export type MenuItemProps = Omit<HTMLAttributes<HTMLDivElement>, "id"> & {
  id: string;
  disabled?: boolean | undefined;
};

export function MenuItem({
  id,
  disabled,
  children,
  onClick,
  onKeyDown,
  ref,
  ...props
}: MenuItemProps & RefProp<HTMLDivElement>) {
  const menu = useContext(MenuContext);
  const comboBox = useComboBoxRootContext();
  const autocomplete = useAutocompleteContext();
  const registerPickerItem = comboBox?.registerItem;
  const unregisterPickerItem = comboBox?.unregisterItem;
  const resolvedDisabled = Boolean(disabled);
  const label = typeof children === "string" ? children : (props["aria-label"] ?? id);
  const visible = autocomplete?.isItemVisible(label) ?? true;

  useEffect(() => {
    if (!visible) return undefined;
    registerPickerItem?.(id, label);
    return () => unregisterPickerItem?.(id);
  }, [id, label, registerPickerItem, unregisterPickerItem, visible]);

  if (!visible) return null;

  return (
    <InteractiveDiv
      {...props}
      ref={(element) => {
        menu?.register(id, label, element, resolvedDisabled);
        composeRefs(ref)(element);
      }}
      id={id}
      role={props.role ?? (autocomplete ? "option" : "menuitem")}
      tabIndex={resolvedDisabled ? undefined : -1}
      aria-selected={autocomplete ? comboBox?.selectedKey === id : undefined}
      aria-disabled={resolvedDisabled || undefined}
      data-disabled={dataAttr(resolvedDisabled)}
      data-selected={dataAttr(autocomplete ? comboBox?.selectedKey === id : undefined)}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || resolvedDisabled) event.preventDefault();
        if (!event.defaultPrevented && autocomplete) {
          comboBox?.setActiveKey(id);
          comboBox?.setSelectedKey(id);
          autocomplete.selectItem(id, label);
          comboBox?.setOpen(false);
          document.getElementById(comboBox?.inputId ?? "")?.focus();
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (!resolvedDisabled) event.currentTarget.click();
      }}
    >
      {children}
    </InteractiveDiv>
  );
}

export type MenuSectionProps = HTMLAttributes<HTMLDivElement>;

export function MenuSection(props: MenuSectionProps & RefProp<HTMLDivElement>) {
  const { ref } = props;
  return <div {...props} ref={ref} role={props.role ?? "group"} />;
}

export type ListBoxSectionProps = HTMLAttributes<HTMLDivElement>;

export function ListBoxSection(props: ListBoxSectionProps & RefProp<HTMLDivElement>) {
  const { ref } = props;
  return <div {...props} ref={ref} role={props.role ?? "group"} />;
}
