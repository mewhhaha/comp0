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
  it("exposes progress semantics and a value fraction to a custom fill", () => {
    const { container } = render(
      <ProgressBar aria-label="Upload" aria-valuetext="1 of 4 files" value={25} max={100}>
        {({ percentage }) => <span data-fill>{percentage}%</span>}
      </ProgressBar>,
    );
    const progress = container.querySelector<HTMLElement>("[role='progressbar']")!;

    expect(progress.tagName).toBe("DIV");
    expect(progress.getAttribute("aria-valuenow")).toBe("25");
    expect(progress.getAttribute("aria-valuemin")).toBe("0");
    expect(progress.getAttribute("aria-valuemax")).toBe("100");
    expect(progress.getAttribute("aria-label")).toBe("Upload");
    expect(progress.getAttribute("aria-valuetext")).toBe("1 of 4 files");
    expect(progress.hasAttribute("data-indeterminate")).toBe(false);
    expect(progress.querySelector("[data-fill]")?.textContent).toBe("25%");
    expect(progress.style.getPropertyValue("--comp0-progress-value")).toBe("0.25");
  });

  it("marks a bar without a value as indeterminate", () => {
    const { container } = render(<ProgressBar aria-label="Loading" />);
    const progress = container.querySelector<HTMLElement>("[role='progressbar']")!;

    expect(progress.hasAttribute("aria-valuenow")).toBe(false);
    expect(progress.getAttribute("aria-valuemin")).toBe("0");
    expect(progress.getAttribute("aria-valuemax")).toBe("1");
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
    const progress = container.querySelector<HTMLElement>("[role='progressbar']")!;

    expect(progress.id).not.toBe("");
    expect(label.htmlFor).toBe(progress.id);
    expect(progress.getAttribute("aria-labelledby")).toBe(label.id);
  });
});

describe("Meter", () => {
  it("exposes meter semantics, thresholds, and a value fraction to a custom fill", () => {
    const { container } = render(
      <Meter
        aria-label="Storage"
        aria-valuetext="30 GB used"
        value={30}
        min={0}
        max={100}
        low={20}
        high={80}
        optimum={10}
      >
        {({ percentage }) => <span data-fill>{percentage}%</span>}
      </Meter>,
    );
    const meter = container.querySelector<HTMLElement>("[role='meter']")!;

    expect(meter.tagName).toBe("DIV");
    expect(meter.getAttribute("aria-valuenow")).toBe("30");
    expect(meter.getAttribute("aria-valuemin")).toBe("0");
    expect(meter.getAttribute("aria-valuemax")).toBe("100");
    expect(meter.getAttribute("aria-valuetext")).toBe("30 GB used");
    expect(meter.getAttribute("data-low")).toBe("20");
    expect(meter.getAttribute("data-high")).toBe("80");
    expect(meter.getAttribute("data-optimum")).toBe("10");
    expect(meter.querySelector("[data-fill]")?.textContent).toBe("30%");
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
    const meter = container.querySelector<HTMLElement>("[role='meter']")!;

    expect(meter.id).not.toBe("");
    expect(label.htmlFor).toBe(meter.id);
    expect(meter.getAttribute("aria-labelledby")).toBe(label.id);
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
