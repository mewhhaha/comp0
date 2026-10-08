import { act } from "react";
import { describe, expect, it } from "vitest";
import { render, setup } from "../../test/render.js";
import { Feed, type FeedProps } from "./Feed.js";
import { FeedArticle } from "./FeedArticle.js";

function focus(element: HTMLElement) {
  act(() => {
    element.focus();
  });
}

function renderFeed(props: Partial<FeedProps> = {}) {
  const result = setup(
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

  it("moves between articles with PageDown and PageUp, stopping at the ends", async () => {
    const { articles, user } = renderFeed();
    focus(articles[0]!);
    await user.keyboard("{PageDown}");
    expect(document.activeElement).toBe(articles[1]);

    await user.keyboard("{PageDown}");
    expect(document.activeElement).toBe(articles[2]);

    await user.keyboard("{PageDown}");
    expect(document.activeElement).toBe(articles[2]);

    await user.keyboard("{PageUp}");
    expect(document.activeElement).toBe(articles[1]);

    await user.keyboard("{PageUp}");
    expect(document.activeElement).toBe(articles[0]);

    await user.keyboard("{PageUp}");
    expect(document.activeElement).toBe(articles[0]);
  });

  it("moves from a control inside an article relative to that article", async () => {
    const { container, articles, user } = renderFeed();
    const link = container.querySelector<HTMLAnchorElement>("a")!;
    focus(link);
    await user.keyboard("{PageDown}");
    expect(document.activeElement).toBe(articles[1]);
  });

  it("escapes the feed with Ctrl+End and Ctrl+Home", async () => {
    const { articles, before, after, user } = renderFeed();
    focus(articles[1]!);
    await user.keyboard("{Control>}{End}{/Control}");
    expect(document.activeElement).toBe(after);

    focus(articles[1]!);
    await user.keyboard("{Control>}{Home}{/Control}");
    expect(document.activeElement).toBe(before);
  });

  it("leaves plain End and Home alone", async () => {
    const { articles, user } = renderFeed();
    focus(articles[1]!);
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(articles[1]);
  });
});
