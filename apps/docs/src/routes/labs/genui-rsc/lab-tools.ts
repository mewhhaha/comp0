import { defineTool } from "@comp0/genui/rsc";
import { type } from "arktype";

const cities: Record<string, number> = { Oslo: 9, Lisbon: 21, Tokyo: 18, Nairobi: 24 };

// Declared on its own: an inline `.describe()` hides the input type from defineTool.
const forecastInput = type({ city: "string" }).describe("The city to forecast.");

/** The lab's host API: what the model's interface may call, with a schema for each input. */
const subscribeInput = type({ email: "string.email" }).describe("Who to tell about releases.");

export const labTools = {
  subscribe: defineTool({
    description: "Signs an email address up for release updates and confirms in one sentence.",
    input: subscribeInput,
    run: async ({ email }) => `Subscribed ${email} to release updates.`,
  }),
  forecast: defineTool({
    description:
      "The daily high for the next seven days in a city, as points { x: day, y: degrees }.",
    input: forecastInput,
    run: async ({ city }) => {
      // A pretend backend: stable numbers per city, with a little latency.
      await new Promise((resolve) => setTimeout(resolve, 300));
      const base = cities[city] ?? 15;
      return Array.from({ length: 7 }, (_, day) => ({
        x: day + 1,
        y: Math.round((base + 4 * Math.sin(day + city.length)) * 10) / 10,
      }));
    },
  }),
};
