import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "../../test/render.js";
import { useRenderedId } from "./rendered-id.js";

function Probe({ id, withTarget }: { id: string; withTarget: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const rendered = useRenderedId(ref, id, withTarget);
  return (
    <div ref={ref} data-rendered={rendered}>
      {withTarget && <span id={id} />}
    </div>
  );
}

describe("useRenderedId", () => {
  it("returns the id only while an element with that id is rendered", () => {
    const { container, rerender } = render(<Probe id="rendered-id-label" withTarget={false} />);
    expect(container.firstElementChild?.hasAttribute("data-rendered")).toBe(false);

    rerender(<Probe id="rendered-id-label" withTarget />);
    expect(container.firstElementChild?.getAttribute("data-rendered")).toBe("rendered-id-label");

    rerender(<Probe id="rendered-id-label" withTarget={false} />);
    expect(container.firstElementChild?.hasAttribute("data-rendered")).toBe(false);
  });
});
