import { act, screen, waitFor } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import { type JsonValue } from "../json/parse.js";
import {
  GenUIApplyEdits,
  GenUIClientNode,
  GenUIEditable,
  GenUIRoot,
  GenUIStreamEnd,
  GenUIViewScope,
} from "./client.js";
import { type ClientEdit, type EditableNode } from "./edit-store.js";

function metadata(id: string, name: string, props: Record<string, JsonValue>): EditableNode {
  return { id, name, props, inputs: props };
}

describe("cross-turn composition", () => {
  it("updates and appends without remounting controls, losing focus, or replaying a turn", async () => {
    const card = metadata("card", "Card", { title: "Trip" });
    const input = metadata("note", "TextField", { label: "Note", value: "" });
    const list = metadata("list", "List", {});
    const revisedInput = metadata("note", "TextField", {
      label: "Trip note",
      value: "Model default",
    });
    const operations: ClientEdit[] = [
      {
        kind: "update",
        target: "card",
        expectedRevision: 0,
        node: metadata("card", "Card", { title: "Tokyo trip" }),
      },
      { kind: "update", target: "note", expectedRevision: 0, node: revisedInput },
      {
        kind: "append",
        target: "list",
        expectedRevision: 0,
        node: list,
        targets: [],
        children: (
          <GenUIClientNode key="ferry" name="Item" props={{}}>
            Book the ferry
          </GenUIClientNode>
        ),
      },
    ];
    const errors = vi.fn();
    function UI({ turns = 0 }: { turns?: number }) {
      return (
        <StrictMode>
          <GenUIRoot onError={errors}>
            <GenUIViewScope>
              <GenUIEditable node={card}>
                <GenUIEditable node={input} />
                <GenUIClientNode name="Disclosure" props={{ summary: "Details" }}>
                  <p>Keep this open</p>
                </GenUIClientNode>
                <GenUIEditable node={list}>
                  <GenUIClientNode name="Item" props={{}}>
                    Choose a hotel
                  </GenUIClientNode>
                </GenUIEditable>
              </GenUIEditable>
              <GenUIStreamEnd errors={[]} />
            </GenUIViewScope>
            {Array.from({ length: turns }, (_, index) => (
              <GenUIViewScope key={index}>
                <GenUIApplyEdits turn="assistant-2" operations={operations} errors={[]} />
              </GenUIViewScope>
            ))}
          </GenUIRoot>
        </StrictMode>
      );
    }
    const { user, rerender } = setup(<UI />);
    const textbox = screen.getByRole("textbox", { name: "Note" });
    const originalItem = screen.getByText("Choose a hotel");
    await user.click(screen.getByText("Details"));
    await user.type(textbox, "My plans");
    expect(document.activeElement).toBe(textbox);
    rerender(<UI turns={1} />);
    expect(screen.getByRole("textbox", { name: "Trip note" })).toBe(textbox);
    expect((textbox as HTMLInputElement).value).toBe("My plans");
    expect(document.activeElement).toBe(textbox);
    expect(screen.getByText("Choose a hotel")).toBe(originalItem);
    expect(screen.getByText("Details").getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Tokyo trip")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    rerender(<UI turns={2} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(errors).not.toHaveBeenCalled();
  });

  it("keeps equal unbound labels independent", async () => {
    const { user } = setup(
      <GenUIRoot>
        <GenUIViewScope>
          <GenUIClientNode name="TextField" props={{ label: "Note" }} />
          <GenUIClientNode name="TextField" props={{ label: "Note" }} />
          <GenUIStreamEnd errors={[]} />
        </GenUIViewScope>
      </GenUIRoot>,
    );
    const [first, second] = screen.getAllByRole("textbox", { name: "Note" });
    await user.type(first!, "Only here");
    expect((second as HTMLInputElement).value).toBe("");
  });

  it("refreshes only the named server component and keeps its accepted subtree until success", async () => {
    const forecast = metadata("forecast", "Forecast", { city: "Oslo" });
    const pending: { resolve: (node: ReactNode) => void; signal: AbortSignal }[] = [];
    const render = vi.fn(
      (_name, _props, signal: AbortSignal) =>
        new Promise<ReactNode>((resolve) => pending.push({ resolve, signal })),
    );
    function UI({ revised = false }: { revised?: boolean }) {
      return (
        <GenUIRoot render={render}>
          <GenUIViewScope>
            <GenUIEditable node={forecast} initialProps={{ city: "Oslo" }}>
              <p>Accepted Oslo</p>
            </GenUIEditable>
            <GenUIEditable
              node={metadata("other", "Forecast", { city: "Paris" })}
              initialProps={{ city: "Paris" }}
            >
              <p>Unchanged Paris</p>
            </GenUIEditable>
            <GenUIStreamEnd errors={[]} />
          </GenUIViewScope>
          {revised && (
            <GenUIViewScope>
              <GenUIApplyEdits
                turn="assistant-2"
                errors={[]}
                operations={[
                  {
                    kind: "update",
                    target: "forecast",
                    expectedRevision: 0,
                    node: metadata("forecast", "Forecast", { city: "Tokyo" }),
                  },
                ]}
              />
            </GenUIViewScope>
          )}
        </GenUIRoot>
      );
    }
    const { rerender } = setup(<UI />);
    expect(render).not.toHaveBeenCalled();
    rerender(<UI revised />);
    await waitFor(() => expect(render).toHaveBeenCalledTimes(1));
    expect(render).toHaveBeenCalledWith("Forecast", { city: "Tokyo" }, expect.any(AbortSignal));
    expect(screen.getByText("Accepted Oslo")).toBeTruthy();
    expect(screen.getByText("Unchanged Paris")).toBeTruthy();
    await act(async () => pending[0]!.resolve(<p>Fresh Tokyo</p>));
    expect(screen.getByText("Fresh Tokyo")).toBeTruthy();
    expect(screen.queryByText("Accepted Oslo")).toBeNull();
    expect(render).toHaveBeenCalledTimes(1);
  });
});
