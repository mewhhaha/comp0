import { useState } from "react";
// TODO(integration): fold into the "@comp0/react" import once index.ts exports ./tree.js.
import { Tree, TreeGroup, TreeItem } from "../../../../../packages/react/src/tree.js";

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
  let glyph = "📄";
  if (node.children) {
    glyph = "📁";
    if (expanded.includes(node.name)) glyph = "📂";
  }

  return (
    <TreeItem value={node.name} textValue={node.name} className="grid gap-0.5 outline-none">
      <span className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-base text-zinc-800 sm:py-1 sm:text-sm dark:text-zinc-100 [[data-selected]>&]:bg-teal-100 [[data-selected]>&]:text-teal-950 dark:[[data-selected]>&]:bg-teal-950 dark:[[data-selected]>&]:text-teal-50 [[role=treeitem]:focus-visible>&]:outline-2 [[role=treeitem]:focus-visible>&]:outline-teal-600 dark:[[role=treeitem]:focus-visible>&]:outline-teal-400">
        <span aria-hidden="true">{glyph}</span>
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
