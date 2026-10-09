import { act } from "react";
import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import {
  Composer,
  ComposerInput,
  ComposerSend,
  ComposerStop,
  CopyButton,
  Feedback,
  FeedbackButton,
  Message,
  MessageAuthor,
  MessageContent,
  Messages,
  Reasoning,
  ReasoningContent,
  ReasoningSummary,
  Suggestion,
  Suggestions,
} from "./index.js";
import { expectNoAxeViolations } from "../test/axe.js";
import { render } from "../test/render.js";

describe("conversation parts in a real browser", () => {
  it("has no axe violations while a message streams, with reasoning expanded", async () => {
    const { container } = render(
      <Messages aria-label="Conversation" busy>
        <Message from="assistant" status="streaming">
          <MessageAuthor>Assistant</MessageAuthor>
          <Reasoning busy>
            <ReasoningSummary>Thinking…</ReasoningSummary>
            <ReasoningContent>Comparing results.</ReasoningContent>
          </Reasoning>
          <MessageContent>Partial answ</MessageContent>
        </Message>
      </Messages>,
    );
    await expectNoAxeViolations(container, "streaming");

    const summary = container.querySelector<HTMLElement>("summary")!;
    await act(async () => userEvent.click(summary));
    expect(container.querySelector("details")!.open).toBe(true);
    await expectNoAxeViolations(container, "reasoning expanded while busy");
  });

  it("sends with Enter, keeps focus, shows stop, and stays free of axe violations", async () => {
    const onSend = vi.fn();
    const { container } = render(
      <>
        <Composer onSend={onSend} generating>
          <ComposerInput aria-label="Message" />
          <ComposerSend>Send</ComposerSend>
          <ComposerStop>Stop</ComposerStop>
        </Composer>
        <Suggestions aria-label="Quick replies" onSend={onSend}>
          <Suggestion value="Thanks">Thanks</Suggestion>
        </Suggestions>
        <Feedback aria-label="Rate this response">
          <FeedbackButton value="good">Good response</FeedbackButton>
          <FeedbackButton value="bad">Bad response</FeedbackButton>
        </Feedback>
      </>,
    );
    await expectNoAxeViolations(container, "generating");

    const feedback = container.querySelector<HTMLElement>("[aria-pressed]")!;
    await act(async () => userEvent.click(feedback));
    expect(feedback.getAttribute("aria-pressed")).toBe("true");
    await expectNoAxeViolations(container, "rated");
  });

  it("types, sends with Enter and returns focus to the input", async () => {
    const onSend = vi.fn();
    const { container } = render(
      <Composer onSend={onSend}>
        <ComposerInput aria-label="Message" />
        <ComposerSend>Send</ComposerSend>
      </Composer>,
    );
    const input = container.querySelector<HTMLTextAreaElement>("textarea")!;
    await act(async () => userEvent.click(input));
    await act(async () => userEvent.keyboard("hi{Shift>}{Enter}{/Shift}there{Enter}"));

    expect(onSend).toHaveBeenCalledExactlyOnceWith("hi\nthere");
    expect(document.activeElement).toBe(input);
  });

  it("announces a copy and has no axe violations in the copied state", async () => {
    const write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const { container } = render(
      <CopyButton value="npm i @comp0/react">Copy install command</CopyButton>,
    );
    const button = container.querySelector<HTMLElement>("button")!;

    await act(async () => userEvent.click(button));

    expect(write).toHaveBeenCalledWith("npm i @comp0/react");
    expect(container.querySelector("[role='status']")!.textContent).toBe("Copied");
    expect(button.hasAttribute("data-copied")).toBe(true);
    await expectNoAxeViolations(container, "copied");
    write.mockRestore();
  });
});
