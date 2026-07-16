import { act } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { render } from "../test/render.js";
import { Avatar } from "./components/Avatar.js";
import { AvatarFallback } from "./components/AvatarFallback.js";
import { AvatarImage } from "./components/AvatarImage.js";

function fireImageEvent(element: Element, type: "load" | "error") {
  act(() => {
    element.dispatchEvent(new Event(type, { cancelable: true }));
  });
}

function Fixture() {
  return (
    <Avatar>
      <AvatarImage src="https://example.com/ada.png" alt="Ada Kaplan" />
      <AvatarFallback>AK</AvatarFallback>
    </Avatar>
  );
}

describe("avatar composition", () => {
  it("shows the fallback and hides the image until the load event fires", () => {
    const { container } = render(<Fixture />);
    const root = container.querySelector("[data-slot='avatar']")!;
    const image = container.querySelector("img")!;
    const fallback = container.querySelector("[data-slot='avatar-fallback']")!;
    expect(image.hasAttribute("hidden")).toBe(true);
    expect(fallback.hasAttribute("hidden")).toBe(false);
    expect(root.hasAttribute("data-loaded")).toBe(false);

    fireImageEvent(image, "load");
    expect(image.hasAttribute("hidden")).toBe(false);
    expect(fallback.hasAttribute("hidden")).toBe(true);
    expect(root.hasAttribute("data-loaded")).toBe(true);
    expect(root.hasAttribute("data-error")).toBe(false);
  });

  it("keeps the fallback and hides the image after a load error", () => {
    const { container } = render(<Fixture />);
    const root = container.querySelector("[data-slot='avatar']")!;
    const image = container.querySelector("img")!;

    fireImageEvent(image, "error");
    expect(image.hasAttribute("hidden")).toBe(true);
    expect(container.querySelector("[data-slot='avatar-fallback']")!.hasAttribute("hidden")).toBe(
      false,
    );
    expect(root.hasAttribute("data-error")).toBe(true);
    expect(root.hasAttribute("data-loaded")).toBe(false);
  });

  it("reports an already-complete image as loaded on mount", () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
    const naturalWidth = vi
      .spyOn(HTMLImageElement.prototype, "naturalWidth", "get")
      .mockReturnValue(24);

    const { container } = render(<Fixture />);
    expect(container.querySelector("img")!.hasAttribute("hidden")).toBe(false);
    expect(container.querySelector("[data-slot='avatar']")!.hasAttribute("data-loaded")).toBe(true);

    complete.mockRestore();
    naturalWidth.mockRestore();
  });

  it("runs consumer image handlers first and respects preventDefault", () => {
    const onLoad = vi.fn((event: React.SyntheticEvent<HTMLImageElement>) => event.preventDefault());
    const { container } = render(
      <Avatar>
        <AvatarImage src="https://example.com/ada.png" alt="Ada Kaplan" onLoad={onLoad} />
        <AvatarFallback>AK</AvatarFallback>
      </Avatar>,
    );

    fireImageEvent(container.querySelector("img")!, "load");
    expect(onLoad).toHaveBeenCalledOnce();
    expect(container.querySelector("[data-slot='avatar']")!.hasAttribute("data-loaded")).toBe(
      false,
    );
    expect(container.querySelector("img")!.hasAttribute("hidden")).toBe(true);
  });

  it("throws with the part name when rendered outside Avatar", () => {
    expect(() => render(<AvatarImage src="https://example.com/ada.png" alt="" />)).toThrow(
      "AvatarImage must be rendered inside Avatar.",
    );
    expect(() => render(<AvatarFallback>AK</AvatarFallback>)).toThrow(
      "AvatarFallback must be rendered inside Avatar.",
    );
  });

  it("server-renders the fallback visible and the image hidden", () => {
    const markup = renderToString(<Fixture />);
    expect(markup).toContain("AK");
    expect(markup).toMatch(/<img[^>]* hidden/);
    expect(markup).not.toMatch(/<span[^>]*data-slot="avatar-fallback"[^>]* hidden/);
    expect(markup).not.toContain("data-loaded");
    expect(markup).not.toContain("data-error");
  });
});
