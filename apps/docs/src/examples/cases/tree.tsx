import { useState } from "react";
import { Tree, TreeGroup, TreeItem } from "@comp0/react";
import { DocumentIcon, FolderIcon, FolderOpenIcon } from "@heroicons/react/16/solid";

type FileNode = {
  name: string;
  children?: FileNode[];
};

const files: FileNode[] = [
  {
    name: "src",
    children: [
      {
        name: "components",
        children: [{ name: "Button.tsx" }, { name: "Input.tsx" }],
      },
      { name: "index.ts" },
    ],
  },
  { name: "README.md" },
];

function FileItem({ node, expanded }: { node: FileNode; expanded: string[] }) {
  let Glyph = DocumentIcon;
  if (node.children) {
    Glyph = FolderIcon;
    if (expanded.includes(node.name)) Glyph = FolderOpenIcon;
  }

  return (
    <TreeItem value={node.name} textValue={node.name} className="grid gap-0.5 outline-none">
      <span className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-base text-zinc-800 sm:py-1 sm:text-sm dark:text-zinc-100 [[data-selected]>&]:bg-teal-100 [[data-selected]>&]:text-teal-950 dark:[[data-selected]>&]:bg-teal-950 dark:[[data-selected]>&]:text-teal-50 [[role=treeitem]:focus-visible>&]:outline-2 [[role=treeitem]:focus-visible>&]:outline-teal-600 dark:[[role=treeitem]:focus-visible>&]:outline-teal-400">
        <Glyph className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />
        {node.name}
      </span>
      {node.children && (
        <TreeGroup className="grid gap-0.5 pl-5">
          {node.children.map((child) => (
            <FileItem key={child.name} node={child} expanded={expanded} />
          ))}
        </TreeGroup>
      )}
    </TreeItem>
  );
}

export function Example() {
  const [selected, setSelected] = useState("README.md");
  const [expanded, setExpanded] = useState(["src"]);

  return (
    <div className="flex max-w-xs flex-col gap-2">
      <Tree
        aria-label="Project files"
        className="grid gap-0.5 rounded border border-zinc-950/10 p-1 dark:border-white/10"
        value={selected}
        onChange={setSelected}
        expanded={expanded}
        onExpandedChange={setExpanded}
      >
        {files.map((node) => (
          <FileItem key={node.name} node={node} expanded={expanded} />
        ))}
      </Tree>
      <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">Selected: {selected}</p>
    </div>
  );
}
