"use client";

import { Button, CodeEditor, Description, Label, TextField } from "@comp0/react";
import { useState } from "react";

const initialCode = `export function Greeting({ name }) {
  return <p>Hello, {name}!</p>;
}`;

export function Example() {
  const [editing, setEditing] = useState(false);

  return (
    <TextField as="div" className="flex w-full max-w-lg flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
          Component source
        </Label>
        <Button
          className="select-none rounded px-2 py-1 text-sm font-medium text-teal-700 outline-teal-600 hover:bg-teal-50 focus-visible:outline-2 dark:text-teal-300 dark:outline-teal-400 dark:hover:bg-teal-950"
          onClick={() => setEditing((current) => !current)}
        >
          {editing ? "Finish editing" : "Edit code"}
        </Button>
      </div>
      <Description className="text-sm text-zinc-500 dark:text-zinc-400">
        {editing ? "Editing. Tab moves to the next control." : "Read-only code preview."}
      </Description>
      <CodeEditor
        className="min-h-40 w-full resize-y overflow-auto rounded border border-zinc-950/10 bg-zinc-950 p-4 font-mono text-sm/6 text-zinc-100 outline-teal-600 [tab-size:2] focus-visible:outline-2 data-readonly:cursor-text dark:border-white/10 dark:outline-teal-400"
        defaultValue={initialCode}
        name="source"
        readOnly={!editing}
      />
    </TextField>
  );
}
