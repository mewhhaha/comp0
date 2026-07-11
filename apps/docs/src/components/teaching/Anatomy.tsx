import { Check, ChevronDown, ChevronRight, Minus, Plus, Search, X } from "lucide-react";
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

type ItemShape = "row" | "tab" | "crumb" | "radio";

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
    }
  | { type: "row"; owner?: undefined; children: DiagramNode[] }
  | { type: "chip"; owner: Numbered }
  | { type: "feedback"; owner: Numbered }
  | { type: "panel"; owner: Numbered; children: DiagramNode[] }
  | { type: "items"; owner: Numbered; shape: ItemShape };

function inputShape(name: string): ControlShape {
  if (/text ?area/i.test(name)) return "textarea";
  if (/checkbox/i.test(name)) return "checkbox";
  if (/switch/i.test(name)) return "switch";
  if (/slider|range/i.test(name)) return "slider";
  if (/number/i.test(name)) return "stepper";
  if (/search/i.test(name)) return "search";
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
  if (/^ta[bg](?![a-z])/i.test(name)) return "tab";
  if (/breadcrumb/i.test(name)) return "crumb";
  return "row";
}

function triggerNode(entry: Numbered, rest: Numbered[], value?: Numbered): DiagramNode {
  const shape: ControlShape = /clear|close|dismiss/i.test(entry.part.name) ? "icon" : "button";
  const chevron = value !== undefined || rest.some((e) => e.part.kind === "item");
  const wide = rest.some((e) => e.part.kind === "content") || value !== undefined;
  return { type: "control", owner: entry, shape, value, chevron, wide };
}

// Turns the ordered part list into a nested wireframe: providers become dashed
// frames around what follows, triggers absorb their value, and the first
// content part becomes a floating panel holding the remaining items/sections.
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
    } else if (kind === "input") {
      const control: DiagramNode = {
        type: "control",
        owner: entry,
        shape: inputShape(entry.part.name),
        chevron: false,
      };
      const next = list[i + 1];
      if (next && next.part.kind === "trigger") {
        nodes.push({ type: "row", children: [control, triggerNode(next, list.slice(i + 2))] });
        i += 2;
      } else {
        nodes.push(control);
        i += 1;
      }
    } else if (kind === "trigger") {
      const next = list[i + 1];
      const value = next?.part.kind === "value" ? next : undefined;
      const consumed = value ? 2 : 1;
      nodes.push(triggerNode(entry, list.slice(i + consumed), value));
      i += consumed;
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
        // it wraps only the items that directly follow it.
        let j = i + 1;
        while (j < list.length && list[j]?.part.kind === "item") j += 1;
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
        "font-mono text-xs/5 whitespace-nowrap text-zinc-500 dark:text-zinc-400",
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
      className={cn("h-2 rounded-full bg-zinc-300 dark:bg-zinc-600", className)}
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
          <Check className="size-3.5 text-white dark:text-zinc-950" aria-hidden="true" />
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
    return (
      <div className="relative inline-flex size-10 shrink-0 items-center justify-center self-start justify-self-start rounded-lg bg-zinc-200 dark:bg-zinc-700">
        <Pin number={owner.number} />
        <X className="size-4 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
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
          "relative flex w-full max-w-64 gap-2 rounded-lg border border-zinc-300 bg-white px-3 dark:border-zinc-600 dark:bg-zinc-800",
          shape === "textarea" ? "min-h-20 items-start py-2.5" : "min-h-10 items-center",
        )}
      >
        <Pin number={owner.number} />
        {shape === "search" && (
          <Search className="size-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
        )}
        <span
          className={cn(
            "h-4 w-px shrink-0 bg-teal-600 dark:bg-teal-400",
            shape === "textarea" && "mt-0.5",
          )}
          aria-hidden="true"
        />
        <PartName>{owner.part.name}</PartName>
        {shape === "stepper" && (
          <span className="ml-auto flex shrink-0 flex-col gap-0.5" aria-hidden="true">
            <Plus className="size-3 text-zinc-400 dark:text-zinc-500" />
            <Minus className="size-3 text-zinc-400 dark:text-zinc-500" />
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
        shape === "button" && "bg-zinc-800 dark:bg-zinc-200",
        shape !== "button" &&
          "bg-zinc-100 ring-1 ring-zinc-950/10 dark:bg-zinc-800 dark:ring-white/10",
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
              shape === "button" && "text-zinc-400 dark:text-zinc-500",
            )}
          >
            {value.part.name}
          </PartName>
        </span>
      )}
      {chevron && (
        <ChevronDown
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
  if (shape === "tab" || shape === "crumb") {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3 pt-1">
        {[0, 1, 2].map((index) => (
          <span key={index} className="contents">
            {shape === "crumb" && index > 0 && (
              <ChevronRight className="size-3.5 text-zinc-400" aria-hidden="true" />
            )}
            <span
              className={cn(
                "relative inline-flex min-h-8 items-center gap-2 rounded-md px-3",
                index === 0 &&
                  "bg-teal-600/10 ring-1 ring-teal-600/30 dark:bg-teal-400/10 dark:ring-teal-400/30",
                index !== 0 &&
                  "bg-zinc-100 ring-1 ring-zinc-950/10 dark:bg-zinc-800 dark:ring-white/10",
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
            index === 1 && "bg-teal-600/10 dark:bg-teal-400/10",
          )}
        >
          {index === 0 && <Pin number={owner.number} />}
          {shape === "radio" && (
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                index === 1 && "border-teal-600 dark:border-teal-400",
                index !== 1 && "border-zinc-400 dark:border-zinc-500",
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
            <Check
              className="ml-auto size-3.5 text-teal-700 dark:text-teal-300"
              aria-hidden="true"
            />
          )}
        </div>
      ))}
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
                "relative grid grid-cols-[minmax(0,1fr)] gap-3 rounded-xl p-4 pt-2.5",
                node.variant === "provider" &&
                  "border-2 border-dashed border-teal-600/40 dark:border-teal-400/30",
                node.variant === "container" &&
                  "border border-zinc-300 bg-zinc-50/50 dark:border-zinc-600 dark:bg-white/2",
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
