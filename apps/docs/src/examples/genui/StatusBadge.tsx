import {
  catalog,
  catalogSpecs,
  defineEntry,
  GenUI,
  genuiPrompt,
  responseJsonSchema,
} from "@comp0/genui";
import { type } from "arktype";

const status = {
  name: "StatusBadge",
  description: "Show a short status, such as Shipped.",
  group: "Feedback",
  props: { text: type("string > 0").describe("The status to display.") },
};

const specs = [...catalogSpecs, status];
export const systemPrompt = genuiPrompt({ catalog: specs });
export const schema = responseJsonSchema({ catalog: specs });

const badge = defineEntry(status, ({ text }) => <strong>{text}</strong>);
const components = [...catalog, badge];

export function StatusExample() {
  return <GenUI catalog={components} response={{ type: "StatusBadge", text: "Shipped" }} />;
}
