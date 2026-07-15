import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationList,
  PaginationNext,
  PaginationPage,
  PaginationPrevious,
} from "@comp0/react";

export function Example() {
  return (
    <Pagination defaultPage={6} totalPages={20}>
      {({ pages }) => (
        <PaginationList className="flex items-center gap-1">
          <PaginationItem>
            <PaginationFirst className="rounded px-2.5 py-2 text-sm hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800">
              First
            </PaginationFirst>
          </PaginationItem>
          <PaginationItem>
            <PaginationPrevious className="rounded px-2.5 py-2 text-sm hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800">
              Previous
            </PaginationPrevious>
          </PaginationItem>
          {pages.map((entry) => (
            <PaginationItem key={entry}>
              {typeof entry === "number" ? (
                <PaginationPage
                  page={entry}
                  className="size-9 rounded text-sm hover:bg-zinc-100 data-current:bg-zinc-900 data-current:text-white dark:hover:bg-zinc-800 dark:data-current:bg-zinc-100 dark:data-current:text-zinc-950"
                >
                  {entry}
                </PaginationPage>
              ) : (
                <PaginationEllipsis className="grid size-9 place-items-center text-zinc-500" />
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext className="rounded px-2.5 py-2 text-sm hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800">
              Next
            </PaginationNext>
          </PaginationItem>
          <PaginationItem>
            <PaginationLast className="rounded px-2.5 py-2 text-sm hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800">
              Last
            </PaginationLast>
          </PaginationItem>
        </PaginationList>
      )}
    </Pagination>
  );
}
