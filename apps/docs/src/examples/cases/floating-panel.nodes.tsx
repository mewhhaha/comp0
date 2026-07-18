import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  FloatingPanel,
  FloatingPanelDragHandle,
  FloatingPanelGroup,
  FloatingPanelHeader,
  FloatingPanelResizeHandle,
  FloatingPanelSurface,
  FloatingPanelTitle,
  type FloatingPanelPosition,
} from "@comp0/react";

type NodeName = "coordinates" | "noise" | "shader";
type PortType = "color" | "shader" | "value" | "vector";
type OutputName = "generated" | "normal" | "uv" | "fac" | "color";
type InputName =
  | "vector"
  | "scale"
  | "detail"
  | "noise-roughness"
  | "base-color"
  | "roughness"
  | "metallic"
  | "shader-normal";

type NodePositions = Record<NodeName, FloatingPanelPosition>;

type PortDefinition = {
  label: string;
  node: NodeName;
  type: PortType;
};

type NodeConnection = {
  from: OutputName;
  to: InputName;
};

type ConnectionPath = NodeConnection & {
  path: string;
};

const inputPorts: Record<InputName, PortDefinition> = {
  vector: { label: "Vector", node: "noise", type: "vector" },
  scale: { label: "Scale", node: "noise", type: "value" },
  detail: { label: "Detail", node: "noise", type: "value" },
  "noise-roughness": { label: "Roughness", node: "noise", type: "value" },
  "base-color": { label: "Base Color", node: "shader", type: "color" },
  roughness: { label: "Roughness", node: "shader", type: "value" },
  metallic: { label: "Metallic", node: "shader", type: "value" },
  "shader-normal": { label: "Normal", node: "shader", type: "vector" },
};

const outputPorts: Record<OutputName, PortDefinition> = {
  generated: { label: "Generated", node: "coordinates", type: "vector" },
  normal: { label: "Normal", node: "coordinates", type: "vector" },
  uv: { label: "UV", node: "coordinates", type: "vector" },
  fac: { label: "Fac", node: "noise", type: "value" },
  color: { label: "Color", node: "noise", type: "color" },
};

const initialConnections: NodeConnection[] = [
  { from: "generated", to: "vector" },
  { from: "fac", to: "roughness" },
  { from: "color", to: "base-color" },
];

const nodeLabels: Record<NodeName, string> = {
  coordinates: "Texture Coordinate",
  noise: "Noise Texture",
  shader: "Principled BSDF",
};

const preferredTarget: Record<OutputName, InputName> = {
  generated: "vector",
  normal: "shader-normal",
  uv: "vector",
  fac: "roughness",
  color: "base-color",
};

const portClassName: Record<PortType, string> = {
  color: "bg-amber-400",
  shader: "bg-emerald-500",
  value: "bg-sky-500",
  vector: "bg-violet-500",
};

const connectionColor: Record<PortType, string> = {
  color: "rgb(245 158 11)",
  shader: "rgb(16 185 129)",
  value: "rgb(14 165 233)",
  vector: "rgb(139 92 246)",
};

function canConnect(from: OutputName, to: InputName) {
  const output = outputPorts[from];
  const input = inputPorts[to];
  return output.node !== input.node && output.type === input.type;
}

function curvePath(start: FloatingPanelPosition, end: FloatingPanelPosition) {
  const bend = Math.max(48, Math.abs(end.x - start.x) / 2);
  return `M ${start.x} ${start.y} C ${start.x + bend} ${start.y}, ${end.x - bend} ${end.y}, ${end.x} ${end.y}`;
}

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

type InputPortProps = {
  connectingFrom: OutputName | null;
  name: InputName;
  onAttach: (to: InputName) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, to: InputName) => void;
};

