import { renderToReadableStream } from "react-dom/server";
import { type ReactNode } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { oneOf } from "../catalog/schema.js";
import { type StandardJSONSchemaV1, type StandardSchemaV1 } from "../catalog/standard-schema.js";
import { layout, builtInVocabulary } from "../composition/builtins.js";
import { spec, vocabulary } from "../composition/spec.js";
import { state } from "../composition/state.js";
import { GenUIRoot } from "./client.js";
import { renderComponent, serverComponent } from "./components.js";
import { hole, holes } from "./holes.js";
import { GenUIView } from "./surface.js";

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
  it("streams JSX children through custom client containers", async () => {
    const Frame = spec("Frame", {
      description: "A custom container",
      props: {},
      children: "nodes",
    });
    function FrameComponent({ children }: { children?: ReactNode }) {
      return <aside>{children}</aside>;
    }
    const ui = vocabulary(layout, Frame);
    const rendered = await html(
      <GenUIRoot vocabulary={ui}>
        <GenUIView
          vocabulary={ui}
          components={{ Frame: FrameComponent }}
          stream={chunks("<Frame><Heading level={2}>Trip</Heading><Text>A &amp; B</Text></Frame>")}
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
    const Forecast = serverComponent("Forecast", {
      description: "Forecast",
      props: { city: oneOf(["Oslo", "Tokyo"]) },
      render,
    });
    const components = { Forecast };
    const ui = vocabulary(Forecast.spec);
    const rendered = await html(
      <GenUIRoot state={tripState} vocabulary={ui}>
        <GenUIView
          vocabulary={ui}
          state={tripState}
          components={components}
          stream={chunks("<Forecast city={city} />")}
        />
      </GenUIRoot>,
    );
    expect(rendered).toContain("Oslo");
    expect(render).toHaveBeenCalledExactlyOnceWith({ city: "Oslo" });
    await expect(renderComponent(components, "Forecast", { city: "London" })).rejects.toThrow(
      "Invalid Forecast props",
    );
    await expect(renderComponent(components, "constructor", {})).rejects.toThrow(
      "Unknown server component",
    );
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("fills independently constrained holes from one response", async () => {
    const page = holes({
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
    const ServerCount = serverComponent("ServerCount", {
      description: "A count",
      props: { count },
      render({ count }) {
        expectTypeOf(count).toEqualTypeOf<number>();
        return <p>Server {count}</p>;
      },
    });
    const ClientCount = spec("ClientCount", { description: "A count", props: { count } }).implement(
      ({ count }) => {
        expectTypeOf(count).toEqualTypeOf<number>();
        return <p>Client {count}</p>;
      },
    );
    const ui = vocabulary(ServerCount.spec, ClientCount);
    const rendered = await html(
      <GenUIRoot vocabulary={ui}>
        <GenUIView
          vocabulary={ui}
          components={{ ServerCount }}
          stream={chunks('<ServerCount count="12" /><ClientCount count="12" />')}
        />
      </GenUIRoot>,
    );
    expect(rendered).toContain("Server 13");
    expect(rendered).toContain("Client 13");
    expect(
      await html(await renderComponent({ ServerCount }, "ServerCount", { count: "12" })),
    ).toContain("Server 13");
  });
});
