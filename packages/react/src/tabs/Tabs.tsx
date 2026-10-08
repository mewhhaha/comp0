import { useId, type ReactNode } from "react";
import { useCollection, useControllableState } from "@comp0/core";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { TabsContext } from "./tabs-shared.js";

export type TabsProps = RootProps<{
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the selected tab value rather than a DOM ChangeEvent. */
  onChange?: ((value: string) => void) | undefined;
  children?: ReactNode | undefined;
}>;

export function Tabs({ as, children, value, defaultValue, onChange, ...props }: TabsProps) {
  const baseId = useId();
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const collection = useCollection();

  const Root = rootElement(as);
  return (
    <TabsContext value={{ baseId, selectedKey: selected, setSelectedKey: setSelected, collection }}>
      <Root data-slot="tabs" {...props}>
        {children}
      </Root>
    </TabsContext>
  );
}
