# AGENTS.md

## Project Posture

This is a greenfield headless React component library. Prefer the cleanest native-feeling API over compatibility layers. Breaking changes are encouraged when they remove legacy aliases, clarify component contracts, or make the public API more DOM-native.

Do not preserve old prop names as compatibility aliases unless the user explicitly asks for backwards compatibility.

## React Compiler

Assume the React Compiler everywhere: the package build, the docs app, and both vitest projects run it. Do not hand-memoize with `useMemo`/`useCallback`; write plain objects and functions and let the compiler insert memoization. The one exception is a callback identity consumed by an effect dependency where a compiler bail-out would cause a state loop (see `useFieldFeedback`) — keep an explicit `useCallback` there with a comment.

## Component API and Styling

Prefer children-driven composition for components. Expose DOM-similar props and behavior wherever possible, and keep custom component contracts close to the native element or ARIA pattern they model.

Prefer data-driven styling hooks. For boolean data attributes, use presence semantics such as `value || undefined` instead of serializing `true` or `false`, so styles can target attribute existence.

Avoid nested ternaries. Avoid long ternaries, especially ternaries that span more than three lines. Ternaries should usually fit on one line; prefer `let` bindings and `if` statements when the condition or branches need more room.

Do not break class name expressions out into separate variables just to shorten JSX. Keep class names in the `className` statement.

Co-locate a component's props type immediately above the component. Name it after the component with a `Props` suffix, such as `TableProps`. Prefer `type` over `interface` for component props.
