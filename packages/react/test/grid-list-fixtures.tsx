import { act, useState } from "react";
import { vi } from "vitest";
import { setup } from "./render.js";
import { GridList } from "../src/grid-list/GridList.js";
import { GridListDragHandle } from "../src/grid-list/GridListDragHandle.js";
import { GridListItem } from "../src/grid-list/GridListItem.js";
import { GridListMoveButton } from "../src/grid-list/GridListMoveButton.js";
import {
  GridListReorderGroup,
  type GridListMove,
  type GridListOrder,
} from "../src/grid-list/GridListReorderGroup.js";

export function renderGridList(onChange = vi.fn(), ownerDocument?: Document) {
  const result = setup(
    <GridList aria-label="Files" onChange={onChange}>
      <GridListItem value="report">
        report.pdf <button type="button">Share</button> <button type="button">Delete</button>
      </GridListItem>
      <GridListItem value="notes" disabled>
        notes.txt
      </GridListItem>
      <GridListItem value="photo">photo.png</GridListItem>
    </GridList>,
    ownerDocument,
  );
  const rows = result.container.querySelectorAll<HTMLElement>("[role='row']");
  return { ...result, onChange, rows };
}

export function thrownEvidence(callback: () => void) {
  try {
    callback();
  } catch (error) {
    if (error instanceof AggregateError) return error.errors.map(String).join("\n");
    return String(error);
  }
  return "";
}

export function GroupedLists({
  initial,
  spy,
  canMove,
  disabledValues = [],
}: {
  initial: Record<string, string[]>;
  spy: (value: Record<string, string[]>, move: GridListMove) => void;
  canMove?: ((value: GridListOrder, move: GridListMove) => boolean) | undefined;
  disabledValues?: readonly string[] | undefined;
}) {
  const [order, setOrder] = useState(initial);
  const names = Object.keys(order);

  return (
    <GridListReorderGroup
      value={order}
      canMove={canMove}
      onChange={(next, move) => {
        spy(next, move);
        setOrder(next);
      }}
    >
      {names.map((name) => (
        <GridList key={name} name={name} aria-label={name}>
          {order[name]!.map((rowValue) => (
            <GridListItem
              key={rowValue}
              value={rowValue}
              textValue={rowValue}
              disabled={disabledValues.includes(rowValue)}
            >
              <GridListDragHandle>Move</GridListDragHandle>
              {rowValue}
              {names
                .filter((targetName) => targetName !== name)
                .map((targetName) => (
                  <GridListMoveButton key={targetName} to={targetName}>
                    Move to {targetName}
                  </GridListMoveButton>
                ))}
            </GridListItem>
          ))}
        </GridList>
      ))}
    </GridListReorderGroup>
  );
}

export type ControlledGroupedListsProps = {
  order: Record<string, string[]>;
  onChange: (value: Record<string, string[]>, move: GridListMove) => void;
  canMove?: ((value: GridListOrder, move: GridListMove) => boolean) | undefined;
  pending?: boolean | undefined;
  showDone?: boolean | undefined;
  disabledValues?: readonly string[] | undefined;
};

export function ControlledGroupedLists({
  order,
  onChange,
  canMove,
  pending,
  showDone = true,
  disabledValues = [],
}: ControlledGroupedListsProps) {
  return (
    <GridListReorderGroup value={order} onChange={onChange} canMove={canMove} pending={pending}>
      <button type="button" data-outside-focus>
        Outside
      </button>
      <GridList name="todo" aria-label="To do">
        {order["todo"]!.map((rowValue) => (
          <GridListItem
            key={rowValue}
            value={rowValue}
            textValue={rowValue}
            disabled={disabledValues.includes(rowValue)}
          >
            {rowValue}
            <GridListMoveButton to="done">Move to done</GridListMoveButton>
            <button type="button" data-row-details>
              Details
            </button>
          </GridListItem>
        ))}
      </GridList>
      {showDone && (
        <GridList name="done" aria-label="Done">
          {order["done"]!.map((rowValue) => (
            <GridListItem
              key={rowValue}
              value={rowValue}
              textValue={rowValue}
              disabled={disabledValues.includes(rowValue)}
            >
              {rowValue}
              <GridListMoveButton to="todo">Move to todo</GridListMoveButton>
              <button type="button" data-row-details>
                Details
              </button>
            </GridListItem>
          ))}
        </GridList>
      )}
    </GridListReorderGroup>
  );
}

export type PendingControlledGroupedListsProps = Omit<ControlledGroupedListsProps, "pending"> & {
  settled?: boolean | undefined;
};

export function PendingControlledGroupedLists({
  onChange,
  settled = false,
  ...props
}: PendingControlledGroupedListsProps) {
  const [started, setStarted] = useState(false);
  const pending = started && !settled;

  return (
    <ControlledGroupedLists
      {...props}
      pending={pending}
      onChange={(next, move) => {
        setStarted(true);
        onChange(next, move);
      }}
    />
  );
}

export function ReorderableList({
  spy,
  canReorder,
  withHandle = false,
}: {
  spy: (values: string[]) => void;
  canReorder?: ((values: string[], moved: string) => boolean) | undefined;
  withHandle?: boolean;
}) {
  const [files, setFiles] = useState(["report.pdf", "photos.zip", "notes.txt"]);
  return (
    <GridList
      aria-label="Files"
      canReorder={canReorder}
      onReorder={(next) => {
        spy(next);
        setFiles(next);
      }}
    >
      {files.map((name) => (
        <GridListItem key={name} value={name} textValue={name}>
          <span data-slot="row-label">{name}</span>
          {withHandle && <GridListDragHandle>⋮⋮</GridListDragHandle>}
        </GridListItem>
      ))}
    </GridList>
  );
}

export function fireDrag(element: Element, type: string, clientY = 0) {
  act(() => {
    element.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientY }));
  });
}

export const flushTimers = () => act(() => new Promise<void>((resolve) => setTimeout(resolve)));

/** Focuses `element` when it is not already focused, then types `keys` into the active element. */
export async function press(
  user: ReturnType<typeof setup>["user"],
  element: Element,
  keys: string,
) {
  if (document.activeElement !== element && element instanceof HTMLElement) {
    act(() => element.focus());
  }
  await user.keyboard(keys);
}
