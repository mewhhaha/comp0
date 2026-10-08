import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { labelsMatch, resolveListLabel } from "./grid-list-group-order.js";
import { type GridListOrder } from "./grid-list-shared.js";

type RegisteredList = {
  element: HTMLElement;
  observer: MutationObserver | null;
};

export type RegisteredRow = {
  list: string;
  label: string;
  element: HTMLElement;
  disabled: boolean;
};

/**
 * The lists and rows registered with a GridListReorderGroup, plus each list's
 * accessible name, kept current while its aria-label or labelling element changes.
 */
export function useGridListGroupRegistry(order: GridListOrder, children: ReactNode) {
  const lists = useRef(new Map<string, RegisteredList>());
  const rows = useRef(new Map<string, RegisteredRow>());
  const [listLabels, setListLabels] = useState<Record<string, string>>({});
  const listLabelsRef = useRef(listLabels);
  listLabelsRef.current = listLabels;

  useLayoutEffect(() => {
    const nextLabels = Object.fromEntries(
      Object.keys(order).map((name) => [
        name,
        resolveListLabel(name, lists.current.get(name)?.element),
      ]),
    );
    if (labelsMatch(listLabelsRef.current, nextLabels)) return;
    listLabelsRef.current = nextLabels;
    setListLabels(nextLabels);
  }, [children, order]);

  return {
    listLabel: (name: string) => listLabels[name] ?? name,
    /** The list's name read from the DOM now, rather than from the last rendered snapshot. */
    liveListLabel: (name: string) => resolveListLabel(name, lists.current.get(name)?.element),
    row: (value: string) => rows.current.get(value),
    rowLabel: (value: string) => rows.current.get(value)?.label ?? value,
    registerList(name: string, element: HTMLElement) {
      const registered = lists.current.get(name);
      if (registered && registered.element !== element) {
        throw new Error(
          `GridList name "${name}" is rendered more than once inside GridListReorderGroup.`,
        );
      }
      if (registered) return;

      let observer: MutationObserver | null = null;
      const updateLabel = () => {
        observer?.disconnect();
        observer?.observe(element, {
          attributes: true,
          attributeFilter: ["aria-label", "aria-labelledby"],
        });
        const labelledBy = element.getAttribute("aria-labelledby")?.trim().split(/\s+/) ?? [];
        for (const id of labelledBy) {
          const labelElement = element.ownerDocument.getElementById(id);
          if (labelElement) {
            observer?.observe(labelElement, {
              childList: true,
              characterData: true,
              subtree: true,
            });
          }
        }
        const label = resolveListLabel(name, element);
        if (listLabelsRef.current[name] === label) return;
        const nextLabels = { ...listLabelsRef.current, [name]: label };
        listLabelsRef.current = nextLabels;
        setListLabels(nextLabels);
      };
      const MutationObserver = element.ownerDocument.defaultView?.MutationObserver;
      if (MutationObserver) observer = new MutationObserver(updateLabel);
      lists.current.set(name, { element, observer });
      updateLabel();
    },
    unregisterList(name: string, element: HTMLElement) {
      const registered = lists.current.get(name);
      if (registered?.element !== element) return;
      registered.observer?.disconnect();
      lists.current.delete(name);
    },
    registerRow(
      list: string,
      rowValue: string,
      label: string,
      element: HTMLElement,
      disabled: boolean,
    ) {
      const registered = rows.current.get(rowValue);
      if (registered && registered.element !== element) {
        throw new Error(
          `GridListItem value "${rowValue}" is rendered more than once inside GridListReorderGroup (in "${registered.list}" and "${list}").`,
        );
      }
      rows.current.set(rowValue, { list, label, element, disabled });
    },
    unregisterRow(list: string, rowValue: string, element: HTMLElement) {
      const registered = rows.current.get(rowValue);
      if (registered?.list === list && registered.element === element) {
        rows.current.delete(rowValue);
      }
    },
  };
}
