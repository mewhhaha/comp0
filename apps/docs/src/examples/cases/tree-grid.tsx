import { useState } from "react";
import {
  TreeGrid,
  TreeGridCell,
  TreeGridColumn,
  TreeGridRow,
  TreeGridRowGroup,
} from "@comp0/react";

type ProjectFile = {
  value: string;
  parentValue?: string;
  name: string;
  kind: "Folder" | "File";
  status: string;
  level: number;
};

const projectFiles: ProjectFile[] = [
  { value: "src", name: "src", kind: "Folder", status: "8 files", level: 0 },
  {
    value: "components",
    parentValue: "src",
    name: "components",
    kind: "Folder",
    status: "4 files",
    level: 1,
  },
  {
    value: "tree-grid",
    parentValue: "components",
    name: "TreeGrid.tsx",
    kind: "File",
    status: "Modified",
    level: 2,
  },
  {
    value: "tree-grid-row",
    parentValue: "components",
    name: "TreeGridRow.tsx",
    kind: "File",
    status: "Modified",
    level: 2,
  },
  {
    value: "index",
    parentValue: "src",
    name: "index.ts",
    kind: "File",
    status: "Modified",
    level: 1,
  },
  { value: "readme", name: "README.md", kind: "File", status: "Untracked", level: 0 },
];

export function Example() {
  const [selected, setSelected] = useState("tree-grid");
  const [expanded, setExpanded] = useState(["src", "components"]);

  return (
    <div className="flex max-w-xl flex-col gap-2">
      <TreeGrid
        aria-label="Project files"
        className="w-full border-collapse overflow-hidden rounded border border-zinc-950/10 text-left text-base sm:text-sm dark:border-white/10"
        value={selected}
        onChange={setSelected}
        expanded={expanded}
        onExpandedChange={setExpanded}
      >
        <TreeGridRowGroup as="thead" className="bg-zinc-50 dark:bg-zinc-900/50">
          <TreeGridRow>
            <TreeGridColumn className="border-b border-zinc-950/10 px-2 py-1.5 font-semibold dark:border-white/10">
              Name
            </TreeGridColumn>
            <TreeGridColumn className="border-b border-zinc-950/10 px-2 py-1.5 font-semibold dark:border-white/10">
              Type
            </TreeGridColumn>
            <TreeGridColumn className="border-b border-zinc-950/10 px-2 py-1.5 font-semibold dark:border-white/10">
              Status
            </TreeGridColumn>
          </TreeGridRow>
        </TreeGridRowGroup>
        <TreeGridRowGroup>
          {projectFiles.map((file) => {
            const isFolder = file.kind === "Folder";
            const isExpanded = expanded.includes(file.value);

            return (
              <TreeGridRow
                key={file.value}
                value={file.value}
                parentValue={file.parentValue}
                className="cursor-pointer border-b border-zinc-950/5 text-zinc-800 last:border-0 data-selected:bg-teal-50 dark:border-white/5 dark:text-zinc-100 dark:data-selected:bg-teal-950/40"
              >
                <TreeGridCell
                  className="outline-teal-600 focus-visible:outline-2 dark:outline-teal-400"
                  style={{ paddingInlineStart: `${8 + file.level * 20}px` }}
                >
                  <span className="flex items-center gap-1.5 px-2 py-1.5">
                    <span className="w-3 text-zinc-400 dark:text-zinc-500" aria-hidden="true">
                      {isFolder ? (isExpanded ? "▾" : "▸") : ""}
                    </span>
                    <span aria-hidden="true">{isFolder ? "📁" : "📄"}</span>
                    {file.name}
                  </span>
                </TreeGridCell>
                <TreeGridCell className="px-2 py-1.5 text-zinc-600 outline-teal-600 focus-visible:outline-2 dark:text-zinc-400 dark:outline-teal-400">
                  {file.kind}
                </TreeGridCell>
                <TreeGridCell className="px-2 py-1.5 text-zinc-600 outline-teal-600 focus-visible:outline-2 dark:text-zinc-400 dark:outline-teal-400">
                  {file.status}
                </TreeGridCell>
              </TreeGridRow>
            );
          })}
        </TreeGridRowGroup>
      </TreeGrid>
      <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">Selected: {selected}</p>
    </div>
  );
}
