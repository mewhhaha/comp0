import { afterEach, describe, expect, it } from "vitest";
import { firstFocusableAfter, firstFocusableBefore } from "./feed-shared.js";

function mount(markup: string) {
  const root = document.createElement("div");
  root.innerHTML = markup;
  document.body.append(root);
  return root;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("feed escape targets", () => {
  it("finds the nearest focusable element outside the feed on each side", () => {
    const root = mount(`
      <button id="far">Far</button>
      <button id="before">Before</button>
      <div id="feed"><a href="#inside">Inside</a></div>
      <button id="after">After</button>
    `);
    const feed = root.querySelector<HTMLElement>("#feed")!;
    expect(firstFocusableBefore(feed)?.id).toBe("before");
    expect(firstFocusableAfter(feed)?.id).toBe("after");
  });

  it("skips hidden, disabled, and tabindex -1 elements", () => {
    const root = mount(`
      <button id="before">Before</button>
      <button id="disabled" disabled>Disabled</button>
      <div id="feed"></div>
      <div hidden><button id="hidden">Hidden</button></div>
      <button id="skipped" tabindex="-1">Skipped</button>
      <button id="after">After</button>
    `);
    const feed = root.querySelector<HTMLElement>("#feed")!;
    expect(firstFocusableBefore(feed)?.id).toBe("before");
    expect(firstFocusableAfter(feed)?.id).toBe("after");
  });

  it("returns null when nothing focusable surrounds the feed", () => {
    const feed = mount(`<div id="feed"><button>Inside</button></div>`);
    expect(firstFocusableAfter(feed.querySelector("#feed")!)).toBeNull();
    expect(firstFocusableBefore(feed.querySelector("#feed")!)).toBeNull();
  });
});
