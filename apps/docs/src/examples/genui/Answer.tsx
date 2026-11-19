import { createRenderer, type ResponseSource } from "@comp0/genui/rsc";
import { AnswerRoot } from "./AnswerRoot.js";
import { ui } from "./ui.js";

const renderer = createRenderer(ui);

export function Answer({ source }: { source: ResponseSource }) {
  return (
    <AnswerRoot>
      <renderer.View source={source} />
    </AnswerRoot>
  );
}
