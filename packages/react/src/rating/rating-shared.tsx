import { createRequiredContext } from "../internal/context.js";

export type RatingContextValue = {
  name: string;
  /** The committed rating; 0 means nothing is selected. */
  value: number;
  /** Transient pointer preview; null while no item is hovered. */
  highlight: number | null;
  disabled: boolean;
  required: boolean;
  readOnly: boolean;
  setValue: (value: number) => void;
  setHighlight: (value: number | null) => void;
};

export const [RatingContext, useRatingContext] =
  createRequiredContext<RatingContextValue>("Rating");
