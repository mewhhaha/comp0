"use client";

import { type CSSProperties } from "react";

const colours = { Vermilion: "#ed4c2e", Cobalt: "#4967db", Fern: "#76a158" };

type PrintProofProps = { ink: keyof typeof colours; offset: number };
export function PrintProof({ ink, offset }: PrintProofProps) {
  return (
    <figure className="m-0">
      <div
        aria-hidden="true"
        className="genui-artwork sleeve-proof"
        style={{ "--ink": colours[ink], "--shift": offset + "mm" } as CSSProperties}
      >
        <span className="sleeve-disc" />
        <span className="sleeve-disc sleeve-overprint" />
      </div>
      <figcaption className="mt-2 font-mono text-sm">
        Black + {ink} · {offset} mm offset
      </figcaption>
    </figure>
  );
}
