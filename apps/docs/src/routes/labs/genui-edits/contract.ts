import { builtInVocabulary, fromJsonSchema, state } from "@comp0/genui/vocabulary";

export const editVocabulary = builtInVocabulary;
export const editState = state({ seats: fromJsonSchema<number>({ type: "number" }) }, { seats: 2 });
