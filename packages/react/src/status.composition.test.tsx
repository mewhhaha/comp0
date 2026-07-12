import { act } from "react";
import { describe, expect, it } from "vitest";
import { render } from "../test/render.js";
import { Label } from "./components/Label.js";
import { Meter } from "./components/Meter.js";
import { ProgressBar } from "./components/ProgressBar.js";
import { Separator } from "./components/Separator.js";
import { SkipLink } from "./components/SkipLink.js";
import { TextField } from "./components/TextField.js";
import { VisuallyHidden } from "./components/VisuallyHidden.js";

function fireFocusOut(element: Element, relatedTarget: Element | null) {
  act(() => {
    element.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget }));
  });
}

describe("Separator", () => {
  it("renders a native hr by default", () => {
    const { container } = render(<Separator />);
    const separator = container.querySelector("hr")!;

    expect(separator).not.toBeNull();
    expect(separator.getAttribute("data-orientation")).toBe("horizontal");
  });

  it("renders a div with the separator role when vertical", () => {
    const { container } = render(<Separator orientation="vertical" />);
    const separator = container.querySelector<HTMLElement>("[role='separator']")!;

    expect(separator.tagName).toBe("DIV");
    expect(separator.getAttribute("aria-orientation")).toBe("vertical");
    expect(separator.getAttribute("data-orientation")).toBe("vertical");
  });

  it("honors a decorative role override", () => {
    const { container } = render(
      <>
        <Separator role="presentation" />
        <Separator orientation="vertical" role="presentation" />
      </>,
    );
    const decorative = container.querySelectorAll("[role='presentation']");

    expect(decorative).toHaveLength(2);
    expect(container.querySelector("[role='separator']")).toBeNull();
  });
});

describe("ProgressBar", () => {
  it("renders a native progress with value, max, and a value fraction variable", () => {
    const { container } = render(<ProgressBar aria-label="Upload" value={25} max={100} />);
    const progress = container.querySelector("progress")!;

    expect(progress.getAttribute("value")).toBe("25");
    expect(progress.getAttribute("max")).toBe("100");
    expect(progress.getAttribute("aria-label")).toBe("Upload");
    expect(progress.hasAttribute("data-indeterminate")).toBe(false);
    expect(progress.style.getPropertyValue("--comp0-progress-value")).toBe("0.25");
  });

  it("marks a bar without a value as indeterminate", () => {
    const { container } = render(<ProgressBar aria-label="Loading" />);
    const progress = container.querySelector("progress")!;

    expect(progress.hasAttribute("value")).toBe(false);
    expect(progress.hasAttribute("data-indeterminate")).toBe(true);
    expect(progress.style.getPropertyValue("--comp0-progress-value")).toBe("");
  });

  it("wires the field Label to the progress element", () => {
    const { container } = render(
      <TextField>
        <Label>Upload</Label>
        <ProgressBar value={0.5} />
      </TextField>,
    );
    const label = container.querySelector("label")!;
    const progress = container.querySelector("progress")!;

    expect(progress.id).not.toBe("");
    expect(label.htmlFor).toBe(progress.id);
  });
});

describe("Meter", () => {
  it("renders a native meter with its range attributes and a fraction variable", () => {
    const { container } = render(
      <Meter aria-label="Storage" value={30} min={0} max={100} low={20} high={80} optimum={10} />,
    );
    const meter = container.querySelector("meter")!;

    expect(meter.getAttribute("value")).toBe("30");
    expect(meter.getAttribute("min")).toBe("0");
    expect(meter.getAttribute("max")).toBe("100");
    expect(meter.getAttribute("low")).toBe("20");
    expect(meter.getAttribute("high")).toBe("80");
    expect(meter.getAttribute("optimum")).toBe("10");
    expect(meter.style.getPropertyValue("--comp0-meter-value")).toBe("0.3");
  });

  it("wires the field Label to the meter element", () => {
    const { container } = render(
      <TextField>
        <Label>Battery</Label>
        <Meter value={0.6} />
      </TextField>,
    );
    const label = container.querySelector("label")!;
    const meter = container.querySelector("meter")!;

    expect(meter.id).not.toBe("");
    expect(label.htmlFor).toBe(meter.id);
  });
});

describe("SkipLink", () => {
  it("stays visually hidden until focused, then hides again on blur", () => {
    const { container } = render(
      <>
        <SkipLink href="#main" style={{ background: "black" }}>
          Skip to content
        </SkipLink>
        <a href="#other">Other</a>
      </>,
    );
    const link = container.querySelector<HTMLAnchorElement>("a[href='#main']")!;

    expect(link.style.position).toBe("absolute");
    expect(link.style.background).toBe("black");
    expect(link.hasAttribute("data-focused")).toBe(false);

    act(() => link.focus());
    expect(link.style.position).toBe("");
    expect(link.style.background).toBe("black");
    expect(link.hasAttribute("data-focused")).toBe(true);

    fireFocusOut(link, container.querySelector("a[href='#other']"));
    expect(link.style.position).toBe("absolute");
    expect(link.hasAttribute("data-focused")).toBe(false);
  });
});

describe("VisuallyHidden", () => {
  it("keeps content hidden while focused when not focusable", () => {
    const { container } = render(
      <VisuallyHidden>
        <a href="#target">Hidden link</a>
      </VisuallyHidden>,
    );
    const wrapper = container.querySelector<HTMLElement>("[data-slot='visually-hidden']")!;

    act(() => wrapper.querySelector("a")!.focus());
    expect(wrapper.style.position).toBe("absolute");
  });

  it("reveals focusable content while focus stays within and re-hides after", () => {
    const { container } = render(
      <VisuallyHidden focusable>
        <a href="#first">First</a>
        <a href="#second">Second</a>
      </VisuallyHidden>,
    );
    const wrapper = container.querySelector<HTMLElement>("[data-slot='visually-hidden']")!;
    const links = wrapper.querySelectorAll("a");

    expect(wrapper.style.position).toBe("absolute");

    act(() => links[0]!.focus());
    expect(wrapper.style.position).toBe("");

    // Focus moving to a descendant keeps it revealed.
    fireFocusOut(links[0]!, links[1]!);
    expect(wrapper.style.position).toBe("");

    // Focus leaving the subtree hides it again.
    fireFocusOut(links[1]!, null);
    expect(wrapper.style.position).toBe("absolute");
  });
});
