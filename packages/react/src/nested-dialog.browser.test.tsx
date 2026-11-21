import { act, type ReactElement } from "react";
import { userEvent } from "vitest/browser";
import { afterEach, describe, expect, it } from "vitest";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "./index.js";
import { cleanupRoots, render } from "../test/render.js";

// A modal surface opened from inside another: React bubbles the inner `<dialog>`'s cancel and
// close events through the React tree to the outer one, which must ignore them. One Escape
// closes only the top layer and focus returns to the inner trigger.

const cases: { name: string; inner: ReactElement }[] = [
  {
    name: "dialog in a dialog",
    inner: (
      <Dialog>
        <DialogTrigger>Open inner</DialogTrigger>
        <DialogContent aria-label="Inner">
          <button type="button">Inner action</button>
        </DialogContent>
      </Dialog>
    ),
  },
  {
    name: "drawer in a dialog",
    inner: (
      <Drawer>
        <DrawerTrigger>Open inner</DrawerTrigger>
        <DrawerContent aria-label="Inner">
          <button type="button">Inner action</button>
        </DrawerContent>
      </Drawer>
    ),
  },
];

function buttonNamed(name: string) {
  return [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (button) => button.textContent?.trim() === name,
  )!;
}

describe.each(cases)("$name", ({ inner }) => {
  afterEach(() => cleanupRoots());

  it("closes only the top layer on Escape and returns focus to its trigger", async () => {
    render(
      <Dialog>
        <DialogTrigger>Open outer</DialogTrigger>
        <DialogContent aria-label="Outer">{inner}</DialogContent>
      </Dialog>,
    );
    await act(async () => userEvent.click(buttonNamed("Open outer")));
    await act(async () => userEvent.click(buttonNamed("Open inner")));
    const outer = document.querySelector<HTMLDialogElement>("dialog[aria-label='Outer']")!;
    const innerDialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Inner']")!;
    expect([outer.open, innerDialog.open]).toEqual([true, true]);

    await act(async () => userEvent.keyboard("{Escape}"));
    expect([outer.open, innerDialog.open]).toEqual([true, false]);
    expect(document.activeElement).toBe(buttonNamed("Open inner"));

    await act(async () => userEvent.keyboard("{Escape}"));
    expect(outer.open).toBe(false);
    expect(document.activeElement).toBe(buttonNamed("Open outer"));
  });
});
