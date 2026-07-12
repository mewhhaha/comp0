"use client";

import { Button, useToast } from "@comp0/react";
import { ClipboardDocumentIcon } from "@heroicons/react/16/solid";

type CodeBlockCopyButtonProps = {
  code: string;
};

export function CodeBlockCopyButton({ code }: CodeBlockCopyButtonProps) {
  const { notify } = useToast();

  return (
    <Button
      aria-label="Copy code"
      className="flex items-center rounded-md p-1.5 text-zinc-500 outline-none data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-teal-400 data-hovered:bg-white/10 data-hovered:text-zinc-200 data-pressed:bg-white/15"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
        } catch {
          return;
        }
        notify("Copied to clipboard");
      }}
    >
      <ClipboardDocumentIcon aria-hidden="true" className="size-5 sm:size-4" />
    </Button>
  );
}
