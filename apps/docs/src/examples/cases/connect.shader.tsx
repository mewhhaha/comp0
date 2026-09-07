import { useState } from "react";
import {
  Connect,
  ConnectCard,
  ConnectDisconnect,
  ConnectInput,
  ConnectInputSelect,
  ConnectInputTrigger,
  ConnectLines,
  ConnectOutput,
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
    outputs: [
      { value: "generated", label: "Generated", kind: "vector" },
      { value: "normal", label: "Normal", kind: "vector" },
      { value: "uv", label: "UV", kind: "vector" },
    ],
    inputs: [],
  },
  {
    value: "noise",
    label: "Noise Texture",
    outputs: [
      { value: "fac", label: "Fac", kind: "value" },
      { value: "color", label: "Color", kind: "color" },
    ],
    inputs: [
      { value: "vector", label: "Vector", kind: "vector" },
      { value: "scale", label: "Scale", kind: "value" },
      { value: "detail", label: "Detail", kind: "value" },
      { value: "noise-roughness", label: "Roughness", kind: "value" },
    ],
  },
  {
    value: "shader",
    label: "Principled BSDF",
    outputs: [],
    inputs: [
      { value: "base-color", label: "Base Color", kind: "color" },
      { value: "roughness", label: "Roughness", kind: "value" },
      { value: "metallic", label: "Metallic", kind: "value" },
      { value: "shader-normal", label: "Normal", kind: "vector" },
    ],
  },
];

const initialLayout: InventoryLayout = [
  { value: "coordinates", column: 1, row: 2, columnSpan: 3, rowSpan: 6 },
  { value: "noise", column: 5, row: 1, columnSpan: 4, rowSpan: 14 },
  { value: "shader", column: 10, row: 4, columnSpan: 4, rowSpan: 12 },
];

const initialConnections: readonly ConnectConnection[] = [
  { from: "generated", to: "vector" },
  { from: "fac", to: "roughness" },
  { from: "color", to: "base-color" },
];

export function Example() {
  const [connections, setConnections] = useState(initialConnections);
  const [layout, setLayout] = useState(initialLayout);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [layoutMessage, setLayoutMessage] = useState("");

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Procedural bronze</h2>
          <p className="mt-1 max-w-xl text-xs/5 text-zinc-600 dark:text-zinc-400">
            Choose an output then a matching input, drag between ports, or use a source menu. Move
            and resize cards with their grips or the layout controls below.
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg border border-zinc-200 px-3 py-2 text-xs outline-teal-600 focus-visible:outline-2 dark:border-zinc-700 dark:outline-teal-400"
          onClick={() => {
            setLayout(initialLayout);
            setDrafts({});
            setConnections(initialConnections);
            setLayoutMessage("Layout and connections reset.");
          }}
        >
          Reset
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <Connect
          aria-label="Procedural bronze connections"
          value={connections}
          onChange={setConnections}
          className="relative min-w-[64rem] bg-zinc-50 p-4 dark:bg-zinc-950"
        >
          <ConnectLines className="z-10 text-teal-600 dark:text-teal-400" />
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
            className="h-[56rem] list-none gap-2"
          >
            {cards.map((card) => (
              <InventoryItem
                key={card.value}
                value={card.value}
                textValue={card.label}
                className="relative z-20 min-w-0 outline-teal-600 focus-visible:outline-2 dark:outline-teal-400"
              >
                <ConnectCard
                  value={card.value}
                  label={card.label}
                  tabIndex={-1}
                  className="h-full min-w-0 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <legend className="sr-only">{card.label}</legend>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{card.label}</h3>
                    <InventoryMoveHandle className="min-h-8 shrink-0 cursor-grab rounded border border-zinc-200 px-2 text-xs outline-teal-600 focus-visible:outline-2 dark:border-zinc-700 dark:outline-teal-400">
                      Move
                    </InventoryMoveHandle>
                  </div>
                  <div className="grid gap-4">
                    {card.outputs.map((port) => (
                      <ConnectOutput
                        key={port.value}
                        {...port}
                        className="flex min-h-9 items-center justify-between gap-2 rounded border border-zinc-200 px-2 text-xs outline-teal-600 focus-visible:outline-2 data-selected:ring-2 data-selected:ring-teal-600 dark:border-zinc-700 dark:outline-teal-400"
                      >
                        <span>
                          {port.label} · {port.kind}
                        </span>
                        <span aria-hidden="true">○</span>
                      </ConnectOutput>
                    ))}
                    {card.inputs.map((port) => (
                      <ConnectInput key={port.value} {...port} className="grid gap-1.5">
                        <ConnectInputTrigger className="flex min-h-8 items-center gap-2 rounded border border-zinc-200 px-2 text-xs outline-teal-600 focus-visible:outline-2 data-available:ring-2 data-available:ring-teal-600 dark:border-zinc-700 dark:outline-teal-400">
                          <span aria-hidden="true">○</span>
                          {port.label} · {port.kind}
                        </ConnectInputTrigger>
                        <ConnectInputSelect className="min-h-8 w-full min-w-0 rounded border border-zinc-200 bg-white px-1 text-xs outline-teal-600 focus-visible:outline-2 dark:border-zinc-700 dark:bg-zinc-900 dark:outline-teal-400" />
                        <ConnectDisconnect className="min-h-7 justify-self-start rounded px-1 text-xs text-zinc-600 outline-teal-600 focus-visible:outline-2 disabled:opacity-40 dark:text-zinc-400 dark:outline-teal-400">
                          Disconnect
                        </ConnectDisconnect>
                      </ConnectInput>
                    ))}
                  </div>
                  <InventoryResizeHandle className="mt-4 min-h-8 rounded border border-zinc-200 px-2 text-xs outline-teal-600 focus-visible:outline-2 dark:border-zinc-700 dark:outline-teal-400">
                    Resize
                  </InventoryResizeHandle>
                </ConnectCard>
              </InventoryItem>
            ))}
          </Inventory>
        </Connect>
      </div>
      <details className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
        <summary className="w-fit cursor-pointer rounded py-2 font-medium outline-teal-600 focus-visible:outline-2 dark:outline-teal-400">
          Position and size without dragging
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
                    layout.map((placement) => (placement.value === card.value ? next : placement)),
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
                      className="min-h-8 w-16 rounded border border-zinc-200 bg-white px-2 outline-teal-600 focus-visible:outline-2 dark:border-zinc-700 dark:bg-zinc-900 dark:outline-teal-400"
                    />
                  </label>
                ))}
                <button
                  type="submit"
                  className="min-h-8 rounded border border-zinc-200 px-3 outline-teal-600 focus-visible:outline-2 dark:border-zinc-700 dark:outline-teal-400"
                >
                  Apply {card.label}
                </button>
              </form>
            );
          })}
        </div>
      </details>
      <output aria-live="polite" className="mt-3 text-xs/5 text-zinc-600 dark:text-zinc-400">
        {layoutMessage}
      </output>
    </div>
  );
}
