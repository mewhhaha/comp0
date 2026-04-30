import { type RefProp } from "./shared.js";
import {
  createContext,
  useContext,
  useId,
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type DetailsHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { composeRefs, dataAttr, getRovingFocusTarget, useControllableState } from "@comp0/core";

interface DisclosureContextValue {
  open: boolean;
  panelId: string;
}

const DisclosureContext = createContext<DisclosureContextValue | null>(null);

export type DisclosureProps = Omit<
  DetailsHTMLAttributes<HTMLDetailsElement>,
  "open" | "onToggle" | "onChange" | "children"
> & {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onChange?: (open: boolean) => void;
  children?: ReactNode;
};

export function Disclosure({
  children,
  id,
  open: openProp,
  defaultOpen = false,
  onChange,
  ref,
  ...props
}: DisclosureProps & RefProp<HTMLDetailsElement>) {
  const generatedId = useId();
  const panelId = `${id ?? generatedId}-panel`;
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange,
  });

  return (
    <DisclosureContext.Provider value={{ open, panelId }}>
      <details
        {...props}
        ref={ref}
        id={id}
        open={open}
        data-open={dataAttr(open)}
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        {children}
      </details>
    </DisclosureContext.Provider>
  );
}

export type DisclosureTriggerProps = HTMLAttributes<HTMLElement>;

export function DisclosureTrigger(props: DisclosureTriggerProps & RefProp<HTMLElement>) {
  const { ref } = props;
  const disclosure = useContext(DisclosureContext);
  return (
    <summary
      {...props}
      ref={ref as never}
      aria-expanded={disclosure?.open}
      aria-controls={disclosure?.panelId}
      data-open={dataAttr(disclosure?.open)}
    />
  );
}

export type DisclosurePanelProps = HTMLAttributes<HTMLDivElement>;

export function DisclosurePanel({
  id,
  ref,
  ...props
}: DisclosurePanelProps & RefProp<HTMLDivElement>) {
  const disclosure = useContext(DisclosureContext);
  return (
    <div
      {...props}
      ref={ref}
      id={id ?? disclosure?.panelId}
      data-open={dataAttr(disclosure?.open)}
    />
  );
}

interface TabsContextValue {
  selectedKey: string;
  setSelectedKey: (key: string) => void;
  registerTab: (key: string, element: HTMLButtonElement | null, disabled?: boolean) => void;
  tabs: () => { key: string; disabled?: boolean | undefined; element: HTMLButtonElement | null }[];
}

const TabsContext = createContext<TabsContextValue | null>(null);

export type TabsProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: (value: string) => void;
};

export function Tabs({
  value,
  defaultValue,
  onChange,
  ref,
  ...props
}: TabsProps & RefProp<HTMLDivElement>) {
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const tabMap = useRef(
    new Map<
      string,
      { key: string; disabled?: boolean | undefined; element: HTMLButtonElement | null }
    >(),
  );

  return (
    <TabsContext.Provider
      value={{
        selectedKey: selected,
        setSelectedKey: setSelected,
        registerTab(key, element, disabled) {
          tabMap.current.set(key, { key, element, disabled });
        },
        tabs() {
          return [...tabMap.current.values()].sort((a, b) => {
            if (!a.element || !b.element) return 0;
            if (a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_PRECEDING) {
              return 1;
            }
            return -1;
          });
        },
      }}
    >
      <div {...props} ref={ref} />
    </TabsContext.Provider>
  );
}

export type TabListProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical" | undefined;
};

export function TabList({
  orientation = "horizontal",
  onKeyDown,
  ref,
  ...props
}: TabListProps & RefProp<HTMLDivElement>) {
  const tabs = useContext(TabsContext);

  return (
    <div
      {...props}
      ref={ref}
      role="tablist"
      aria-orientation={orientation}
      data-orientation={orientation}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !tabs) return;
        const targetKey = getRovingFocusTarget(tabs.tabs(), tabs.selectedKey, event.key, {
          orientation,
          loop: true,
        });
        if (!targetKey) return;
        event.preventDefault();
        tabs.setSelectedKey(targetKey);
        tabs
          .tabs()
          .find((item) => item.key === targetKey)
          ?.element?.focus();
      }}
    />
  );
}

export type TabProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> & {
  id?: string | undefined;
  tabKey: string;
};

export function Tab({
  tabKey,
  disabled,
  id,
  onClick,
  ref,
  ...props
}: TabProps & RefProp<HTMLButtonElement>) {
  const tabs = useContext(TabsContext);
  const resolvedDisabled = Boolean(disabled);
  const selected = tabs?.selectedKey === tabKey;
  const tabId = id ?? `tab-${tabKey}`;
  const panelId = `${tabId}-panel`;

  return (
    <button
      {...props}
      ref={(element) => {
        tabs?.registerTab(tabKey, element, resolvedDisabled);
        composeRefs(ref)(element);
      }}
      id={tabId}
      type="button"
      role="tab"
      tabIndex={selected ? 0 : -1}
      aria-selected={selected}
      aria-controls={panelId}
      disabled={resolvedDisabled}
      data-selected={dataAttr(selected)}
      data-disabled={dataAttr(resolvedDisabled)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !resolvedDisabled) tabs?.setSelectedKey(tabKey);
      }}
    />
  );
}

export type TabPanelProps = HTMLAttributes<HTMLDivElement> & {
  tabKey: string;
};

export function TabPanel({ tabKey, id, ref, ...props }: TabPanelProps & RefProp<HTMLDivElement>) {
  const tabs = useContext(TabsContext);
  const selected = tabs?.selectedKey === tabKey;
  const tabId = `tab-${tabKey}`;

  return (
    <div
      {...props}
      ref={ref}
      id={id ?? `${tabId}-panel`}
      role="tabpanel"
      aria-labelledby={tabId}
      hidden={!selected}
      data-selected={dataAttr(selected)}
    />
  );
}

export type BreadcrumbsProps = HTMLAttributes<HTMLElement> & {
  "aria-label"?: string | undefined;
};

export function Breadcrumbs({
  "aria-label": ariaLabel = "Breadcrumbs",
  ref,
  ...props
}: BreadcrumbsProps & RefProp<HTMLElement>) {
  return <nav {...props} ref={ref} aria-label={ariaLabel} />;
}

export type BreadcrumbLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  current?: boolean | undefined;
};

export function BreadcrumbLink({
  current,
  children,
  ref,
  ...props
}: BreadcrumbLinkProps & RefProp<HTMLAnchorElement>) {
  const resolvedCurrent = Boolean(current);
  return (
    <a
      {...props}
      ref={ref}
      aria-current={resolvedCurrent ? "page" : undefined}
      data-current={dataAttr(resolvedCurrent)}
    >
      {children}
    </a>
  );
}