function InputPort({ connectingFrom, name, onAttach, onKeyDown }: InputPortProps) {
  const port = inputPorts[name];
  const compatible = connectingFrom ? canConnect(connectingFrom, name) : false;
  return (
    <button
      type="button"
      data-node-input={name}
      data-connect-target={compatible || undefined}
      aria-label={`Connect to ${nodeLabels[port.node]} ${port.label} input`}
      className={`absolute top-1/2 -left-2 z-10 size-4 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-white outline-teal-600 ring-1 ring-zinc-950/20 hover:scale-125 focus-visible:scale-125 focus-visible:outline-2 data-connect-target:scale-125 data-connect-target:ring-4 data-connect-target:ring-teal-500/25 dark:border-zinc-900 dark:outline-teal-400 ${portClassName[port.type]}`}
      onClick={() => {
        if (connectingFrom) onAttach(name);
      }}
      onKeyDown={(event) => onKeyDown(event, name)}
    />
  );
}

type OutputPortProps = {
  connectingFrom: OutputName | null;
  name: OutputName;
  onClick: (name: OutputName) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, from: OutputName) => void;
  onPointerCancel: () => void;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>, from: OutputName) => void;
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLButtonElement>, from: OutputName) => void;
};

function OutputPort({
  connectingFrom,
  name,
  onClick,
  onKeyDown,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: OutputPortProps) {
  const port = outputPorts[name];
  return (
    <button
      type="button"
      data-node-output={name}
      data-connecting={connectingFrom === name || undefined}
      aria-label={`Connect ${nodeLabels[port.node]} ${port.label} output`}
      aria-pressed={connectingFrom === name}
      className={`absolute top-1/2 -right-2 z-10 size-4 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-white outline-teal-600 ring-1 ring-zinc-950/20 hover:scale-125 focus-visible:scale-125 focus-visible:outline-2 data-connecting:scale-125 data-connecting:ring-4 data-connecting:ring-teal-500/25 dark:border-zinc-900 dark:outline-teal-400 ${portClassName[port.type]}`}
      onClick={(event) => {
        if (event.detail === 0) onClick(name);
      }}
      onKeyDown={(event) => onKeyDown(event, name)}
      onPointerDown={(event) => onPointerDown(event, name)}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => onPointerUp(event, name)}
      onPointerCancel={onPointerCancel}
    />
  );
}

const surfaceClassName =
  "min-h-32 rounded-xl border border-zinc-950/10 bg-white shadow-lg outline-teal-600 data-active:outline-2 data-active:outline-teal-500 data-moving:outline-dashed data-resizing:outline-dashed dark:border-white/10 dark:bg-zinc-900 dark:outline-teal-400";
const headerClassName =
  "flex cursor-grab select-none items-center gap-2 rounded-t-xl border-b border-zinc-950/10 bg-zinc-50 px-2.5 py-2 data-moving:cursor-grabbing dark:border-white/10 dark:bg-zinc-800";
const moveHandleClassName =
  "cursor-grab rounded p-1 text-zinc-400 outline-teal-600 hover:bg-zinc-950/5 active:cursor-grabbing focus-visible:outline-2 data-moving:cursor-grabbing dark:outline-teal-400 dark:hover:bg-white/5";
const resizeHandleClassName =
  "absolute right-1 bottom-1 size-6 cursor-nwse-resize rounded text-zinc-400 outline-teal-600 hover:bg-zinc-950/5 focus-visible:outline-2 dark:outline-teal-400 dark:hover:bg-white/5";
const portRowClassName =
  "relative flex h-7 items-center justify-between gap-2 px-3 text-[11px] text-zinc-600 dark:text-zinc-300";

