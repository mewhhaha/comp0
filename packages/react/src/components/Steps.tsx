import { useCallback, useId, useState } from "react";
import { useCollectionRegistry, useControllableState, type CollectionNode } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { StepsContext } from "./steps-shared.js";
import { type StepsProps } from "./steps-shared.js";
import { ProviderRoot } from "./provider-root.js";
export type { StepsProps } from "./steps-shared.js";

export function Steps({
  as,
  children,
  value,
  defaultValue,
  onChange,
  ref,
  ...props
}: StepsProps & RefProp<HTMLElement>) {
  const baseId = useId();
  const [currentValue, setCurrentValue] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const { register, getItems } = useCollectionRegistry<string>();
  const [order, setOrder] = useState<string[]>([]);

  // The registration identity feeds a layout-effect dependency in every
  // StepsItem; useCallback keeps items from unregistering on unrelated renders.
  const registerItem = useCallback(
    (node: CollectionNode<string>) => {
      const syncOrder = () => {
        setOrder((previous) => {
          const next = getItems().map((item) => item.value);
          if (
            next.length === previous.length &&
            next.every((entry, index) => entry === previous[index])
          ) {
            return previous;
          }
          return next;
        });
      };
      const unregister = register(node);
      syncOrder();
      return () => {
        unregister();
        syncOrder();
      };
    },
    [getItems, register],
  );

  return (
    <StepsContext value={{ baseId, currentValue, order, setCurrentValue, registerItem }}>
      <ProviderRoot as={as} {...props} ref={ref} data-slot={dataSlot(props, "steps")}>
        {children}
      </ProviderRoot>
    </StepsContext>
  );
}
