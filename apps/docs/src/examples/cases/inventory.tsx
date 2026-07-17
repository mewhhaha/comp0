import { useState } from "react";
import {
  Inventory,
  InventoryItem,
  InventoryMoveHandle,
  InventoryPreview,
  InventoryResizeHandle,
  type InventoryLayout,
} from "@comp0/react";

const initialLayout: InventoryLayout = [
  { value: "revenue", column: 1, row: 1, columnSpan: 3, rowSpan: 2 },
  { value: "conversion", column: 4, row: 1, columnSpan: 3, rowSpan: 1 },
  { value: "orders", column: 4, row: 2, columnSpan: 2, rowSpan: 2 },
  { value: "alerts", column: 6, row: 2, columnSpan: 1, rowSpan: 2 },
  { value: "activity", column: 1, row: 3, columnSpan: 3, rowSpan: 2 },
];

const cards = {
  revenue: { title: "Revenue", summary: "Monthly recurring revenue", metric: "$84.2k" },
  conversion: { title: "Conversion", summary: "Visitor to customer rate", metric: "7.4%" },
  orders: { title: "Orders", summary: "Awaiting fulfillment", metric: "128" },
  alerts: { title: "Alerts", summary: "Inventory warnings", metric: "3" },
  activity: { title: "Activity", summary: "Events in the last hour", metric: "246" },
};

function MoveGrip() {
  return (
    <svg aria-hidden="true" className="size-4" fill="currentColor" viewBox="0 0 12 18">
      <circle cx="3" cy="3" r="1.25" />
      <circle cx="9" cy="3" r="1.25" />
      <circle cx="3" cy="9" r="1.25" />
      <circle cx="9" cy="9" r="1.25" />
      <circle cx="3" cy="15" r="1.25" />
      <circle cx="9" cy="15" r="1.25" />
    </svg>
  );
}

function ResizeGrip() {
  return (
    <svg aria-hidden="true" className="size-full" viewBox="0 0 24 24">
      <path d="M9 19h10V9M14 19l5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function Example() {
  const [layout, setLayout] = useState(initialLayout);

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">Store overview</h2>
          <p className="mt-1 text-sm/6 text-zinc-600 dark:text-zinc-400">
            Arrow between cards, Tab into a grip, then press Enter or Space to adjust.
          </p>
        </div>
        <button
          className="shrink-0 rounded-lg border border-zinc-950/10 px-3 py-2 text-sm font-medium outline-teal-600 hover:bg-zinc-50 focus-visible:outline-2 dark:border-white/10 dark:outline-teal-400 dark:hover:bg-zinc-800"
          type="button"
          onClick={() => setLayout(initialLayout)}
        >
          Reset
        </button>
      </div>
      <div className="overflow-x-auto pb-2">
        <Inventory
          aria-label="Store dashboard"
          columns={6}
          rows={6}
          value={layout}
          onChange={setLayout}
          className="relative h-[30rem] min-w-[38rem] list-none gap-2 rounded-xl border border-zinc-950/10 bg-zinc-100/70 p-2 dark:border-white/10 dark:bg-zinc-950"
        >
          <li
            aria-hidden="true"
            className="pointer-events-none absolute inset-2 grid grid-cols-6 grid-rows-6 gap-2"
          >
            {Array.from({ length: 36 }, (_, index) => (
              <span
                className="rounded-md border border-dashed border-zinc-950/10 bg-white/40 dark:border-white/10 dark:bg-white/2"
                key={index}
              />
            ))}
          </li>
          <InventoryPreview className="pointer-events-none z-20 rounded-lg border-2 border-teal-500 bg-teal-500/10 data-invalid-placement:border-red-500 data-invalid-placement:bg-red-500/10" />
          {layout.map((entry) => {
            const card = cards[entry.value as keyof typeof cards];
            return (
              <InventoryItem
                key={entry.value}
                value={entry.value}
                textValue={card.title}
                className="relative z-10 min-w-0 scroll-mx-2 overflow-hidden rounded-lg border border-zinc-950/10 bg-white p-3 shadow-sm outline-teal-600 focus-visible:outline-2 data-dragging:border-dashed data-dragging:border-orange-500 data-resizing:border-dashed data-resizing:border-orange-500 dark:border-white/10 dark:bg-zinc-900 dark:outline-teal-400"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
                      {card.title}
                    </h3>
                    <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {card.summary}
                    </p>
                  </div>
                  <InventoryMoveHandle className="shrink-0 cursor-grab touch-none rounded p-1 text-zinc-400 outline-teal-600 hover:bg-zinc-100 hover:text-zinc-700 active:cursor-grabbing focus-visible:outline-2 data-dragging:cursor-grabbing dark:outline-teal-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                    <MoveGrip />
                  </InventoryMoveHandle>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                  {card.metric}
                </p>
                <InventoryResizeHandle className="absolute right-1 bottom-1 size-7 cursor-nwse-resize touch-none rounded text-zinc-400 outline-teal-600 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-2 dark:outline-teal-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                  <ResizeGrip />
                </InventoryResizeHandle>
              </InventoryItem>
            );
          })}
        </Inventory>
      </div>
    </div>
  );
}
