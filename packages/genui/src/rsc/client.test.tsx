import { act, screen, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import { fromJsonSchema, oneOf } from "../catalog/schema.js";
import { state } from "../composition/state.js";
import {
  GenUIClientNode,
  GenUIRoot,
  GenUIServerNode,
  GenUIStreamEnd,
  GenUIViewScope,
} from "./client.js";
const tripState = state({ city: oneOf(["Oslo", "Tokyo"]) }, { city: "Oslo" });
describe("dependent server components", () => {
  it("keeps form-local fields editable without opening the host state contract", async () => {
    const contract = state({ email: fromJsonSchema<number>({ type: "number" }) }, { email: 1 });
    const store = contract.createStore();
    const onAction = vi.fn();
    const { user } = setup(
      <GenUIRoot state={contract} store={store} onAction={onAction}>
        <GenUIViewScope>
          <GenUIClientNode name="Form" props={{ label: "Contact", name: "contact" }}>
            <GenUIClientNode name="TextField" props={{ label: "Email", name: "email" }} />
          </GenUIClientNode>
          <GenUIStreamEnd errors={[]} />
        </GenUIViewScope>
      </GenUIRoot>,
    );
    await user.type(screen.getByRole("textbox", { name: "Email" }), "ada@example.com");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ values: { email: "ada@example.com" } }),
    );
    expect(store.getSnapshot()).toEqual({ email: 1 });
  });

  it("updates only dependent server components and ignores obsolete responses", async () => {
    const store = tripState.createStore();
    const pending: { resolve: (content: ReactNode) => void; signal: AbortSignal }[] = [];
    const render = vi.fn(
      (_name, _props, signal: AbortSignal) =>
        new Promise<ReactNode>((resolve) => pending.push({ resolve, signal })),
    );
    setup(
      <GenUIRoot state={tripState} store={store} render={render}>
        <GenUIServerNode
          name="Forecast"
          props={{ city: { $expr: "city" } }}
          initialProps={{ city: "Oslo" }}
        >
          <p>Initial Oslo</p>
        </GenUIServerNode>
      </GenUIRoot>,
    );
    expect(render).not.toHaveBeenCalled();
    act(() => store.set("city", "Tokyo"));
    await waitFor(() => expect(render).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Initial Oslo")).toBeTruthy();
    act(() => store.set("city", "Oslo"));
    expect(pending[0]!.signal.aborted).toBe(true);
    await act(async () => pending[0]!.resolve(<p>Stale Tokyo</p>));
    expect(screen.queryByText("Stale Tokyo")).toBeNull();
    expect(screen.getByText("Initial Oslo")).toBeTruthy();
    act(() => store.set("city", "Tokyo"));
    await waitFor(() => expect(render).toHaveBeenCalledTimes(2));
    await act(async () => pending[1]!.resolve(<p>Fresh Tokyo</p>));
    expect(screen.getByText("Fresh Tokyo")).toBeTruthy();
    expect(screen.queryByText("Initial Oslo")).toBeNull();
  });

  it("retains the last accepted server view after a rejected refresh", async () => {
    const store = tripState.createStore();
    setup(
      <GenUIRoot
        state={tripState}
        store={store}
        render={() => {
          throw new Error("offline");
        }}
      >
        <GenUIServerNode
          name="Forecast"
          props={{ city: { $expr: "city" } }}
          initialProps={{ city: "Oslo" }}
        >
          Accepted view
        </GenUIServerNode>
      </GenUIRoot>,
    );
    act(() => store.set("city", "Tokyo"));
    expect((await screen.findByRole("status")).textContent).toContain("could not be updated");
    expect(screen.getByText("Accepted view")).toBeTruthy();
  });

  it("withholds reactive controls when their accessible name becomes empty", () => {
    const contract = state(
      { label: fromJsonSchema<string>({ type: "string" }) },
      { label: "Guests" },
    );
    const store = contract.createStore();
    setup(
      <GenUIRoot state={contract} store={store}>
        <GenUIViewScope>
          <GenUIClientNode name="TextField" props={{ label: { $expr: "label" } }} />
          <GenUIClientNode name="Button" props={{}} text={[{ $expr: "label" }]} />
          <GenUIStreamEnd errors={[]} />
        </GenUIViewScope>
      </GenUIRoot>,
    );
    expect(screen.getByRole("textbox", { name: "Guests" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Guests" })).toBeTruthy();
    act(() => store.set("label", ""));
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    act(() => store.set("label", "People"));
    expect(screen.getByRole("button", { name: "People" })).toBeTruthy();
  });

  it("reports settled validation errors once even if the host replaces its callback", () => {
    const first = vi.fn();
    const next = vi.fn();
    const errors = [{ path: "/0", code: "unknown-type" as const, message: "Unknown component" }];
    const { rerender } = setup(
      <GenUIRoot onError={first}>
        <GenUIViewScope>
          <GenUIStreamEnd errors={errors} />
        </GenUIViewScope>
      </GenUIRoot>,
    );
    expect(first).toHaveBeenCalledExactlyOnceWith(errors);
    rerender(
      <GenUIRoot onError={next}>
        <GenUIViewScope>
          <GenUIStreamEnd errors={errors} />
        </GenUIViewScope>
      </GenUIRoot>,
    );
    expect(next).not.toHaveBeenCalled();
  });
});
