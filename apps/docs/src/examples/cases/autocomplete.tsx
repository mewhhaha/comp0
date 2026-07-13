import {
  Autocomplete,
  Label,
  ListBox,
  ListBoxItem,
  SearchField,
  SearchFieldInput,
} from "@comp0/react";

const destinations = ["Lisbon", "Reykjavík", "Singapore", "Tokyo", "Warsaw"];

function contains(textValue: string, inputValue: string) {
  return textValue.toLocaleLowerCase().includes(inputValue.trim().toLocaleLowerCase());
}

export function Example() {
  return (
    <Autocomplete filter={contains}>
      <SearchField as="div" className="flex w-full max-w-xs flex-col gap-1.5">
        <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
          Destination
        </Label>
        <SearchFieldInput
          autoComplete="off"
          className="w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
          name="destination"
          placeholder="Search cities"
        />
        <ListBox
          aria-label="Destinations"
          className="max-h-60 overflow-y-auto rounded border border-zinc-950/10 bg-white p-1 dark:border-white/10 dark:bg-zinc-900"
        >
          {destinations.map((destination) => (
            <ListBoxItem
              key={destination}
              className="cursor-pointer rounded px-3 py-2.5 text-base text-zinc-800 data-active:bg-teal-100 data-active:text-teal-950 data-selected:bg-teal-100 data-selected:text-teal-950 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-active:bg-teal-950 dark:data-active:text-teal-50 dark:data-selected:bg-teal-950 dark:data-selected:text-teal-50"
              value={destination.toLocaleLowerCase()}
            >
              {destination}
            </ListBoxItem>
          ))}
        </ListBox>
      </SearchField>
    </Autocomplete>
  );
}
