import { useLayoutEffect, useState, type SVGAttributes } from "react";
import { composeRefs } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { useConnectContext } from "./connect-shared.js";

export type ConnectLinesProps = Omit<SVGAttributes<SVGSVGElement>, "children">;

export function ConnectLines({ ref, ...props }: ConnectLinesProps & RefProp<SVGSVGElement>) {
  const { connections, ports, element } = useConnectContext("ConnectLines");
  const [svg, setSvg] = useState<SVGSVGElement | null>(null);
  const [paths, setPaths] = useState<{ from: string; to: string; d: string }[]>([]);

  useLayoutEffect(() => {
    if (!element || !svg) return;
    const window = element.ownerDocument.defaultView!;
    let frame = 0;
    function measure() {
      frame = 0;
      const matrix = svg!.getScreenCTM()?.inverse();
      if (!matrix) return;
      const next = connections.flatMap(({ from, to }) => {
        const output = ports.find((port) => port.direction === "output" && port.value === from);
        const input = ports.find((port) => port.direction === "input" && port.value === to);
        if (!output || !input) return [];
        const outputBounds = output.element.getBoundingClientRect();
        const inputBounds = (
          input.element.querySelector("[data-connect-input-trigger]") ?? input.element
        ).getBoundingClientRect();
        const start = new DOMPoint(
          outputBounds.right,
          outputBounds.top + outputBounds.height / 2,
        ).matrixTransform(matrix);
        const end = new DOMPoint(
          inputBounds.left,
          inputBounds.top + inputBounds.height / 2,
        ).matrixTransform(matrix);
        const bend = Math.max(40, Math.abs(end.x - start.x) / 2);
        return [
          {
            from,
            to,
            d: `M ${start.x} ${start.y} C ${start.x + bend} ${start.y}, ${end.x - bend} ${end.y}, ${end.x} ${end.y}`,
          },
        ];
      });
      setPaths((previous) => {
        if (
          previous.length === next.length &&
          previous.every(
            (path, index) =>
              path.from === next[index]!.from &&
              path.to === next[index]!.to &&
              path.d === next[index]!.d,
          )
        )
          return previous;
        return next;
      });
    }
    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(measure);
    }
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    for (const port of ports) resize.observe(port.element);
    const mutation = new MutationObserver((records) => {
      if (records.some((record) => !svg.contains(record.target))) schedule();
    });
    mutation.observe(element, {
      subtree: true,
      attributes: true,
      childList: true,
      characterData: true,
    });
    window.addEventListener("resize", schedule);
    element.ownerDocument.addEventListener("scroll", schedule, true);
    schedule();
    return () => {
      resize.disconnect();
      mutation.disconnect();
      window.removeEventListener("resize", schedule);
      element.ownerDocument.removeEventListener("scroll", schedule, true);
      window.cancelAnimationFrame(frame);
    };
  }, [connections, ports, element, svg]);

  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      {...props}
      ref={composeRefs(ref, setSvg)}
      aria-hidden="true"
      focusable="false"
      data-slot={dataSlot(props, "connect-lines")}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "visible",
        ...props.style,
        pointerEvents: "none",
      }}
    >
      {paths.map((path) => (
        <path key={path.to} data-from={path.from} data-to={path.to} d={path.d} />
      ))}
    </svg>
  );
}
