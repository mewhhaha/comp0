import { useState } from "react";
import {
  Checkbox,
  Resizer,
  Select,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@comp0/react";

export function Example() {
  const people = [
    { id: "ada", name: "Ada Lovelace", role: "Engineer", city: "London" },
    { id: "grace", name: "Grace Hopper", role: "Admiral", city: "New York" },
    { id: "mary", name: "Mary Jackson", role: "Engineer", city: "Hampton" },
  ];
  const columns = ["name", "role", "city"] as const;
  const [sort, setSort] = useState<"ascending" | "descending">("ascending");
  const [selected, setSelected] = useState<string[]>(["ada"]);
  const [widths, setWidths] = useState<Record<(typeof columns)[number], number>>({
    name: 150,
    role: 110,
    city: 110,
  });
  const rows = [...people].sort((a, b) =>
    sort === "ascending" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
  );
  const toggle = (id: string, on: boolean) =>
    setSelected((current) => (on ? [...current, id] : current.filter((entry) => entry !== id)));
  const toggleSort = () =>
    setSort((current) => (current === "ascending" ? "descending" : "ascending"));

  return (
    <Table
      aria-label="People"
      aria-multiselectable="true"
      className="w-full max-w-md table-fixed border-collapse text-base sm:text-sm"
      onRangeSelect={setSelected}
    >
      <TableHeader>
        <TableRow>
          <TableColumn
            aria-label="Selection"
            className="w-10 border-b border-zinc-950/10 px-2 py-1.5 outline-teal-600 focus-visible:outline-2 dark:border-white/10 dark:outline-teal-400"
          />
          {columns.map((column) => (
            <TableColumn
              key={column}
              className="relative border-b border-zinc-950/10 px-2 py-1.5 text-left font-semibold text-zinc-950 capitalize outline-teal-600 focus-visible:outline-2 dark:border-white/10 dark:text-zinc-50 dark:outline-teal-400"
              style={{ width: widths[column] }}
              sort={column === "name" ? sort : undefined}
              onSort={column === "name" ? toggleSort : undefined}
              onResize={(width) => setWidths((current) => ({ ...current, [column]: width }))}
            >
              {column}
              {column === "name" && (sort === "ascending" ? " \u2191" : " \u2193")}
              <Resizer
                aria-label={`Resize ${column} column`}
                className="absolute inset-y-0 right-0 w-1 bg-zinc-950/10 outline-teal-600 focus-visible:outline-2 data-dragging:bg-teal-600 dark:bg-white/10 dark:outline-teal-400 dark:data-dragging:bg-teal-400"
                min={60}
                max={280}
                size={widths[column]}
              />
            </TableColumn>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((person) => (
          <TableRow
            key={person.id}
            value={person.id}
            selected={selected.includes(person.id)}
            className="data-selected:bg-teal-50 dark:data-selected:bg-teal-950/40"
          >
            <TableCell className="border-b border-zinc-950/5 px-2 py-1.5 outline-teal-600 focus-visible:outline-2 dark:border-white/5 dark:outline-teal-400">
              <Checkbox
                aria-label={`Select ${person.name}`}
                className="group"
                selected={selected.includes(person.id)}
                onChange={(on) => toggle(person.id, on)}
              >
                <span className="block size-4 rounded-sm border border-zinc-950/20 bg-white ring-2 ring-transparent group-data-focused:ring-teal-600 group-data-selected:border-teal-600 group-data-selected:bg-teal-600 dark:border-white/20 dark:bg-zinc-900 dark:group-data-focused:ring-teal-400" />
              </Checkbox>
            </TableCell>
            {[person.name, person.role, person.city].map((cell) => (
              <TableCell
                key={cell}
                className="truncate border-b border-zinc-950/5 px-2 py-1.5 text-zinc-700 outline-teal-600 focus-visible:outline-2 dark:border-white/5 dark:text-zinc-200 dark:outline-teal-400"
              >
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
