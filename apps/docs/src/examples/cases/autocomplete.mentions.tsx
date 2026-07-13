import { useState } from "react";
import { Autocomplete, Label, ListBox, ListBoxItem, TextArea, TextField } from "@comp0/react";

const teammates = ["Aisha", "Diego", "Mina", "Ren"];

function contains(textValue: string, inputValue: string) {
  return textValue.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase());
}

export function Example() {
  const [message, setMessage] = useState("Could @");
  const mention = message.match(/(?:^|\s)@(\w*)$/);
  const mentionQuery = mention?.[1] ?? "";

  function insertMention(name: string) {
    setMessage((current) => current.replace(/(^|\s)@\w*$/, `$1@${name} `));
  }

  return (
    <Autocomplete disableAutoFocusFirst filter={contains} inputValue={mentionQuery}>
      <TextField
        as="div"
        className="flex w-full max-w-xs flex-col gap-1.5"
        onChange={setMessage}
        value={message}
      >
        <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
          Message
        </Label>
        <TextArea
          className="min-h-28 w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
          placeholder="Type @ to mention someone"
        />
        {mention && (
          <ListBox
            aria-label="Mention suggestions"
            className="rounded border border-zinc-950/10 bg-white p-1 dark:border-white/10 dark:bg-zinc-900"
            onChange={insertMention}
          >
            {teammates.map((teammate) => (
              <ListBoxItem
                key={teammate}
                className="cursor-pointer rounded px-3 py-2.5 text-base text-zinc-800 data-active:bg-teal-100 data-active:text-teal-950 data-selected:bg-teal-100 data-selected:text-teal-950 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-active:bg-teal-950 dark:data-active:text-teal-50 dark:data-selected:bg-teal-950 dark:data-selected:text-teal-50"
                value={teammate}
              >
                @{teammate}
              </ListBoxItem>
            ))}
          </ListBox>
        )}
      </TextField>
    </Autocomplete>
  );
}
