import { act, createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { FileTrigger } from "./components/FileTrigger.js";
import { DropZone } from "./components/DropZone.js";
import { fireClick, fireKeyDown, render } from "../test/render.js";

type DragFile = Pick<File, "name" | "type">;

function fireFileDrag(
  element: Element,
  type: "dragenter" | "dragleave" | "dragover" | "drop",
  files: DragFile[],
) {
  const dataTransfer = {
    dropEffect: "",
    files,
    items: files.map((file) => ({ kind: "file", type: file.type })),
    types: ["Files"],
  };
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", { value: dataTransfer });

  act(() => {
    element.dispatchEvent(event);
  });

  return { dataTransfer, event };
}

describe("DropZone", () => {
  it("accepts external files and exposes the active accepted drag state", () => {
    const dropped = vi.fn();
    const image = new File(["image"], "profile.png", { type: "image/png" });
    const { container } = render(
      <DropZone accept="image/*" aria-label="Profile image" onDrop={dropped} />,
    );
    const dropZone = container.querySelector<HTMLElement>("[data-slot='drop-zone']")!;

    const drag = fireFileDrag(dropZone, "dragenter", [image]);
    expect(drag.event.defaultPrevented).toBe(true);
    expect(dropZone.hasAttribute("data-active")).toBe(true);
    expect(dropZone.hasAttribute("data-accept")).toBe(true);
    expect(dropZone.hasAttribute("data-reject")).toBe(false);

    const over = fireFileDrag(dropZone, "dragover", [image]);
    expect(over.dataTransfer.dropEffect).toBe("copy");
    fireFileDrag(dropZone, "drop", [image]);

    expect(dropped).toHaveBeenCalledWith([image]);
    expect(dropZone.hasAttribute("data-active")).toBe(false);
  });

  it("rejects files that do not match its MIME type or extension", () => {
    const dropped = vi.fn();
    const rejected = vi.fn();
    const text = new File(["notes"], "notes.txt", { type: "text/plain" });
    const { container } = render(
      <DropZone accept="image/*,.png" onDrop={dropped} onDropRejected={rejected} />,
    );
    const dropZone = container.querySelector<HTMLElement>("[data-slot='drop-zone']")!;

    fireFileDrag(dropZone, "dragenter", [text]);
    expect(dropZone.hasAttribute("data-active")).toBe(true);
    expect(dropZone.hasAttribute("data-accept")).toBe(false);
    expect(dropZone.hasAttribute("data-reject")).toBe(true);

    const over = fireFileDrag(dropZone, "dragover", [text]);
    expect(over.dataTransfer.dropEffect).toBe("none");
    fireFileDrag(dropZone, "drop", [text]);

    expect(dropped).not.toHaveBeenCalled();
    expect(rejected).toHaveBeenCalledWith([text]);
    expect(dropZone.hasAttribute("data-active")).toBe(false);
  });

  it("clears drag state only after the pointer leaves the outer drop zone", () => {
    const image = new File(["image"], "profile.png", { type: "image/png" });
    const { container } = render(
      <DropZone accept="image/png">
        <span>Drop an image</span>
      </DropZone>,
    );
    const dropZone = container.querySelector<HTMLElement>("[data-slot='drop-zone']")!;
    const child = dropZone.querySelector("span")!;

    fireFileDrag(dropZone, "dragenter", [image]);
    fireFileDrag(child, "dragenter", [image]);
    fireFileDrag(child, "dragleave", [image]);
    expect(dropZone.hasAttribute("data-active")).toBe(true);

    fireFileDrag(dropZone, "dragleave", [image]);
    expect(dropZone.hasAttribute("data-active")).toBe(false);
  });

  it("does not accept file drags or drops when disabled", () => {
    const dropped = vi.fn();
    const image = new File(["image"], "profile.png", { type: "image/png" });
    const { container } = render(<DropZone disabled onDrop={dropped} />);
    const dropZone = container.querySelector<HTMLElement>("[data-slot='drop-zone']")!;

    const drag = fireFileDrag(dropZone, "dragenter", [image]);
    fireFileDrag(dropZone, "drop", [image]);

    expect(drag.event.defaultPrevented).toBe(false);
    expect(dropZone.hasAttribute("data-disabled")).toBe(true);
    expect(dropZone.hasAttribute("data-active")).toBe(false);
    expect(dropped).not.toHaveBeenCalled();
  });

  it("leaves native file selection to a composed FileTrigger", () => {
    const inputRef = createRef<HTMLInputElement>();
    const clicked = vi.fn();
    const { container } = render(
      <DropZone accept="image/png">
        <FileTrigger ref={inputRef} accept="image/png">
          Choose image
        </FileTrigger>
      </DropZone>,
    );
    const label = container.querySelector("label")!;
    const input = inputRef.current!;
    input.addEventListener("click", clicked);

    fireClick(label);
    expect(clicked).toHaveBeenCalledOnce();

    act(() => input.focus());
    fireKeyDown(input, "Enter");
    expect(document.activeElement).toBe(input);
    expect(input.accept).toBe("image/png");
  });
});
