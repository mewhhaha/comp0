"use client";

import { GenUI, type GenUIAction } from "@comp0/genui";
import { useState } from "react";

type JsonExampleProps = { source: string; inventory: boolean };
export function JsonExample({ source, inventory }: JsonExampleProps) {
  const [receipt, setReceipt] = useState<GenUIAction>();
  return (
    <>
      <GenUI
        response={source}
        call={inventory ? "/genui/examples/tools" : undefined}
        onAction={setReceipt}
      />
      {receipt && (
        <section className="mt-4" aria-live="polite">
          <h3 className="font-semibold">Ballot received</h3>
          <p>{receipt.message}</p>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words">
            {JSON.stringify(receipt.values, null, 2)}
          </pre>
        </section>
      )}
    </>
  );
}
