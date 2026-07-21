import {
  ArrowsRightLeftIcon,
  Bars3Icon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PlayIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import type { ReactNode } from "react";
import type { ComponentPart } from "../../content/types.js";
import { cn } from "./cn.js";

type AnatomyProps = {
  parts: ComponentPart[];
  className?: string | undefined;
};

type Numbered = { part: ComponentPart; number: number };

type ControlShape =
  | "button"
  | "field"
  | "textarea"
  | "search"
  | "stepper"
  | "checkbox"
  | "switch"
  | "slider"
  | "link"
  | "ghost"
  | "icon"
  | "block";

type ItemShape = "row" | "tab" | "crumb" | "radio" | "slide" | "cell";
type GraphicShape =
  | "area"
  | "bar"
  | "candlestick"
  | "column"
  | "heatmap"
  | "histogram"
  | "line"
  | "pie"
  | "sankey"
  | "scatter"
  | "stacked-bar"
  | "stacked-column";

type DiagramNode =
  | { type: "frame"; owner: Numbered; variant: "provider" | "container"; children: DiagramNode[] }
  | { type: "label"; owner: Numbered }
  | {
      type: "control";
      owner: Numbered;
      shape: ControlShape;
      value?: Numbered | undefined;
      chevron: boolean;
      wide?: boolean | undefined;
      glyph?: typeof XMarkIcon | undefined;
    }
  | { type: "row"; owner?: undefined; children: DiagramNode[] }
  | { type: "number-stepper"; owner: Numbered; buttons: Numbered[] }
  | { type: "color-area"; owner: Numbered; thumb: Numbered }
  | { type: "chip"; owner: Numbered }
  | { type: "feedback"; owner: Numbered }
  | { type: "graphic"; owner: Numbered; shape: GraphicShape }
  | { type: "table"; owner: Numbered }
  | { type: "panel"; owner: Numbered; children: DiagramNode[] }
  | { type: "items"; owner: Numbered; shape: ItemShape };

function inputShape(name: string): ControlShape {
  if (/text ?area/i.test(name)) return "textarea";
  if (/checkbox/i.test(name)) return "checkbox";
  if (/switch/i.test(name)) return "switch";
  if (/slider|range/i.test(name)) return "slider";
  if (/number/i.test(name)) return "stepper";
  if (/search/i.test(name)) return "search";
  if (/file|hidden/i.test(name)) return "ghost";
  return "field";
}

function loneRootShape(name: string): ControlShape {
  if (/button/i.test(name)) return "button";
  if (/link/i.test(name)) return "link";
  if (/hidden/i.test(name)) return "ghost";
  return "block";
}

function itemShape(name: string): ItemShape {
  if (/radio/i.test(name)) return "radio";
  if (/slide/i.test(name)) return "slide";
  if (/cell/i.test(name)) return "cell";
  if (/^ta[bg](?![a-z])/i.test(name)) return "tab";
  if (/button|column/i.test(name)) return "tab";
  if (/breadcrumb/i.test(name)) return "crumb";
  return "row";
}

function graphicShape(name: string): GraphicShape {
  if (/candlestick/i.test(name)) return "candlestick";
  if (/stackedbar/i.test(name)) return "stacked-bar";
  if (/stackedcolumn/i.test(name)) return "stacked-column";
  if (/scatter/i.test(name)) return "scatter";
  if (/histogram/i.test(name)) return "histogram";
  if (/heatmap/i.test(name)) return "heatmap";
  if (/sankey/i.test(name)) return "sankey";
  if (/pie/i.test(name)) return "pie";
  if (/line/i.test(name)) return "line";
  if (/area/i.test(name)) return "area";
  if (/column/i.test(name)) return "column";
  return "bar";
}

const triggerGlyphs: [RegExp, typeof XMarkIcon][] = [
  [/clear|close|dismiss/i, XMarkIcon],
  [/previous|back/i, ChevronLeftIcon],
  [/next|forward/i, ChevronRightIcon],
  [/play|pause|autoplay/i, PlayIcon],
  [/drag|handle|grip/i, Bars3Icon],
  [/resiz/i, ArrowsRightLeftIcon],
];

function triggerNode(entry: Numbered, rest: Numbered[], value?: Numbered): DiagramNode {
  if (/context/i.test(entry.part.name)) {
    return { type: "control", owner: entry, shape: "ghost", chevron: false };
  }
  const glyph = triggerGlyphs.find(([pattern]) => pattern.test(entry.part.name))?.[1];
  if (glyph) return { type: "control", owner: entry, shape: "icon", glyph, chevron: false };
  const chevron =
    value !== undefined ||
    /menu/i.test(entry.part.name) ||
    rest.some((e) => e.part.kind === "item" || e.part.kind === "region");
  const wide = rest.some((e) => e.part.kind === "content") || value !== undefined;
  return { type: "control", owner: entry, shape: "button", value, chevron, wide };
}

// Turns the ordered part list into a nested wireframe: providers become dashed
// frames around what follows, triggers absorb their value and sit together in
// one row when consecutive, regions wrap the items/inputs that follow them,
// and the first content part becomes a floating panel holding the rest.
function parseParts(list: Numbered[]): DiagramNode[] {
  const nodes: DiagramNode[] = [];
  let i = 0;
  while (i < list.length) {
    const entry = list[i];
    if (!entry) break;
    const kind = entry.part.kind;
    if (kind === "label") {
      nodes.push({ type: "label", owner: entry });
      i += 1;
    } else if (kind === "feedback") {
      nodes.push({ type: "feedback", owner: entry });
      i += 1;
    } else if (kind === "value") {
      nodes.push({ type: "chip", owner: entry });
      i += 1;
    } else if (kind === "graphic") {
      const run: DiagramNode[] = [];
      while (i < list.length) {
        const current = list[i];
        if (!current || current.part.kind !== "graphic") break;
        run.push({ type: "graphic", owner: current, shape: graphicShape(current.part.name) });
        i += 1;
      }
      nodes.push(run.length === 1 ? run[0]! : { type: "row", children: run });
    } else if (kind === "table") {
      nodes.push({ type: "table", owner: entry });
      i += 1;
    } else if (kind === "input") {
      const inputControlShape = inputShape(entry.part.name);
      const control: DiagramNode = {
        type: "control",
        owner: entry,
        shape: inputControlShape,
        chevron: false,
      };
      const next = list[i + 1];
      const afterNext = list[i + 2];
      const hasStepperButtons =
        inputControlShape === "stepper" &&
        next?.part.kind === "trigger" &&
        afterNext?.part.kind === "trigger" &&
        /increment|increase/i.test(next.part.name) &&
        /decrement|decrease/i.test(afterNext.part.name);
      if (hasStepperButtons) {
        nodes.push({ type: "number-stepper", owner: entry, buttons: [next, afterNext] });
        i += 3;
      } else if (next && next.part.kind === "trigger") {
        nodes.push({ type: "row", children: [control, triggerNode(next, list.slice(i + 2))] });
        i += 2;
      } else {
        nodes.push(control);
        i += 1;
      }
    } else if (kind === "trigger") {
      const run: DiagramNode[] = [];
      while (i < list.length) {
        const current = list[i];
        if (!current || current.part.kind !== "trigger") break;
        const next = list[i + 1];
        const value = next?.part.kind === "value" ? next : undefined;
        i += value ? 2 : 1;
        run.push(triggerNode(current, list.slice(i), value));
      }
      const first = run[0];
      if (run.length === 1 && first) {
        nodes.push(first);
      } else {
        // Side-by-side triggers share one row, so none of them renders wide.
        nodes.push({
          type: "row",
          children: run.map((node) =>
            node.type === "control" ? { ...node, wide: undefined } : node,
          ),
        });
      }
    } else if (kind === "content") {
      const rest = list.slice(i + 1);
      const chips = rest.filter((e) => e.part.kind === "content");
      const inner = rest.filter((e) => e.part.kind !== "content");
      nodes.push({
        type: "panel",
        owner: entry,
        children: [
          ...chips.map((chip): DiagramNode => ({ type: "chip", owner: chip })),
          ...parseParts(inner),
        ],
      });
      i = list.length;
    } else if (
      kind === "region" &&
      /color ?area/i.test(entry.part.name) &&
      /thumb/i.test(list[i + 1]?.part.name ?? "")
    ) {
      nodes.push({ type: "color-area", owner: entry, thumb: list[i + 1]! });
      i += 2;
    } else if (kind === "region") {
      let j = i + 1;
      while (j < list.length) {
        const inner = list[j]?.part.kind;
        if (inner !== "item" && inner !== "input") break;
        j += 1;
      }
      nodes.push({
        type: "frame",
        owner: entry,
        variant: "container",
        children: parseParts(list.slice(i + 1, j)),
      });
      i = j;
    } else if (kind === "item") {
      const rest = list.slice(i + 1);
      const wrapsOtherParts = rest.some(
        (e) => e.part.kind === "label" || e.part.kind === "trigger",
      );
      if (wrapsOtherParts) {
        nodes.push({
          type: "frame",
          owner: entry,
          variant: "container",
          children: parseParts(rest),
        });
        i = list.length;
      } else {
        nodes.push({ type: "items", owner: entry, shape: itemShape(entry.part.name) });
        i += 1;
      }
    } else {
      const rest = list.slice(i + 1);
      if (rest.length === 0) {
        nodes.push({
          type: "control",
          owner: entry,
          shape: loneRootShape(entry.part.name),
          chevron: false,
        });
        i = list.length;
      } else if (!entry.part.ownsDom) {
        nodes.push({
          type: "frame",
          owner: entry,
          variant: "provider",
          children: parseParts(rest),
        });
        i = list.length;
      } else {
        // A DOM-owning root mid-list is a list container (TabList, sections):
        // it wraps directly following items and the labels or controls inside them.
        let j = i + 1;
        while (j < list.length && list[j]?.part.kind === "item") j += 1;
        while (
          j < list.length &&
          (list[j]?.part.kind === "label" ||
            list[j]?.part.kind === "trigger" ||
            list[j]?.part.kind === "value")
        ) {
          j += 1;
        }
        const children = j > i + 1 ? list.slice(i + 1, j) : rest;
        nodes.push({
          type: "frame",
          owner: entry,
          variant: "container",
          children: parseParts(children),
        });
        i = j > i + 1 ? j : list.length;
      }
    }
  }
  return nodes;
}

function Pin({ number }: { number: number }) {
  return (
    <span className="absolute -top-2.5 -left-2.5 z-10 flex size-5 items-center justify-center rounded-full bg-teal-600 font-mono text-[0.6875rem] font-semibold text-white shadow-sm dark:bg-teal-400 dark:text-zinc-950">
      {number}
    </span>
  );
}

function PartName({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        `
          font-mono text-xs/5 whitespace-nowrap text-zinc-500
          dark:text-zinc-400
        `,
        className,
      )}
    >
      {children}
    </span>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("h-2 rounded-full bg-zinc-300", "dark:bg-zinc-600", className)}
    />
  );
}

