import { GenUI } from "@comp0/genui";

type JsonResponseStageProps = {
  response: string;
  streaming: boolean;
  onAction: (message: string) => void;
};

// This module is the only importer of @comp0/genui in the docs client graph, and the demo loads
// it with import(), so the GenUI runtime stays out of every other page's bundle.
export function JsonResponseStage({ response, streaming, onAction }: JsonResponseStageProps) {
  return (
    <div data-genui="">
      <GenUI
        response={response}
        streaming={streaming}
        onAction={(event) => onAction(event.message)}
      />
    </div>
  );
}
