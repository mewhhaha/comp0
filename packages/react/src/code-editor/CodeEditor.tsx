import { dataAttr } from "@comp0/core";
import { TextArea, type TextAreaProps } from "../text-area/TextArea.js";

export type CodeEditorProps = TextAreaProps;

export function CodeEditor({
  autoCapitalize,
  autoComplete,
  autoCorrect,
  readOnly,
  spellCheck,
  wrap,
  ...props
}: CodeEditorProps) {
  return (
    <TextArea
      {...props}
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