function ControlNode({ node }: { node: Extract<DiagramNode, { type: "control" }> }) {
  const { owner, shape, value, chevron, wide } = node;
  if (shape === "checkbox") {
    return (
      <div className="relative inline-flex items-center gap-2.5 self-start justify-self-start pt-1">
        <Pin number={owner.number} />
        <span className="flex size-5 items-center justify-center rounded border-2 border-teal-600 bg-teal-600 dark:border-teal-400 dark:bg-teal-400">
          <CheckIcon className="size-3.5 text-white dark:text-zinc-950" aria-hidden="true" />
        </span>
        <PartName>{owner.part.name}</PartName>
      </div>
    );
  }
  if (shape === "switch") {
    return (
      <div className="relative inline-flex items-center gap-2.5 self-start justify-self-start pt-1">
        <Pin number={owner.number} />
        <span className="flex h-6 w-11 items-center rounded-full bg-teal-600 p-1 dark:bg-teal-400">
          <span className="ml-auto size-4 rounded-full bg-white dark:bg-zinc-950" />
        </span>
        <PartName>{owner.part.name}</PartName>
      </div>
    );
  }
  if (shape === "slider") {
    return (
      <div className="relative grid max-w-56 gap-2 pt-1">
        <Pin number={owner.number} />
        <PartName>{owner.part.name}</PartName>
        <span className="flex h-2 items-center rounded-full bg-zinc-200 dark:bg-zinc-700">
          <span className="h-2 w-2/5 rounded-l-full bg-teal-600 dark:bg-teal-400" />
          <span className="-ml-1 size-4 rounded-full border-2 border-teal-600 bg-white shadow dark:border-teal-400 dark:bg-zinc-900" />
        </span>
      </div>
    );
  }
  if (shape === "icon") {
    const Glyph = node.glyph ?? XMarkIcon;
    return (
      <div className="relative inline-flex size-10 shrink-0 items-center justify-center self-start justify-self-start rounded-lg bg-zinc-200 dark:bg-zinc-700">
        <Pin number={owner.number} />
        <Glyph className="size-4 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
      </div>
    );
  }
  if (shape === "link") {
    return (
      <div className="relative inline-flex items-center self-start justify-self-start pt-1">
        <Pin number={owner.number} />
        <PartName className="text-teal-700/80 underline decoration-teal-700/40 decoration-2 underline-offset-4 dark:text-teal-300/80 dark:decoration-teal-300/40">
          {owner.part.name}
        </PartName>
      </div>
    );
  }
  if (shape === "ghost") {
    return (
      <div className="relative inline-flex items-center gap-2 self-start justify-self-start rounded-lg border-2 border-dashed border-zinc-300 px-4 py-2 dark:border-zinc-600">
        <Pin number={owner.number} />
        <PartName>{owner.part.name}</PartName>
      </div>
    );
  }
  if (shape === "field" || shape === "search" || shape === "textarea" || shape === "stepper") {
    return (
      <div
        className={cn(
          `
            relative flex w-full max-w-64 gap-2 rounded-lg border
            border-zinc-300 bg-white px-3
            dark:border-zinc-600 dark:bg-zinc-800
          `,
          shape === "textarea" ? "min-h-20 items-start py-2.5" : "min-h-10 items-center",
        )}
      >
        <Pin number={owner.number} />
        {shape === "search" && (
          <MagnifyingGlassIcon className="size-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
        )}
        <span
          className={cn(
            `
              h-4 w-px shrink-0 bg-teal-600
              dark:bg-teal-400
            `,
            shape === "textarea" && "mt-0.5",
          )}
          aria-hidden="true"
        />
        <PartName>{owner.part.name}</PartName>
        {shape === "stepper" && (
          <span className="ml-auto flex shrink-0 flex-col gap-0.5" aria-hidden="true">
            <PlusIcon className="size-3 text-zinc-400 dark:text-zinc-500" />
            <MinusIcon className="size-3 text-zinc-400 dark:text-zinc-500" />
          </span>
        )}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "relative flex min-h-10 items-center gap-2.5 rounded-lg px-4",
        wide ? "w-full max-w-64" : "self-start justify-self-start",
        shape === "button" && "bg-zinc-800",
        shape === "button" && "dark:bg-zinc-200",
        shape !== "button" &&
          `
            bg-zinc-100 ring-1 ring-zinc-950/10
            dark:bg-zinc-800 dark:ring-white/10
          `,
      )}
    >
      <Pin number={owner.number} />
      <PartName className={cn(shape === "button" && "text-zinc-400 dark:text-zinc-500")}>
        {owner.part.name}
      </PartName>
      {value && (
        <span className="relative inline-flex items-center rounded bg-white/15 px-1.5 py-0.5 dark:bg-zinc-950/10">
          <Pin number={value.number} />
          <PartName
            className={cn(
              "text-[0.6875rem]/4",
              shape === "button" && "text-zinc-400",
              shape === "button" && "dark:text-zinc-500",
            )}
          >
            {value.part.name}
          </PartName>
        </span>
      )}
      {chevron && (
        <ChevronDownIcon
          className={cn(
            "size-3.5 text-zinc-400",
            wide && "ml-auto",
            shape === "button" && "dark:text-zinc-500",
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function ItemsNode({ node }: { node: Extract<DiagramNode, { type: "items" }> }) {
  const { owner, shape } = node;
  if (shape === "slide") {
    return (
      <div className="flex items-stretch gap-2 pt-1">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={cn(
              "relative flex h-20 items-center justify-center rounded-lg",
              index === 1 &&
                `
                  min-w-0 flex-1 bg-teal-600/10 px-3 ring-1 ring-teal-600/30
                  dark:bg-teal-400/10 dark:ring-teal-400/30
                `,
              index !== 1 &&
                `
                  w-8 shrink-0 bg-zinc-100 ring-1 ring-zinc-950/10
                  dark:bg-zinc-800 dark:ring-white/10
                `,
            )}
          >
            {index === 1 && <Pin number={owner.number} />}
            {index === 1 && (
              <PartName className="text-teal-800/80 dark:text-teal-200/80">
                {owner.part.name}
              </PartName>
            )}
            {index !== 1 && <Skeleton className="w-4" />}
          </span>
        ))}
      </div>
    );
  }
  if (shape === "cell") {
    return (
      <div className="relative grid gap-2 pt-1">
        <Pin number={owner.number} />
        <PartName>{owner.part.name}</PartName>
        <span className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 14 }, (_, index) => (
            <span
              key={index}
              className={cn(
                "aspect-square rounded",
                index === 9 && "bg-teal-600/80",
                index === 9 && "dark:bg-teal-400/80",
                index !== 9 &&
                  `
                    bg-zinc-100 ring-1 ring-zinc-950/10
                    dark:bg-zinc-800 dark:ring-white/10
                  `,
              )}
            />
          ))}
        </span>
      </div>
    );
  }
  if (shape === "tab" || shape === "crumb") {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3 pt-1">
        {[0, 1, 2].map((index) => (
          <span key={index} className="contents">
            {shape === "crumb" && index > 0 && (
              <ChevronRightIcon className="size-3.5 text-zinc-400" aria-hidden="true" />
            )}
            <span
              className={cn(
                `
                  relative inline-flex min-h-8 items-center gap-2 rounded-md
                  px-3
                `,
                index === 0 &&
                  `
                    bg-teal-600/10 ring-1 ring-teal-600/30
                    dark:bg-teal-400/10 dark:ring-teal-400/30
                  `,
                index !== 0 &&
                  `
                    bg-zinc-100 ring-1 ring-zinc-950/10
                    dark:bg-zinc-800 dark:ring-white/10
                  `,
              )}
            >
              {index === 0 && <Pin number={owner.number} />}
              {index === 0 && (
                <PartName className="text-teal-800/80 dark:text-teal-200/80">
                  {owner.part.name}
                </PartName>
              )}
              {index !== 0 && <Skeleton className={index === 1 ? "w-10" : "w-14"} />}
            </span>
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-1.5 pt-1">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            "relative flex min-h-9 items-center gap-2.5 rounded-md px-3",
            index === 1 && "bg-teal-600/10",
            index === 1 && "dark:bg-teal-400/10",
          )}
        >
          {index === 0 && <Pin number={owner.number} />}
          {shape === "radio" && (
            <span
              className={cn(
                `
                  flex size-4 shrink-0 items-center justify-center rounded-full
                  border-2
                `,
                index === 1 && "border-teal-600",
                index === 1 && "dark:border-teal-400",
                index !== 1 && "border-zinc-400",
                index !== 1 && "dark:border-zinc-500",
              )}
            >
              {index === 1 && (
                <span className="size-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
              )}
            </span>
          )}
          {index === 0 ? (
            <PartName>{owner.part.name}</PartName>
          ) : (
            <Skeleton
              className={index === 1 ? "w-20 bg-teal-700/40 dark:bg-teal-300/40" : "w-12"}
            />
          )}
          {shape !== "radio" && index === 1 && (
            <CheckIcon
              className="ml-auto size-3.5 text-teal-700 dark:text-teal-300"
              aria-hidden="true"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function GraphicNode({ node }: { node: Extract<DiagramNode, { type: "graphic" }> }) {
  let graphic = (
    <span className="flex h-14 flex-col justify-center gap-1.5" aria-hidden="true">
      {[92, 70, 48, 28].map((width) => (
        <span
          key={width}
          className="h-2 rounded-r-sm bg-teal-600/75 dark:bg-teal-400/75"
          style={{ width: `${width}%` }}
        />
      ))}
    </span>
  );
  if (node.shape === "column") {
    graphic = (
      <span className="flex h-14 items-end justify-center gap-1.5" aria-hidden="true">
        {[70, 48, 32, 18].map((height) => (
          <span
            key={height}
            className="w-3 rounded-t-sm bg-teal-600/75 dark:bg-teal-400/75"
            style={{ height: `${height}%` }}
          />
        ))}
      </span>
    );
  }
  if (node.shape === "pie") {
    graphic = (
      <span
        className="mx-auto size-14 rounded-full ring-1 ring-zinc-950/10 dark:ring-white/15"
        style={{
          background:
            "conic-gradient(#0d9488 0 42%, #0284c7 42% 73%, #7c3aed 73% 91%, #f59e0b 91%)",
        }}
        aria-hidden="true"
      />
    );
  }
  if (node.shape === "line") {
    graphic = (
      <svg viewBox="0 0 100 60" className="h-14 w-full overflow-visible" aria-hidden="true">
        <path
          d="M 3 52 L 34 20 L 66 36 L 97 8"
          fill="none"
          className="stroke-teal-600 dark:stroke-teal-400"
          strokeWidth="4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }
  if (node.shape === "area") {
    graphic = (
      <svg viewBox="0 0 100 60" className="h-14 w-full overflow-visible" aria-hidden="true">
        <path
          d="M 3 57 L 3 52 L 34 20 L 66 36 L 97 8 L 97 57 Z"
          className="fill-teal-600/20 dark:fill-teal-400/20"
        />
        <path
          d="M 3 52 L 34 20 L 66 36 L 97 8"
          fill="none"
          className="stroke-teal-600 dark:stroke-teal-400"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }
  if (node.shape === "candlestick") {
    graphic = (
      <svg viewBox="0 0 100 60" className="h-14 w-full overflow-visible" aria-hidden="true">
        {[
          { x: 14, high: 6, body: 18, height: 16, low: 48, direction: "up" },
          { x: 38, high: 12, body: 20, height: 22, low: 54, direction: "down" },
          { x: 62, high: 4, body: 14, height: 20, low: 46, direction: "up" },
          { x: 86, high: 10, body: 18, height: 24, low: 52, direction: "down" },
        ].map((candle) => (
          <g key={candle.x}>
            <line
              x1={candle.x}
              x2={candle.x}
              y1={candle.high}
              y2={candle.low}
              data-direction={candle.direction}
              className="stroke-rose-600 data-[direction=up]:stroke-teal-600"
              strokeWidth="2"
            />
            <rect
              x={candle.x - 5}
              y={candle.body}
              width="10"
              height={candle.height}
              data-direction={candle.direction}
              className="fill-rose-600 stroke-rose-600 data-[direction=up]:fill-white data-[direction=up]:stroke-teal-600 dark:fill-rose-400 dark:stroke-rose-400 dark:data-[direction=up]:fill-zinc-800 dark:data-[direction=up]:stroke-teal-400"
              strokeWidth="2"
            />
          </g>
        ))}
      </svg>
    );
  }
  if (node.shape === "scatter") {
    graphic = (
      <svg viewBox="0 0 100 60" className="h-14 w-full" aria-hidden="true">
        {[
          [12, 45],
          [31, 18],
          [49, 35],
          [68, 10],
          [88, 27],
        ].map(([cx, cy]) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="4"
            className="fill-teal-600 dark:fill-teal-400"
          />
        ))}
      </svg>
    );
  }
  if (node.shape === "histogram") {
    graphic = (
      <span className="flex h-14 items-end justify-center gap-px" aria-hidden="true">
        {[32, 68, 92, 54, 20].map((height) => (
          <span
            key={height}
            className="w-4 bg-teal-600/75 dark:bg-teal-400/75"
            style={{ height: `${height}%` }}
          />
        ))}
      </span>
    );
  }
  if (node.shape === "heatmap") {
    graphic = (
      <span className="grid h-14 grid-cols-4 gap-1" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <span
            key={index}
            className="bg-teal-600 dark:bg-teal-400"
            style={{ opacity: 0.2 + ((index * 3) % 8) / 10 }}
          />
        ))}
      </span>
    );
  }
  if (node.shape === "stacked-bar") {
    graphic = (
      <span className="flex h-14 flex-col justify-center gap-1.5" aria-hidden="true">
        {[88, 72, 54].map((width) => (
          <span key={width} className="flex h-3" style={{ width: `${width}%` }}>
            <span className="w-2/5 bg-teal-600 dark:bg-teal-400" />
            <span className="flex-1 bg-sky-600 dark:bg-sky-400" />
          </span>
        ))}
      </span>
    );
  }
  if (node.shape === "stacked-column") {
    graphic = (
      <span className="flex h-14 items-end justify-center gap-2" aria-hidden="true">
        {[68, 92, 78, 54].map((height) => (
          <span
            key={height}
            className="flex w-3 flex-col justify-end"
            style={{ height: `${height}%` }}
          >
            <span className="h-2/5 bg-sky-600 dark:bg-sky-400" />
            <span className="flex-1 bg-teal-600 dark:bg-teal-400" />
          </span>
        ))}
      </span>
    );
  }
  if (node.shape === "sankey") {
    graphic = (
      <svg viewBox="0 0 100 60" className="h-14 w-full" aria-hidden="true">
        <path
          d="M 10 25 C 35 25, 38 14, 62 14"
          className="stroke-teal-600/40 dark:stroke-teal-400/40"
          strokeWidth="10"
          fill="none"
        />
        <path
          d="M 10 35 C 35 35, 38 46, 62 46"
          className="stroke-sky-600/40 dark:stroke-sky-400/40"
          strokeWidth="7"
          fill="none"
        />
        <path
          d="M 68 14 C 80 14, 82 30, 92 30"
          className="stroke-teal-600/40 dark:stroke-teal-400/40"
          strokeWidth="8"
          fill="none"
        />
        <rect x="6" y="17" width="5" height="26" className="fill-zinc-700 dark:fill-zinc-200" />
        <rect x="62" y="8" width="6" height="14" className="fill-teal-600 dark:fill-teal-400" />
        <rect x="62" y="41" width="6" height="10" className="fill-sky-600 dark:fill-sky-400" />
        <rect x="92" y="24" width="5" height="13" className="fill-amber-500 dark:fill-amber-400" />
      </svg>
    );
  }

  return (
    <div className="relative grid min-h-28 min-w-32 flex-1 gap-2 rounded-lg bg-white p-3 ring-1 ring-zinc-950/10 dark:bg-zinc-800 dark:ring-white/15">
      <Pin number={node.owner.number} />
      <PartName>{node.owner.part.name}</PartName>
      {graphic}
    </div>
  );
}

function TableNode({ node }: { node: Extract<DiagramNode, { type: "table" }> }) {
  return (
    <div className="relative grid gap-2 rounded-lg bg-white p-3 ring-1 ring-zinc-950/10 dark:bg-zinc-800 dark:ring-white/15">
      <Pin number={node.owner.number} />
      <PartName>{node.owner.part.name}</PartName>
      <span className="grid grid-cols-2 gap-x-6 gap-y-2" aria-hidden="true">
        {["w-16", "w-10", "w-12", "w-8", "w-14", "w-9"].map((width, index) => (
          <Skeleton
            key={`${width}-${index}`}
            className={cn(
              width,
              index < 2 &&
                `
                  bg-zinc-400
                  dark:bg-zinc-500
                `,
            )}
          />
        ))}
      </span>
    </div>
  );
}

function DiagramNodes({ nodes }: { nodes: DiagramNode[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        const key = node.owner ? node.owner.part.name : `row-${index}`;
        if (node.type === "frame") {
          return (
            <div
              key={key}
              className={cn(
                `
                  relative grid grid-cols-[minmax(0,1fr)] gap-3 rounded-xl p-4
                  pt-2.5
                `,
                node.variant === "provider" &&
                  `
                    border-2 border-dashed border-teal-600/40
                    dark:border-teal-400/30
                  `,
                node.variant === "container" &&
                  `
                    border border-zinc-300 bg-zinc-50/50
                    dark:border-zinc-600 dark:bg-white/2
                  `,
              )}
            >
              <Pin number={node.owner.number} />
              <PartName
                className={cn(
                  node.variant === "provider" && "text-teal-700/70 dark:text-teal-300/70",
                )}
              >
                {node.owner.part.name}
              </PartName>
              <DiagramNodes nodes={node.children} />
            </div>
          );
        }
        if (node.type === "panel") {
          return (
            <div key={key} className="grid justify-items-start">
              <span
                aria-hidden="true"
                className="ml-6 h-3 w-px border-l-2 border-dashed border-zinc-300 dark:border-zinc-600"
              />
              <div className="relative grid w-full max-w-64 grid-cols-[minmax(0,1fr)] gap-1.5 rounded-xl bg-white p-2 pt-1.5 shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-800 dark:shadow-none dark:ring-white/15">
                <Pin number={node.owner.number} />
                <PartName className="px-1">{node.owner.part.name}</PartName>
                <DiagramNodes nodes={node.children} />
              </div>
            </div>
          );
        }
        if (node.type === "row") {
          return (
            <div key={key} className="flex flex-wrap items-start gap-3">
              <DiagramNodes nodes={node.children} />
            </div>
          );
        }
        if (node.type === "number-stepper") {
          return (
            <div
              key={key}
              className="flex w-full max-w-64 rounded-lg border border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800"
            >
              <div className="relative flex min-h-10 min-w-0 flex-1 items-center gap-2 px-3">
                <Pin number={node.owner.number} />
                <span
                  className="h-4 w-px shrink-0 bg-teal-600 dark:bg-teal-400"
                  aria-hidden="true"
                />
                <PartName>{node.owner.part.name}</PartName>
              </div>
              <div className="grid w-10 shrink-0 grid-rows-2 border-l border-zinc-300 dark:border-zinc-600">
                {node.buttons.map((button, buttonIndex) => (
                  <span
                    key={button.part.name}
                    className={cn(
                      `
                        relative flex items-center justify-center bg-zinc-100
                        dark:bg-zinc-700
                      `,
                      buttonIndex === 0 && "border-b border-zinc-300 dark:border-zinc-600",
                    )}
                  >
                    <Pin number={button.number} />
                    {buttonIndex === 0 ? (
                      <PlusIcon className="size-3 text-zinc-500 dark:text-zinc-400" />
                    ) : (
                      <MinusIcon className="size-3 text-zinc-500 dark:text-zinc-400" />
                    )}
                  </span>
                ))}
              </div>
            </div>
          );
        }
        if (node.type === "color-area") {
          return (
            <div
              key={key}
              className="relative flex h-28 w-full max-w-64 items-start overflow-visible rounded-lg bg-[linear-gradient(to_top,#18181b,transparent),linear-gradient(to_right,#fff,transparent)] p-3 ring-1 ring-zinc-950/10 dark:ring-white/15"
              style={{ backgroundColor: "#0d9488" }}
            >
              <Pin number={node.owner.number} />
              <PartName className="text-zinc-700/70 dark:text-zinc-200/70">
                {node.owner.part.name}
              </PartName>
              <span className="absolute top-8 right-12 size-5 rounded-full border-2 border-white shadow ring-1 ring-zinc-950/40">
                <Pin number={node.thumb.number} />
              </span>
            </div>
          );
        }
        if (node.type === "label") {
          return (
            <div
              key={key}
              className="relative inline-flex items-center gap-2 self-start justify-self-start pt-1.5 pb-0.5"
            >
              <Pin number={node.owner.number} />
              <PartName>{node.owner.part.name}</PartName>
            </div>
          );
        }
        if (node.type === "feedback") {
          return (
            <div
              key={key}
              className="relative inline-flex items-center gap-2 self-start justify-self-start pt-1.5 pb-0.5"
            >
              <Pin number={node.owner.number} />
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-amber-500/80 dark:bg-amber-400/80"
              />
              <PartName>{node.owner.part.name}</PartName>
            </div>
          );
        }
        if (node.type === "chip") {
          return (
            <div
              key={key}
              className="relative inline-flex items-center self-start justify-self-start rounded-md bg-zinc-100 px-2.5 py-1.5 ring-1 ring-zinc-950/10 dark:bg-zinc-700 dark:ring-white/10"
            >
              <Pin number={node.owner.number} />
              <PartName>{node.owner.part.name}</PartName>
            </div>
          );
        }
        if (node.type === "items") {
          return <ItemsNode key={key} node={node} />;
        }
        if (node.type === "graphic") {
          return <GraphicNode key={key} node={node} />;
        }
        if (node.type === "table") {
          return <TableNode key={key} node={node} />;
        }
        return <ControlNode key={key} node={node} />;
      })}
    </>
  );
}

export function Anatomy({ parts, className }: AnatomyProps) {
  const numbered = parts.map((part, index) => ({ part, number: index + 1 }));
  const nodes = parseParts(numbered);
  const lone = nodes.length === 1 && nodes[0]?.type === "control";
  return (
    <section className={cn("max-w-full min-w-0", className)}>
      <p className="sr-only">
        A wireframe sketch of the assembled component. Each numbered marker matches a part in the
        list that follows.
      </p>
      <div
        aria-hidden="true"
        className="flex justify-center rounded-2xl bg-[radial-gradient(circle,var(--color-zinc-200)_1px,transparent_1px)] bg-size-[14px_14px] p-6 ring-1 ring-zinc-950/5 sm:p-10 dark:bg-[radial-gradient(circle,var(--color-zinc-700)_1px,transparent_1px)] dark:ring-white/10"
      >
        <div className={cn("grid max-w-sm grid-cols-[minmax(0,1fr)] gap-3", !lone && "w-full")}>
          <DiagramNodes nodes={nodes} />
        </div>
      </div>
      <ol className="mt-7 grid gap-x-10 gap-y-5 sm:grid-cols-2" role="list">
        {numbered.map(({ part, number }) => (
          <li key={part.name} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-600 font-mono text-[0.6875rem] font-semibold text-white dark:bg-teal-400 dark:text-zinc-950"
            >
              {number}
            </span>
            <div className="min-w-0">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {part.name}
                {part.optional && (
                  <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">
                    Optional
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-base/6 text-zinc-600 sm:text-sm dark:text-zinc-300">
                {part.description}{" "}
                <span className="text-zinc-500 dark:text-zinc-400">
                  {part.ownsDom ? "Owns a DOM element." : "Does not add a DOM element."}
                </span>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
