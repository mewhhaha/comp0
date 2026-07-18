import { useLayoutEffect, useRef, useState } from "react";
import {
  FloatingPanel,
  FloatingPanelClose,
  FloatingPanelDragHandle,
  FloatingPanelGroup,
  FloatingPanelHeader,
  FloatingPanelResizeHandle,
  FloatingPanelSurface,
  FloatingPanelTitle,
  FloatingPanelTrigger,
  type FloatingPanelPosition,
} from "@comp0/react";

type PanelPositions = {
  layers: FloatingPanelPosition;
  properties: FloatingPanelPosition;
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

const triggerClassName =
  "rounded-lg border border-zinc-950/10 px-3 py-2 text-sm font-medium outline-teal-600 hover:bg-zinc-50 focus-visible:outline-2 dark:border-white/10 dark:outline-teal-400 dark:hover:bg-zinc-800";
const surfaceClassName =
  "w-72 min-w-56 min-h-44 overflow-auto rounded-xl border border-zinc-950/10 bg-white shadow-xl outline-teal-600 data-active:outline-2 data-active:outline-teal-500 data-moving:outline-dashed data-resizing:outline-dashed dark:border-white/10 dark:bg-zinc-900 dark:outline-teal-400";

export function Example() {
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const layersTriggerRef = useRef<HTMLButtonElement | null>(null);
  const propertiesTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [positions, setPositions] = useState<PanelPositions | null>(null);

  useLayoutEffect(() => {
    const workspace = workspaceRef.current;
    const layersTrigger = layersTriggerRef.current;
    const propertiesTrigger = propertiesTriggerRef.current;
    if (!workspace || !layersTrigger || !propertiesTrigger || positions) return;
    const rect = workspace.getBoundingClientRect();
    const panelTop = Math.min(
      Math.max(
        layersTrigger.getBoundingClientRect().bottom,
        propertiesTrigger.getBoundingClientRect().bottom,
      ) + 8,
      rect.bottom - 196,
    );
    setPositions({
      layers: { x: rect.left + 20, y: panelTop },
      properties: { x: rect.right - 308, y: panelTop },
    });
  }, [positions]);

  return (
    <FloatingPanelGroup boundary={workspaceRef}>
      <div
        ref={workspaceRef}
        className="flex min-h-[30rem] flex-col items-start gap-4 rounded-xl border border-dashed border-zinc-950/15 bg-zinc-50 p-5 dark:border-white/15 dark:bg-zinc-950"
      >
        <div>
          <h2 className="font-semibold text-zinc-950 dark:text-white">Workspace</h2>
          <p className="mt-1 max-w-md text-sm/6 text-zinc-600 dark:text-zinc-400">
            Open both inspectors, drag a header or its grip, resize from a corner, and use Tab to
            explore each panel. F6 is an optional shortcut between regions.
          </p>
        </div>
        <div className="flex w-full max-w-xl justify-between gap-2">
          <FloatingPanel
            defaultOpen
            position={positions?.layers ?? null}
            onPositionChange={(position) => {
              setPositions((current) => (current ? { ...current, layers: position } : current));
            }}
          >
            <FloatingPanelTrigger ref={layersTriggerRef} className={triggerClassName}>
              Layers
            </FloatingPanelTrigger>
            <FloatingPanelSurface placement="bottom start" className={surfaceClassName}>
              <FloatingPanelHeader className="flex cursor-grab items-center gap-2 border-b border-zinc-950/10 px-3 py-2 data-moving:cursor-grabbing dark:border-white/10">
                <FloatingPanelDragHandle className="cursor-grab touch-none rounded p-1 text-zinc-400 outline-teal-600 hover:bg-zinc-100 active:cursor-grabbing focus-visible:outline-2 data-moving:cursor-grabbing dark:outline-teal-400 dark:hover:bg-zinc-800">
                  <MoveGrip />
                </FloatingPanelDragHandle>
                <FloatingPanelTitle className="flex-1 text-sm font-semibold text-zinc-950 dark:text-white">
                  Layers
                </FloatingPanelTitle>
                <FloatingPanelClose className="rounded px-1.5 py-0.5 text-zinc-500 outline-teal-600 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-2 dark:outline-teal-400 dark:hover:bg-zinc-800 dark:hover:text-white">
                  ×
                </FloatingPanelClose>
              </FloatingPanelHeader>
              <div className="space-y-1 p-3 text-sm text-zinc-700 dark:text-zinc-300">
                <button className="block w-full rounded bg-teal-50 px-2 py-1.5 text-left outline-teal-600 focus-visible:outline-2 dark:bg-teal-950 dark:outline-teal-400">
                  Header
                </button>
                <button className="block w-full rounded px-2 py-1.5 text-left outline-teal-600 hover:bg-zinc-50 focus-visible:outline-2 dark:outline-teal-400 dark:hover:bg-zinc-800">
                  Product grid
                </button>
                <button className="block w-full rounded px-2 py-1.5 text-left outline-teal-600 hover:bg-zinc-50 focus-visible:outline-2 dark:outline-teal-400 dark:hover:bg-zinc-800">
                  Footer
                </button>
              </div>
              <FloatingPanelResizeHandle className="absolute right-1 bottom-1 size-7 cursor-nwse-resize rounded text-zinc-400 outline-teal-600 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-2 dark:outline-teal-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                <ResizeGrip />
              </FloatingPanelResizeHandle>
            </FloatingPanelSurface>
          </FloatingPanel>

          <FloatingPanel
            position={positions?.properties ?? null}
            onPositionChange={(position) => {
              setPositions((current) => (current ? { ...current, properties: position } : current));
            }}
          >
            <FloatingPanelTrigger ref={propertiesTriggerRef} className={triggerClassName}>
              Properties
            </FloatingPanelTrigger>
            <FloatingPanelSurface placement="bottom end" className={surfaceClassName}>
              <FloatingPanelHeader className="flex cursor-grab items-center gap-2 border-b border-zinc-950/10 px-3 py-2 data-moving:cursor-grabbing dark:border-white/10">
                <FloatingPanelDragHandle className="cursor-grab touch-none rounded p-1 text-zinc-400 outline-teal-600 hover:bg-zinc-100 active:cursor-grabbing focus-visible:outline-2 data-moving:cursor-grabbing dark:outline-teal-400 dark:hover:bg-zinc-800">
                  <MoveGrip />
                </FloatingPanelDragHandle>
                <FloatingPanelTitle className="flex-1 text-sm font-semibold text-zinc-950 dark:text-white">
                  Properties
                </FloatingPanelTitle>
                <FloatingPanelClose className="rounded px-1.5 py-0.5 text-zinc-500 outline-teal-600 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-2 dark:outline-teal-400 dark:hover:bg-zinc-800 dark:hover:text-white">
                  ×
                </FloatingPanelClose>
              </FloatingPanelHeader>
              <div className="grid grid-cols-[auto_1fr] items-center gap-3 p-3 text-sm text-zinc-700 dark:text-zinc-300">
                <label htmlFor="panel-opacity">Opacity</label>
                <input id="panel-opacity" className="w-full" type="range" defaultValue="80" />
                <label htmlFor="panel-name">Name</label>
                <input
                  id="panel-name"
                  className="min-w-0 rounded border border-zinc-950/10 px-2 py-1 outline-teal-600 focus-visible:outline-2 dark:border-white/10 dark:outline-teal-400"
                  defaultValue="Header"
                />
              </div>
              <FloatingPanelResizeHandle className="absolute right-1 bottom-1 size-7 cursor-nwse-resize rounded text-zinc-400 outline-teal-600 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-2 dark:outline-teal-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                <ResizeGrip />
              </FloatingPanelResizeHandle>
            </FloatingPanelSurface>
          </FloatingPanel>
        </div>
      </div>
    </FloatingPanelGroup>
  );
}
