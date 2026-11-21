/**
 * What VoiceOver and NVDA say, as patterns. The readers word the same role and state
 * differently ("checkbox, unchecked" against "check box  not checked"), so each scenario names
 * the term it expects and each reader supplies its own pattern for it.
 */
export type Term = string | RegExp;

export type Phrases = {
  button: RegExp;
  /** A button that opens a listbox or menu (`aria-haspopup`). */
  popupButton: RegExp;
  comboBox: RegExp;
  /** An option in an open listbox: its role, selection, or position. */
  option: RegExp;
  checkbox: RegExp;
  checked: RegExp;
  unchecked: RegExp;
  tab: RegExp;
  selected: RegExp;
  /** A tree item: its role, level, or position. */
  treeItem: RegExp;
  expanded: RegExp;
  collapsed: RegExp;
  dialog: RegExp;
  /** NVDA leaves the item role unspoken inside a menu, so the menu itself counts. */
  menuItem: RegExp;
};

// "unchecked" never matches `\bchecked`; the lookbehind rules out NVDA's "not checked".
const checked = /(?<!\bnot )\bchecked\b/i;
const selected = /(?<!\bnot )\bselected\b/i;
const expanded = /\bexpanded\b/i;
const collapsed = /\bcollapsed\b/i;

export const voiceOverPhrases: Phrases = {
  button: /\bbutton\b/i,
  popupButton: /\bbutton\b|\bcombo box\b/i,
  comboBox: /\bcombo box\b/i,
  option: /\bselected\b|\b\d+ of \d+\b|\boption\b|\blist box\b/i,
  checkbox: /\bcheck ?box\b/i,
  checked,
  unchecked: /\bunchecked\b|\bnot checked\b/i,
  tab: /\btab\b/i,
  selected,
  treeItem: /\btree item\b|\boutline row\b|\blevel \d+\b|\b\d+ of \d+\b/i,
  expanded,
  collapsed,
  dialog: /\bdialog\b/i,
  menuItem: /\bmenu\b/i,
};

export const nvdaPhrases: Phrases = {
  button: /\bbutton\b/i,
  popupButton: /\bbutton\b|\bcombo box\b/i,
  comboBox: /\bcombo box\b/i,
  option: /\bselected\b|\b\d+ of \d+\b|\boption\b|\blist\b/i,
  checkbox: /\bcheck box\b/i,
  checked,
  unchecked: /\bnot checked\b/i,
  tab: /\btab\b/i,
  selected,
  treeItem: /\btree view item\b|\blevel \d+\b|\b\d+ of \d+\b/i,
  expanded,
  collapsed,
  dialog: /\bdialog\b/i,
  menuItem: /\bmenu\b/i,
};

// VoiceOver's usage hints ("You are currently on a button. To click this button, press
// Control-Option-Space.") name roles without the element's name, so they never count.
const usageHint =
  /\bYou are currently on\b|\bpress (?:Control|Command|Option|Shift|Caps Lock|VO)\b/i;

function contains(text: string, term: Term) {
  if (typeof term === "string") return text.toLowerCase().includes(term.toLowerCase());
  return term.test(text);
}

/**
 * Whether one utterance, or two consecutive ones, contains every term. Readers split one
 * announcement across utterances ("Size  Medium", then "button  collapsed"), so a pair counts;
 * anything further apart is a different announcement.
 */
export function heard(utterances: readonly string[], terms: readonly Term[]) {
  const spoken = utterances
    .filter((utterance) => !usageHint.test(utterance))
    .map((utterance) => utterance.trim())
    .filter(Boolean);
  const windows = [...spoken];
  for (let index = 0; index + 1 < spoken.length; index++) {
    windows.push(`${spoken[index]} ${spoken[index + 1]}`);
  }
  return windows.some((window) => terms.every((term) => contains(window, term)));
}
