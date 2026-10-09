import { type ReactElement } from "react";
import { setup } from "../../react/test/render.js";
import { GenUI, type GenUIProps } from "../src/render/GenUI.js";
import { asJson } from "./answers/index.js";
import { type JsonValue } from "../src/json/parse.js";

export { setup };

/** Renders a response (text, or a value written out as JSON) with the comp0 catalog. */
export function renderResponse(
  response: string | JsonValue | null,
  props: Partial<GenUIProps> = {},
) {
  const text = typeof response === "string" || response === null ? response : asJson(response);
  return setup(<GenUI response={text} {...props} />);
}

export function element(ui: ReactElement) {
  return setup(ui);
}

/** Renders components inside a Stack, which is how a response normally starts. */
export function renderStack(children: JsonValue[], props: Partial<GenUIProps> = {}) {
  return renderResponse({ type: "Stack", children }, props);
}
