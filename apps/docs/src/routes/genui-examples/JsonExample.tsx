"use client";

import { GenUI, type GenUIAction } from "@comp0/genui";
import { useState } from "react";

type JsonExampleProps = { source: string; inventory: boolean; streaming: boolean };
export function JsonExample({ source, inventory, streaming }: JsonExampleProps) {
  const [receipt, setReceipt] = useState<GenUIAction>();
  return (
    <>
      <GenUI
        response={source}
        streaming={streaming}
        call={inventory ? "/genui/examples/tools" : undefined}
        onAction={setReceipt}
      />
      <div aria-live="polite">
        {receipt && (
          <section className="mt-4">
            <h3 className="font-semibold">Ballot received</h3>
            <p>{receipt.message}</p>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words">
              {JSON.stringify(receipt.values, null, 2)}
            </pre>
          </section>
        )}
      </div>
    </>
  );
}
