import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { TextArea, type TextAreaProps } from "./TextArea.js";

export type CodeEditorProps = TextAreaProps;

export function CodeEditor({
  autoCapitalize,
  autoComplete,
  autoCorrect,
  readOnly,
  ref,
  spellCheck,
  wrap,
  ...props
}: CodeEditorProps & RefProp<HTMLTextAreaElement>) {
  return (
    <TextArea
      {...props}
      ref={ref}
      autoCapitalize={autoCapitalize ?? "none"}
      autoComplete={autoComplete ?? "off"}
      autoCorrect={autoCorrect ?? "off"}
      readOnly={readOnly}
      spellCheck={spellCheck ?? false}
      wrap={wrap ?? "off"}
      data-readonly={dataAttr(Boolean(readOnly))}
    />
  );
}
