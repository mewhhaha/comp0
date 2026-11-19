import { composition, builtInVocabulary, fromJsonSchema, state } from "@comp0/genui/vocabulary";

const editState = state({ seats: fromJsonSchema<number>({ type: "number" }) }, { seats: 2 });
export const editUI = composition({ vocabulary: builtInVocabulary, state: editState });
