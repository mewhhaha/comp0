<!--
Keep the top of this description short and human-written: the fewest words that tell a
reviewer what this PR is for and why it is worth their time. Add a screenshot or a short
recording when the change is visible in the docs app.

Put the long write-up (often written by a coding agent) inside the <details> block below so
it stays one click away. Name whoever wrote it in the <summary>, for example
"Claude Opus 5.5 Medium" or your own name. Keep the blank lines around the Markdown inside
<details>, or GitHub renders it as plain text.
-->

One or two sentences: what this changes and why it matters.

<!-- Optional: screenshot, recording, or command output. -->

<details>
<summary>Full description (author or model name)</summary>

## What changed

-

## How it was verified

<!-- The checks you ran, e.g. `pnpm verify`, or the families you scoped with the verify skill. -->

- [ ] `pnpm verify` (or the subset that covers this change, listed below)
- [ ] `pnpm --filter @comp0/docs build && pnpm test:wcag` for component changes

## Accessibility (WCAG 2.2 AA)

<!--
For component changes: which success criteria this touches (see ACCESSIBILITY.md), keyboard
and focus behavior, screen reader output, and any change to `e2e/wcag-baseline/`. Write
"n/a" when nothing user-facing changed.
-->

</details>
