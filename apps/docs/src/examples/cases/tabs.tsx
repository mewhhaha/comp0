import { Tab, TabList, TabPanel, Tabs } from "@comp0/react";

export function Example() {
  return (
    <Tabs as="div" defaultValue="preview">
      <TabList className="flex max-w-full gap-1 overflow-x-auto border-b border-zinc-950/10 dark:border-white/10">
        <Tab
          className="shrink-0 px-3 py-2.5 text-base text-zinc-700 data-selected:border-b-2 data-selected:border-teal-600 data-selected:text-teal-800 sm:py-2 sm:text-sm dark:text-zinc-300 dark:data-selected:border-teal-400 dark:data-selected:text-teal-200"
          tab="preview"
        >
          Preview
        </Tab>
        <Tab
          className="shrink-0 px-3 py-2.5 text-base text-zinc-700 data-selected:border-b-2 data-selected:border-teal-600 data-selected:text-teal-800 sm:py-2 sm:text-sm dark:text-zinc-300 dark:data-selected:border-teal-400 dark:data-selected:text-teal-200"
          tab="code"
        >
          Code
        </Tab>
      </TabList>
      <TabPanel
        className="pt-3 text-base text-zinc-700 sm:text-sm dark:text-zinc-300"
        tab="preview"
      >
        A live component preview.
      </TabPanel>
      <TabPanel
        className="pt-3 font-mono text-base text-zinc-700 sm:text-sm dark:text-zinc-300"
        tab="code"
      >
        import {"{ Button }"} from "@comp0/react"
      </TabPanel>
    </Tabs>
  );
}
