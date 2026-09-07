import { useState } from "react";
import {
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  ArrowDownRightIcon,
  Squares2X2Icon,
  EllipsisHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Connect,
  ConnectCard,
  ConnectDisconnect,
  ConnectInput,
  ConnectInputSelect,
  ConnectInputTrigger,
  ConnectLines,
  ConnectOutput,
  Popover,
  PopoverOverlay,
  PopoverTrigger,
  Inventory,
  InventoryItem,
  InventoryMoveHandle,
  InventoryResizeHandle,
  type ConnectConnection,
  type InventoryLayout,
} from "@comp0/react";

const cards = [
  {
    value: "coordinates",
    label: "Texture Coordinate",
    symbol: "⌖",
    outputs: [
      { symbol: "⊞", value: "generated", label: "Generated", kind: "vector" },
      { symbol: "↑", value: "normal", label: "Normal", kind: "vector" },
      { symbol: "↗", value: "uv", label: "UV", kind: "vector" },
    ],
    inputs: [],
  },
  {
    value: "noise",
    label: "Noise Texture",
    symbol: "∿",
    outputs: [
      { symbol: "◉", value: "color", label: "Color", kind: "color" },
      { symbol: "ƒ", value: "fac", label: "Fac", kind: "value" },
    ],
    inputs: [{ symbol: "↗", value: "vector", label: "Vector", kind: "vector" }],
  },
  {
    value: "shader",
    label: "Principled BSDF",
    symbol: "◈",
    outputs: [],
    inputs: [
      { symbol: "◉", value: "base-color", label: "Base Color", kind: "color" },
      { symbol: "≈", value: "roughness", label: "Roughness", kind: "value" },
    ],
  },
];

const initialLayout: InventoryLayout = [
  { value: "coordinates", column: 1, row: 2, columnSpan: 3, rowSpan: 9 },
  { value: "noise", column: 5, row: 1, columnSpan: 4, rowSpan: 9 },
  { value: "shader", column: 10, row: 4, columnSpan: 4, rowSpan: 11 },
];

const initialConnections: readonly ConnectConnection[] = [
  { from: "generated", to: "vector" },
  { from: "fac", to: "roughness" },
  { from: "color", to: "base-color" },
];

