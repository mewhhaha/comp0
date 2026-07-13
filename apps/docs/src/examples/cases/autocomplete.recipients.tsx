import { useState } from "react";
import {
  Autocomplete,
  Label,
  ListBox,
  ListBoxItem,
  SearchField,
  SearchFieldInput,
} from "@comp0/react";

const contacts = [
  { email: "aisha@example.com", name: "Aisha Rahman" },
  { email: "diego@example.com", name: "Diego Santos" },
  { email: "mina@example.com", name: "Mina Park" },
];

function contains(textValue: string, inputValue: string) {
  return textValue.toLocaleLowerCase().includes(inputValue.trim().toLocaleLowerCase());
}

export function Example() {
  const [query, setQuery] = useState("");
  const [recipients, setRecipients] = useState<string[]>(["mina@example.com"]);

  function addRecipient(email: string) {
    setRecipients((current) => (current.includes(email) ? current : [...current, email]));
    setQuery("");
  }

  return (
    <Autocomplete filter={contains} inputValue={query} onInputChange={setQuery}>
      <SearchField as="div" className="flex w-full max-w-xs flex-col gap-1.5">
        <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
          Recipients
        </Label>
        <div className="flex flex-wrap gap-1 rounded border border-zinc-950/10 bg-white p-1.5 dark:border-white/10 dark:bg-zinc-900">
          {recipients.map((recipient) => (
            <span
              key={recipient}
              className="rounded bg-teal-100 px-2 py-1 text-sm text-teal-950 dark:bg-teal-950 dark:text-teal-50"
            >
              {contacts.find((contact) => contact.email === recipient)?.name}
            </span>
          ))}
          <SearchFieldInput
            aria-label="Add recipient"
            autoComplete="off"
            className="min-w-28 flex-1 bg-transparent px-1 py-1 text-base text-zinc-950 outline-none sm:text-sm dark:text-zinc-50"
            placeholder="Add a person"
          />
        </div>
        <ListBox
          aria-label="Matching contacts"
          className="rounded border border-zinc-950/10 bg-white p-1 dark:border-white/10 dark:bg-zinc-900"
          onChange={addRecipient}
        >
          {contacts.map((contact) => (
            <ListBoxItem
              key={contact.email}
              className="cursor-pointer rounded px-3 py-2.5 text-base text-zinc-800 data-active:bg-teal-100 data-active:text-teal-950 data-selected:bg-teal-100 data-selected:text-teal-950 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-active:bg-teal-950 dark:data-active:text-teal-50 dark:data-selected:bg-teal-950 dark:data-selected:text-teal-50"
              textValue={`${contact.name} ${contact.email}`}
              value={contact.email}
            >
              <span className="block">{contact.name}</span>
              <span className="block text-sm text-zinc-500 dark:text-zinc-400">
                {contact.email}
              </span>
            </ListBoxItem>
          ))}
        </ListBox>
      </SearchField>
    </Autocomplete>
  );
}
