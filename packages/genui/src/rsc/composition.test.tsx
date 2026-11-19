import { renderToReadableStream } from "react-dom/server";
import { type ReactNode } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { oneOf } from "../catalog/schema.js";
import { type StandardJSONSchemaV1, type StandardSchemaV1 } from "../catalog/standard-schema.js";
import { layout, builtInVocabulary } from "../composition/builtins.js";
import { spec, vocabulary } from "../composition/spec.js";
import { composition } from "../composition/composition.js";
import { state } from "../composition/state.js";
import { GenUIRoot } from "./client.js";
import { serverComponent } from "./components.js";
import { hole } from "./holes.js";
import { createRenderer } from "./renderer.js";

async function* chunks(source: string) {
  for (const char of source) yield char;
}
async function html(node: ReactNode) {
  const stream = await renderToReadableStream(node);
  await stream.allReady;
  return (await new Response(stream).text()).replace(/<!--.*?-->/g, "");
}
const tripState = state({ city: oneOf(["Oslo", "Tokyo"]) }, { city: "Oslo" });

describe("RSC composition", () => {
  it("rejects incomplete or mismatched registrations and out-of-scope holes during setup", () => {
    const Forecast = spec("Forecast", { description: "Weather", props: {} });
    const other = spec("Forecast", { description: "Different contract", props: {} });
    const ui = composition({ vocabulary: vocabulary(Forecast) });
    const view = Forecast.implement(() => null);
    expect(() => createRenderer(ui)).toThrow("Missing implementation: Forecast");
    expect(() => createRenderer(ui, view, view)).toThrow("Duplicate implementation: Forecast");
    expect(() =>
      createRenderer(
        ui,
        other.implement(() => null),
      ),
    ).toThrow("vocabulary's spec");
    const renderer = createRenderer(ui, view);
    expect(() => renderer.holes({ forecast: hole(vocabulary(other), "Weather") })).toThrow(
      "outside the composition",
    );
    expect(() => renderer.holes({ forecast: hole(vocabulary(Forecast), "Weather") })).not.toThrow();
  });

  it.each(["", ' id="picker"'])(
    "combines binding and an expression-only label on a custom component (%s)",
    async (id) => {
      const City = spec("City", {
        description: "Pick a city.",
        props: { value: oneOf(["Oslo", "Tokyo"]) },
        children: "label",
        binding: { prop: "value", kind: "string" },
      });
      const ui = composition({ vocabulary: vocabulary(City), state: tripState });
      const renderer = createRenderer(
        ui,
        City.implement(({ value, onChange, children }) => (
          <button value={value} disabled={!onChange}>
            {children}
          </button>
        )),
      );
      const rendered = await html(
        <GenUIRoot ui={ui}>
          <renderer.View source={`<City${id} bind="city">{city}</City>`} />
        </GenUIRoot>,
      );
      expect(rendered).toContain('<button value="Oslo">Oslo</button>');
    },
  );

  it("streams JSX children through custom client containers", async () => {
    const Frame = spec("Frame", {
      description: "A custom container",
      props: {},
      children: "nodes",
    });
    function FrameComponent({ children }: { children?: ReactNode }) {
      return <aside>{children}</aside>;
    }
    const ui = composition({ vocabulary: vocabulary(layout, Frame) });
    const renderer = createRenderer(ui, Frame.implement(FrameComponent));
    const rendered = await html(
      <GenUIRoot ui={ui}>
        <renderer.View
          source={chunks("<Frame><Heading level={2}>Trip</Heading><Text>A &amp; B</Text></Frame>")}
        />
      </GenUIRoot>,
    );
    expect(rendered).toContain("<aside>");
    expect(rendered).toContain("Trip");
    expect(rendered).toContain("A &amp; B");
    expect(rendered).not.toContain("&amp;amp;");
  });

  it("fetches initial data once on the server and validates subsequent requests", async () => {
    const render = vi.fn(async ({ city }: { city: string }) => <p>Forecast for {city}</p>);
    const Forecast = spec("Forecast", {
      description: "Forecast",
      props: { city: oneOf(["Oslo", "Tokyo"]) },
    });
    const ui = composition({ vocabulary: vocabulary(Forecast), state: tripState });
    const renderer = createRenderer(ui, serverComponent(Forecast, render));
    const rendered = await html(
      <GenUIRoot ui={ui}>
        <renderer.View source={chunks("<Forecast city={city} />")} />
      </GenUIRoot>,
    );
    expect(rendered).toContain("Oslo");
    expect(render).toHaveBeenCalledExactlyOnceWith({ city: "Oslo" });
    await expect(renderer.render("Forecast", { city: "London" })).rejects.toThrow(
      "Invalid Forecast props",
    );
    await expect(renderer.render("constructor", {})).rejects.toThrow("Unknown server component");
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("fills independently constrained holes from one response", async () => {
    const renderer = createRenderer(composition({ vocabulary: builtInVocabulary }));
    const page = renderer.holes({
      summary: hole(layout.only("Text"), "Summary", { max: 1 }),
      controls: hole(builtInVocabulary.only("Slider"), "Controls"),
    });
    const answer = page.fill(
      chunks(
        '<summary><Text>Accepted</Text><Text>Over limit</Text><Slider label="Wrong" /></summary><controls><Text>Wrong vocabulary</Text><Slider label="Guests" /></controls>',
      ),
    );
    const rendered = await html(
      <GenUIRoot>
        <article>
          <answer.summary />
        </article>
        <aside>
          <answer.controls />
        </aside>
      </GenUIRoot>,
    );
    expect(rendered).toContain("Accepted");
    expect(rendered).toContain("Guests");
    expect(rendered).not.toContain("Over limit");
    expect(rendered).not.toContain("Wrong vocabulary");
  });

  it("delivers schema outputs to both client and server components without double transforms", async () => {
    const count: StandardSchemaV1<string, number> & StandardJSONSchemaV1<string, number> = {
      "~standard": {
        version: 1,
        vendor: "test",
        validate(input) {
          if (typeof input !== "string") return { issues: [{ message: "Expected string" }] };
          return { value: Number(input) + 1 };
        },
        jsonSchema: {
          input: () => ({ type: "string" }),
          output: () => ({ type: "number" }),
        },
      },
    };
    const ServerCount = spec("ServerCount", {
      description: "A count",
      props: { count },
    });
    const server = serverComponent(ServerCount, ({ count }) => {
      expectTypeOf(count).toEqualTypeOf<number>();
      return <p>Server {count}</p>;
    });
    const ClientCount = spec("ClientCount", { description: "A count", props: { count } });
    const client = ClientCount.implement(({ count }) => {
      expectTypeOf(count).toEqualTypeOf<number>();
      return <p>Client {count}</p>;
    });
    const ui = composition({ vocabulary: vocabulary(ServerCount, ClientCount) });
    const renderer = createRenderer(ui, server, client);
    const rendered = await html(
      <GenUIRoot ui={ui}>
        <renderer.View source={chunks('<ServerCount count="12" /><ClientCount count="12" />')} />
      </GenUIRoot>,
    );
    expect(rendered).toContain("Server 13");
    expect(rendered).toContain("Client 13");
    expect(await html(await renderer.render("ServerCount", { count: "12" }))).toContain(
      "Server 13",
    );
  });
});