export function Example() {
  const [view, setView] = useState<"cards" | "canvas">("cards");
  const [connections, setConnections] = useState(initialConnections);
  const [layout, setLayout] = useState(initialLayout);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [layoutMessage, setLayoutMessage] = useState("");

  const cardElements = cards.map((card) => {
    const content = (
      <ConnectCard
        key={card.value}
        value={card.value}
        label={card.label}
        tabIndex={view === "canvas" ? -1 : 0}
        className="relative h-full min-w-0 border-0 p-0 outline-teal-600 focus-visible:outline-2 dark:outline-teal-400"
      >
        <legend className="sr-only">{card.label}</legend>
        <div className="mb-3 flex h-11 items-center justify-center" title={card.label}>
          {view === "canvas" ? (
            <InventoryMoveHandle
              title={`Move ${card.label}`}
              className="grid size-11 cursor-grab touch-none place-items-center rounded-lg text-zinc-500 outline-teal-600 focus-visible:outline-2 dark:outline-teal-400"
            >
              <span aria-hidden="true" className="text-2xl">
                {card.symbol}
              </span>
            </InventoryMoveHandle>
          ) : (
            <span aria-hidden="true" className="text-2xl text-zinc-500">
              {card.symbol}
            </span>
          )}
        </div>
        <div className="flex justify-between gap-1">
          {card.inputs.length > 0 && (
            <div className="grid content-start gap-3">
              {card.inputs.map((port) => (
                <ConnectInput
                  key={port.value}
                  value={port.value}
                  label={port.label}
                  kind={port.kind}
                  className="grid justify-items-center"
                >
                  <ConnectInputTrigger
                    value={port.value}
                    title={port.label}
                    className="relative grid size-11 place-items-center rounded-xl border-2 border-teal-400 bg-teal-50 text-xl outline-teal-600 focus-visible:outline-2 data-available:ring-4 data-available:ring-teal-600/20 dark:border-teal-600 dark:bg-teal-950 dark:outline-teal-400"
                  >
                    <span aria-hidden="true">{port.symbol}</span>
                  </ConnectInputTrigger>
                  <Popover>
                    <PopoverTrigger
                      aria-label={`Edit ${card.label}: ${port.label} source`}
                      title={`Edit ${port.label} source`}
                      className="grid size-11 place-items-center rounded-lg text-zinc-500 outline-teal-600 focus-visible:outline-2 dark:outline-teal-400"
                    >
                      <EllipsisHorizontalIcon aria-hidden="true" className="size-5" />
                    </PopoverTrigger>
                    <PopoverOverlay
                      aria-label={`${card.label}: ${port.label} source`}
                      placement="bottom"
                      offset={4}
                      className="w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      <p className="mb-2 text-sm font-medium">{port.label}</p>
                      <ConnectInputSelect className="min-h-11 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2 text-base outline-teal-600 focus-visible:outline-2 dark:border-zinc-700 dark:bg-zinc-900 dark:outline-teal-400" />
                      <ConnectDisconnect
                        title="Disconnect"
                        className="mt-2 grid size-11 place-items-center rounded-lg outline-teal-600 focus-visible:outline-2 disabled:opacity-40 dark:outline-teal-400"
                      >
                        <XMarkIcon aria-hidden="true" className="size-5" />
                      </ConnectDisconnect>
                    </PopoverOverlay>
                  </Popover>
                </ConnectInput>
              ))}
            </div>
          )}
          {card.outputs.length > 0 && (
            <div className="ml-auto grid content-start gap-3">
              {card.outputs.map((port) => (
                <ConnectOutput
                  key={port.value}
                  value={port.value}
                  label={port.label}
                  kind={port.kind}
                  title={port.label}
                  className="relative grid size-11 place-items-center rounded-full border-2 border-amber-400 bg-amber-50 text-xl outline-teal-600 focus-visible:outline-2 data-selected:ring-4 data-selected:ring-teal-600/20 dark:border-amber-600 dark:bg-amber-950 dark:outline-teal-400"
                >
                  <span aria-hidden="true">{port.symbol}</span>
                </ConnectOutput>
              ))}
            </div>
          )}
        </div>
        {view === "canvas" && (
          <InventoryResizeHandle
            title={`Resize ${card.label}`}
            className="mt-3 ml-auto grid size-11 touch-none place-items-center rounded-lg text-zinc-500 outline-teal-600 focus-visible:outline-2 dark:outline-teal-400"
          >
            <ArrowDownRightIcon aria-hidden="true" className="size-5" />
          </InventoryResizeHandle>
        )}
      </ConnectCard>
    );
    if (view === "canvas")
      return (
        <InventoryItem
          key={card.value}
          value={card.value}
          textValue={card.label}
          className="relative min-w-0 outline-teal-600 focus-visible:outline-2 dark:outline-teal-400"
        >
          {content}
        </InventoryItem>
      );
    return content;
  });
  let board = (
    <div className="grid grid-cols-[2.75rem_minmax(5.75rem,1fr)_2.75rem] gap-5">{cardElements}</div>
  );
  if (view === "canvas")
    board = (
      <Inventory
        aria-label="Material cards"
        columns={14}
        rows={18}
        value={layout}
        onChange={(next) => {
          setLayout(next);
          setDrafts({});
        }}
        canChange={(next) =>
          next.every((placement) => {
            const minimum = initialLayout.find((entry) => entry.value === placement.value)!;
            return (
              placement.columnSpan >= minimum.columnSpan && placement.rowSpan >= minimum.rowSpan
            );
          })
        }
        className="h-[32rem] list-none gap-2"
      >
        {cardElements}
      </Inventory>
    );

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Shader</h2>
          <p className="mt-1 max-w-xl text-sm/5 text-zinc-600 dark:text-zinc-400">Tap ○ → ▢.</p>
        </div>
        <button
          type="button"
          aria-label="Reset"
          title="Reset"
          className="grid size-11 place-items-center shrink-0 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-teal-600 focus-visible:outline-2 dark:border-zinc-700 dark:outline-teal-400"
          onClick={() => {
            setLayout(initialLayout);
            setDrafts({});
            setConnections(initialConnections);
            setLayoutMessage("Layout and connections reset.");
          }}
        >
          <ArrowPathIcon aria-hidden="true" className="size-5" />
        </button>
      </div>
      <fieldset className="mb-3 flex flex-wrap gap-2" aria-label="Connection view">
        {(["cards", "canvas"] as const).map((choice) => (
          <button
            key={choice}
            type="button"
            aria-label={choice === "cards" ? "Cards" : "Canvas"}
            title={choice === "cards" ? "Cards" : "Canvas"}
            aria-pressed={view === choice}
            onClick={() => setView(choice)}
            className="grid size-11 place-items-center rounded-lg border border-zinc-200 text-sm outline-teal-600 aria-pressed:border-teal-600 aria-pressed:bg-teal-50 focus-visible:outline-2 dark:border-zinc-700 dark:outline-teal-400 dark:aria-pressed:bg-teal-950"
          >
            {choice === "cards" ? (
              <Squares2X2Icon aria-hidden="true" className="size-5" />
            ) : (
              <ArrowsPointingOutIcon aria-hidden="true" className="size-5" />
            )}
          </button>
        ))}
      </fieldset>
      <div className="overflow-x-auto">
        <Connect
          aria-label="Procedural bronze connections"
          value={connections}
          onChange={setConnections}
          className={`relative py-2 ${view === "canvas" ? "min-w-[32rem]" : ""}`}
        >
          <ConnectLines className="text-teal-600 dark:text-teal-400" />
          {board}
        </Connect>
      </div>
      {view === "canvas" && (
        <details className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          <summary className="w-fit cursor-pointer rounded py-2 font-medium outline-teal-600 focus-visible:outline-2 dark:outline-teal-400">
            Layout
          </summary>
          <div className="mt-3 grid gap-3">
            {cards.map((card) => {
              const entry = layout.find((placement) => placement.value === card.value)!;
              const minimum = initialLayout.find((placement) => placement.value === card.value)!;
              return (
                <form
                  key={card.value}
                  className="flex flex-wrap items-end gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const fields = new FormData(event.currentTarget);
                    const next = {
                      value: card.value,
                      column: Number(fields.get("column")),
                      row: Number(fields.get("row")),
                      columnSpan: Number(fields.get("columnSpan")),
                      rowSpan: Number(fields.get("rowSpan")),
                    };
                    const outside =
                      next.column + next.columnSpan > 15 || next.row + next.rowSpan > 19;
                    const overlaps = layout.some(
                      (placement) =>
                        placement.value !== card.value &&
                        next.column < placement.column + placement.columnSpan &&
                        next.column + next.columnSpan > placement.column &&
                        next.row < placement.row + placement.rowSpan &&
                        next.row + next.rowSpan > placement.row,
                    );
                    if (outside || overlaps) {
                      setLayoutMessage(
                        `${card.label} must fit inside the board without overlapping another card.`,
                      );
                      return;
                    }
                    setLayout(
                      layout.map((placement) =>
                        placement.value === card.value ? next : placement,
                      ),
                    );
                    setDrafts({ ...drafts, [card.value]: {} });
                    setLayoutMessage(
                      `${card.label} moved to column ${next.column}, row ${next.row}, spanning ${next.columnSpan} columns and ${next.rowSpan} rows.`,
                    );
                  }}
                >
                  <span className="w-36 self-center font-medium">{card.label}</span>
                  {(
                    [
                      { name: "column", label: "Column", min: 1, max: 14 },
                      { name: "row", label: "Row", min: 1, max: 18 },
                      { name: "columnSpan", label: "Width", min: minimum.columnSpan, max: 14 },
                      { name: "rowSpan", label: "Height", min: minimum.rowSpan, max: 18 },
                    ] as const
                  ).map((field) => (
                    <label key={field.name} className="grid gap-1">
                      {field.label}
                      <input
                        aria-label={`${card.label} ${field.label.toLowerCase()}`}
                        name={field.name}
                        type="number"
                        min={field.min}
                        max={field.max}
                        required
                        value={drafts[card.value]?.[field.name] ?? String(entry[field.name])}
                        onChange={(event) =>
                          setDrafts({
                            ...drafts,
                            [card.value]: {
                              ...drafts[card.value],
                              [field.name]: event.currentTarget.value,
                            },
                          })
                        }
                        className="min-h-11 w-16 rounded border border-zinc-200 bg-white px-2 text-base outline-teal-600 focus-visible:outline-2 dark:border-zinc-700 dark:bg-zinc-900 dark:outline-teal-400"
                      />
                    </label>
                  ))}
                  <button
                    type="submit"
                    className="min-h-11 rounded border border-zinc-200 px-3 outline-teal-600 focus-visible:outline-2 dark:border-zinc-700 dark:outline-teal-400"
                  >
                    Apply {card.label}
                  </button>
                </form>
              );
            })}
          </div>
        </details>
      )}
      <output aria-live="polite" className="mt-3 text-sm/5 text-zinc-600 dark:text-zinc-400">
        {layoutMessage}
      </output>
    </div>
  );
}