export function Example() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Record<NodeName, HTMLDivElement | null>>({
    coordinates: null,
    noise: null,
    shader: null,
  });
  const connectionPointer = useRef<number | null>(null);
  const [positions, setPositions] = useState<NodePositions | null>(null);
  const [connections, setConnections] = useState(initialConnections);
  const [connectionPaths, setConnectionPaths] = useState<ConnectionPath[]>([]);
  const [connectingFrom, setConnectingFrom] = useState<OutputName | null>(null);
  const [pointerEnd, setPointerEnd] = useState<FloatingPanelPosition | null>(null);
  const [geometryVersion, setGeometryVersion] = useState(0);
  const [layoutKey, setLayoutKey] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  useLayoutEffect(() => {
    if (positions) return;
    const canvas = canvasRef.current;
    const ownerWindow = canvas?.ownerDocument.defaultView;
    if (!canvas || !ownerWindow) return;

    const placeNodes = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const visibleHeight =
        Math.min(canvasRect.bottom, ownerWindow.innerHeight) - Math.max(canvasRect.top, 0);
      if (visibleHeight < Math.min(360, canvasRect.height)) return;
      const toolbarRect = toolbarRef.current?.getBoundingClientRect();
      const sideWidth = canvasRect.width < 500 ? 136 : 200;
      const noiseWidth = canvasRect.width < 500 ? 200 : 220;
      const baseTop = Math.min(
        Math.max(24, canvasRect.top + 112, (toolbarRect?.bottom ?? canvasRect.top) + 16),
        ownerWindow.innerHeight - 360,
      );
      setPositions({
        coordinates: { x: canvasRect.left + 12, y: baseTop },
        noise: { x: canvasRect.left + (canvasRect.width - noiseWidth) / 2, y: baseTop + 170 },
        shader: { x: canvasRect.right - sideWidth - 12, y: baseTop },
      });
    };

    placeNodes();
    ownerWindow.addEventListener("scroll", placeNodes, { passive: true });
    ownerWindow.addEventListener("resize", placeNodes);
    return () => {
      ownerWindow.removeEventListener("scroll", placeNodes);
      ownerWindow.removeEventListener("resize", placeNodes);
    };
  }, [layoutKey, positions]);

  useLayoutEffect(() => {
    if (!positions) return;
    const paths = connections.flatMap((connection) => {
      const output = outputPorts[connection.from];
      const input = inputPorts[connection.to];
      const start = nodeRefs.current[output.node]?.querySelector<HTMLElement>(
        `[data-node-output="${connection.from}"]`,
      );
      const end = nodeRefs.current[input.node]?.querySelector<HTMLElement>(
        `[data-node-input="${connection.to}"]`,
      );
      const startRect = start?.getBoundingClientRect();
      const endRect = end?.getBoundingClientRect();
      if (!startRect || !endRect) return [];
      return [
        {
          ...connection,
          path: curvePath(
            { x: startRect.left + startRect.width / 2, y: startRect.top + startRect.height / 2 },
            { x: endRect.left + endRect.width / 2, y: endRect.top + endRect.height / 2 },
          ),
        },
      ];
    });
    setConnectionPaths(paths);
  }, [connections, geometryVersion, positions]);

  useEffect(() => {
    if (!connectingFrom) return;
    const ownerDocument = canvasRef.current?.ownerDocument;
    if (!ownerDocument) return;
    const cancelWithEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      connectionPointer.current = null;
      setConnectingFrom(null);
      setPointerEnd(null);
      setAnnouncement("Connection change cancelled.");
    };
    ownerDocument.addEventListener("keydown", cancelWithEscape, true);
    return () => ownerDocument.removeEventListener("keydown", cancelWithEscape, true);
  }, [connectingFrom]);

  const geometryChanged = () => setGeometryVersion((version) => version + 1);
  const updatePosition = (name: NodeName, position: FloatingPanelPosition) => {
    setPositions((current) => (current ? { ...current, [name]: position } : current));
  };
  const clearBinding = () => {
    connectionPointer.current = null;
    setConnectingFrom(null);
    setPointerEnd(null);
  };
  const cancelBinding = () => {
    if (!connectingFrom) return;
    clearBinding();
    setAnnouncement("Connection change cancelled.");
  };
  const attach = (from: OutputName, to: InputName) => {
    const output = outputPorts[from];
    const input = inputPorts[to];
    if (!canConnect(from, to)) {
      clearBinding();
      const reason =
        output.node === input.node ? "a node cannot connect to itself" : "port types differ";
      setAnnouncement(
        `${nodeLabels[output.node]} ${output.label} cannot connect to ${nodeLabels[input.node]} ${input.label}; ${reason}.`,
      );
      return;
    }
    setConnections((current) => [
      ...current.filter((connection) => connection.from !== from && connection.to !== to),
      { from, to },
    ]);
    clearBinding();
    setAnnouncement(
      `${nodeLabels[output.node]} ${output.label} connected to ${nodeLabels[input.node]} ${input.label}.`,
    );
  };
  const beginKeyboardBinding = (from: OutputName) => {
    const output = outputPorts[from];
    const target = preferredTarget[from];
    setConnectingFrom(from);
    setPointerEnd(null);
    setAnnouncement(
      `Connecting ${nodeLabels[output.node]} ${output.label}. Move to a compatible input and press Enter or Space. Press Escape to cancel.`,
    );
    const input = inputPorts[target];
    nodeRefs.current[input.node]
      ?.querySelector<HTMLButtonElement>(`[data-node-input="${target}"]`)
      ?.focus();
  };
  const handleOutputKeyDown = (event: KeyboardEvent<HTMLButtonElement>, from: OutputName) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (connectingFrom === from) cancelBinding();
    else beginKeyboardBinding(from);
  };
  const handleInputKeyDown = (event: KeyboardEvent<HTMLButtonElement>, to: InputName) => {
    if (!connectingFrom || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    attach(connectingFrom, to);
  };
  const beginPointerBinding = (event: PointerEvent<HTMLButtonElement>, from: OutputName) => {
    const output = outputPorts[from];
    event.preventDefault();
    connectionPointer.current = event.pointerId;
    setConnectingFrom(from);
    setPointerEnd({ x: event.clientX, y: event.clientY });
    setAnnouncement(
      `Connecting ${nodeLabels[output.node]} ${output.label}. Drag to an input port.`,
    );
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const continuePointerBinding = (event: PointerEvent<HTMLButtonElement>) => {
    if (connectionPointer.current !== event.pointerId) return;
    setPointerEnd({ x: event.clientX, y: event.clientY });
  };
  const finishPointerBinding = (event: PointerEvent<HTMLButtonElement>, from: OutputName) => {
    if (connectionPointer.current !== event.pointerId) return;
    const target = event.currentTarget.ownerDocument
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-node-input]");
    const targetName = target?.dataset.nodeInput as InputName | undefined;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (targetName) attach(from, targetName);
    else cancelBinding();
  };
  const reset = () => {
    setConnections(initialConnections);
    setConnectionPaths([]);
    setPositions(null);
    clearBinding();
    setAnnouncement("Shader nodes and connections reset.");
    setLayoutKey((key) => key + 1);
  };

  let previewPath: string | undefined;
  if (connectingFrom && pointerEnd) {
    const output = outputPorts[connectingFrom];
    const start = nodeRefs.current[output.node]?.querySelector<HTMLElement>(
      `[data-node-output="${connectingFrom}"]`,
    );
    const startRect = start?.getBoundingClientRect();
    if (startRect) {
      previewPath = curvePath(
        { x: startRect.left + startRect.width / 2, y: startRect.top + startRect.height / 2 },
        pointerEnd,
      );
    }
  }

  const connectionLayer = (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[999] size-full overflow-visible"
    >
      {connectionPaths.map((connection) => {
        const color = connectionColor[outputPorts[connection.from].type];
        return (
          <g key={`${connection.from}-${connection.to}`}>
            <path
              d={connection.path}
              fill="none"
              stroke={color}
              strokeOpacity="0.18"
              strokeWidth="8"
            />
            <path
              d={connection.path}
              fill="none"
              stroke={color}
              strokeDasharray="5 5"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </g>
        );
      })}
      {previewPath && connectingFrom && (
        <path
          d={previewPath}
          fill="none"
          stroke={connectionColor[outputPorts[connectingFrom].type]}
          strokeDasharray="4 6"
          strokeLinecap="round"
          strokeWidth="2"
        />
      )}
    </svg>
  );

  const portProps = {
    connectingFrom,
    onClick: beginKeyboardBinding,
    onKeyDown: handleOutputKeyDown,
    onPointerCancel: cancelBinding,
    onPointerDown: beginPointerBinding,
    onPointerMove: continuePointerBinding,
    onPointerUp: finishPointerBinding,
  };
  const inputPortProps = {
    connectingFrom,
    onAttach: (to: InputName) => {
      if (connectingFrom) attach(connectingFrom, to);
    },
    onKeyDown: handleInputKeyDown,
  };

  return (
    <div
      ref={canvasRef}
      className="relative min-h-[38rem] rounded-xl border border-dashed border-zinc-950/15 bg-zinc-50 dark:border-white/15 dark:bg-zinc-950"
    >
      <div ref={toolbarRef} className="relative z-10 flex items-start justify-between gap-4 p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">Procedural bronze</h2>
          <p className="mt-1 max-w-md text-xs/5 text-zinc-500 dark:text-zinc-400">
            Rewire typed shader ports: vectors are violet, values blue, colors amber, and shader
            closures green. Incompatible bindings are rejected.
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg border border-zinc-950/10 bg-white px-2.5 py-1.5 text-xs font-medium outline-teal-600 hover:bg-zinc-50 focus-visible:outline-2 dark:border-white/10 dark:bg-zinc-900 dark:outline-teal-400 dark:hover:bg-zinc-800"
          onClick={reset}
        >
          Reset graph
        </button>
      </div>

      {positions && (
        <FloatingPanelGroup key={layoutKey}>
          <FloatingPanel
            open
            position={positions.coordinates}
            onPositionChange={(position) => updatePosition("coordinates", position)}
            onSizeChange={geometryChanged}
          >
            <FloatingPanelSurface
              ref={(element) => {
                nodeRefs.current.coordinates = element;
              }}
              portal={false}
              className={surfaceClassName}
              style={{
                width: "clamp(136px, 24vw, 200px)",
                height: 160,
              }}
            >
              <FloatingPanelHeader className={headerClassName}>
                <FloatingPanelDragHandle className={moveHandleClassName}>
                  <MoveGrip />
                </FloatingPanelDragHandle>
                <FloatingPanelTitle className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-950 dark:text-white">
                  Texture Coordinate
                </FloatingPanelTitle>
                <span aria-hidden="true" className="size-2 rounded-full bg-violet-500" />
              </FloatingPanelHeader>
              <div className="py-1">
                {(["generated", "normal", "uv"] as const).map((name) => (
                  <div className={portRowClassName} key={name}>
                    <span />
                    <span>{outputPorts[name].label}</span>
                    <OutputPort {...portProps} name={name} />
                  </div>
                ))}
              </div>
              <FloatingPanelResizeHandle className={resizeHandleClassName}>
                <ResizeGrip />
              </FloatingPanelResizeHandle>
            </FloatingPanelSurface>
          </FloatingPanel>

          <FloatingPanel
            open
            position={positions.noise}
            onPositionChange={(position) => updatePosition("noise", position)}
            onSizeChange={geometryChanged}
          >
            <FloatingPanelSurface
              ref={(element) => {
                nodeRefs.current.noise = element;
              }}
              portal={false}
              className={surfaceClassName}
              style={{
                width: "clamp(200px, 26vw, 220px)",
                height: 184,
              }}
            >
              <FloatingPanelHeader className={headerClassName}>
                <FloatingPanelDragHandle className={moveHandleClassName}>
                  <MoveGrip />
                </FloatingPanelDragHandle>
                <FloatingPanelTitle className="flex-1 text-sm font-semibold text-zinc-950 dark:text-white">
                  Noise Texture
                </FloatingPanelTitle>
                <span aria-hidden="true" className="size-2 rounded-full bg-amber-500" />
              </FloatingPanelHeader>
              <div className="py-1">
                <div className={portRowClassName}>
                  <InputPort {...inputPortProps} name="vector" />
                  <span>Vector</span>
                  <span>Fac</span>
                  <OutputPort {...portProps} name="fac" />
                </div>
                <div className={portRowClassName}>
                  <InputPort {...inputPortProps} name="scale" />
                  <span>Scale</span>
                  <span>Color</span>
                  <OutputPort {...portProps} name="color" />
                </div>
                <div className={portRowClassName}>
                  <InputPort {...inputPortProps} name="detail" />
                  <span>Detail</span>
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 tabular-nums dark:bg-zinc-800">
                    2.0
                  </span>
                </div>
                <div className={portRowClassName}>
                  <InputPort {...inputPortProps} name="noise-roughness" />
                  <span>Roughness</span>
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 tabular-nums dark:bg-zinc-800">
                    0.5
                  </span>
                </div>
              </div>
              <FloatingPanelResizeHandle className={resizeHandleClassName}>
                <ResizeGrip />
              </FloatingPanelResizeHandle>
            </FloatingPanelSurface>
          </FloatingPanel>

          <FloatingPanel
            open
            position={positions.shader}
            onPositionChange={(position) => updatePosition("shader", position)}
            onSizeChange={geometryChanged}
          >
            <FloatingPanelSurface
              ref={(element) => {
                nodeRefs.current.shader = element;
              }}
              portal={false}
              className={surfaceClassName}
              style={{
                width: "clamp(136px, 24vw, 200px)",
                height: 184,
              }}
            >
              <FloatingPanelHeader className={headerClassName}>
                <FloatingPanelDragHandle className={moveHandleClassName}>
                  <MoveGrip />
                </FloatingPanelDragHandle>
                <FloatingPanelTitle className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-950 dark:text-white">
                  Principled BSDF
                </FloatingPanelTitle>
                <span aria-hidden="true" className="size-2 rounded-full bg-emerald-500" />
              </FloatingPanelHeader>
              <div className="py-1">
                <div className={portRowClassName}>
                  <InputPort {...inputPortProps} name="base-color" />
                  <span>Base Color</span>
                  <span>BSDF</span>
                  <span
                    aria-hidden="true"
                    className={`absolute top-1/2 -right-2 size-4 -translate-y-1/2 rounded-full border-2 border-white dark:border-zinc-900 ${portClassName.shader}`}
                  />
                </div>
                <div className={portRowClassName}>
                  <InputPort {...inputPortProps} name="roughness" />
                  <span>Roughness</span>
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 tabular-nums dark:bg-zinc-800">
                    0.35
                  </span>
                </div>
                <div className={portRowClassName}>
                  <InputPort {...inputPortProps} name="metallic" />
                  <span>Metallic</span>
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 tabular-nums dark:bg-zinc-800">
                    0.8
                  </span>
                </div>
                <div className={portRowClassName}>
                  <InputPort {...inputPortProps} name="shader-normal" />
                  <span>Normal</span>
                  <span />
                </div>
              </div>
              <FloatingPanelResizeHandle className={resizeHandleClassName}>
                <ResizeGrip />
              </FloatingPanelResizeHandle>
            </FloatingPanelSurface>
          </FloatingPanel>
        </FloatingPanelGroup>
      )}

      {positions && typeof document !== "undefined" && createPortal(connectionLayer, document.body)}
      <output className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </output>
    </div>
  );
}
