import { act } from "react";
import { describe, expect, it } from "vitest";
import { fireKeyDown, render } from "../test/render.js";
import { Feed, type FeedProps } from "./components/Feed.js";
import { FeedArticle } from "./components/FeedArticle.js";

function focus(element: HTMLElement) {
  act(() => {
    element.focus();
  });
}

function renderFeed(props: Partial<FeedProps> = {}) {
  const result = render(
    <div>
      <button type="button">Refresh</button>
      <Feed aria-label="Recipe feed" {...props}>
        <FeedArticle>
          <h2>Soup</h2>
          <a href="/soup">Read soup</a>
        </FeedArticle>
        <FeedArticle>
          <h2>Salad</h2>
        </FeedArticle>
        <FeedArticle>
          <h2>Stew</h2>
        </FeedArticle>
      </Feed>
      <button type="button">Load older</button>
    </div>,
  );
  const feed = result.container.querySelector<HTMLElement>("[role='feed']")!;
  const articles = [...result.container.querySelectorAll<HTMLElement>("article")];
  const [before, after] = [
    ...result.container.querySelectorAll<HTMLButtonElement>(":scope > div > button"),
  ];
  return { ...result, feed, articles, before: before!, after: after! };
}

describe("feed composition", () => {
  it("preserves explicit set metadata through client registration", () => {
    const { container } = render(
      <Feed aria-label="Updates">
        <FeedArticle aria-posinset={4} aria-setsize={10}>
          Fourth
        </FeedArticle>
      </Feed>,
    );
    const article = container.querySelector("article")!;

    expect(article.getAttribute("aria-posinset")).toBe("4");
    expect(article.getAttribute("aria-setsize")).toBe("10");
  });

  it("renders role feed with focusable articles carrying posinset and setsize", () => {
    const { feed, articles } = renderFeed();
    expect(feed.getAttribute("aria-label")).toBe("Recipe feed");
    expect(feed.hasAttribute("aria-busy")).toBe(false);
    expect(articles).toHaveLength(3);
    expect(articles.map((article) => article.tabIndex)).toEqual([0, 0, 0]);
    expect(articles.map((article) => article.getAttribute("aria-posinset"))).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(articles.map((article) => article.getAttribute("aria-setsize"))).toEqual([
      "3",
      "3",
      "3",
    ]);
  });

  it("announces a known total through aria-setsize", () => {
    const { articles } = renderFeed({ total: 12 });
    expect(articles[0]!.getAttribute("aria-setsize")).toBe("12");
    expect(articles[2]!.getAttribute("aria-posinset")).toBe("3");
  });

  it("marks loading with aria-busy and data-busy", () => {
    const { feed } = renderFeed({ busy: true });
    expect(feed.getAttribute("aria-busy")).toBe("true");
    expect(feed.hasAttribute("data-busy")).toBe(true);
  });

  it("moves between articles with PageDown and PageUp, stopping at the ends", () => {
    const { articles } = renderFeed();
    focus(articles[0]!);
    fireKeyDown(articles[0]!, "PageDown");
    expect(document.activeElement).toBe(articles[1]);

    fireKeyDown(articles[1]!, "PageDown");
    expect(document.activeElement).toBe(articles[2]);

    fireKeyDown(articles[2]!, "PageDown");
    expect(document.activeElement).toBe(articles[2]);

    fireKeyDown(articles[2]!, "PageUp");
    expect(document.activeElement).toBe(articles[1]);

    fireKeyDown(articles[1]!, "PageUp");
    expect(document.activeElement).toBe(articles[0]);

    fireKeyDown(articles[0]!, "PageUp");
    expect(document.activeElement).toBe(articles[0]);
  });

  it("moves from a control inside an article relative to that article", () => {
    const { container, articles } = renderFeed();
    const link = container.querySelector<HTMLAnchorElement>("a")!;
    focus(link);
    fireKeyDown(link, "PageDown");
    expect(document.activeElement).toBe(articles[1]);
  });

  it("escapes the feed with Ctrl+End and Ctrl+Home", () => {
    const { articles, before, after } = renderFeed();
    focus(articles[1]!);
    fireKeyDown(articles[1]!, "End", { ctrlKey: true });
    expect(document.activeElement).toBe(after);

    focus(articles[1]!);
    fireKeyDown(articles[1]!, "Home", { ctrlKey: true });
    expect(document.activeElement).toBe(before);
  });

  it("leaves plain End and Home alone", () => {
    const { articles } = renderFeed();
    focus(articles[1]!);
    fireKeyDown(articles[1]!, "End");
    expect(document.activeElement).toBe(articles[1]);
  });
});
