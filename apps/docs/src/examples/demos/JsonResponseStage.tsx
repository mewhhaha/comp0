import { GenUI } from "@comp0/genui";

type JsonResponseStageProps = {
  response: string;
  streaming: boolean;
  onAction: (message: string) => void;
};

// The replay demo loads its JSON renderer when the reader presses Play.
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
