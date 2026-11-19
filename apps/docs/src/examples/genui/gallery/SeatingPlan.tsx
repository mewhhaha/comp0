"use client";

type SeatingPlanProps = { rows: number; aisle: boolean };
export function SeatingPlan({ rows, aisle }: SeatingPlanProps) {
  return (
    <figure className="m-0">
      <div
        aria-hidden="true"
        className="mx-auto grid max-w-xs grid-cols-6 gap-2 rounded-lg bg-zinc-900 p-5"
      >
        <div className="col-span-full mb-2 border-t-4 border-teal-300 pt-1 text-center font-mono text-xs text-zinc-200">
          Stage
        </div>
        {Array.from({ length: rows * 6 }, (_, i) => {
          const open = aisle && (i % 6 === 2 || i % 6 === 3);
          return (
            <span
              key={i}
              className={
                open
                  ? "invisible"
                  : "aspect-square rounded-t-md border-b-4 border-amber-500 bg-amber-200"
              }
            />
          );
        })}
      </div>
      <figcaption className="mt-2 text-center text-sm">
        {rows} rows · {aisle ? "4 chairs and a centre aisle" : "6 chairs"} per row
      </figcaption>
    </figure>
  );
}
