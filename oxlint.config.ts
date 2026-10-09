import { defineConfig } from "oxlint";

export default defineConfig({
  // Lint runs over the whole repo; list generated and tool-owned directories here.
  ignorePatterns: [
    "**/dist",
    "**/node_modules",
    "**/dist-types",
    "apps/docs/build",
    "apps/docs/.react-router",
    "apps/docs/.wrangler",
    ".agents",
    ".claude",
    ".playwright",
    ".playwright-browsers",
    ".todo",
    ".vitest",
    ".vitest-attachments",
    "**/__screenshots__",
  ],
  plugins: ["typescript", "react", "jsx-a11y"],
  jsPlugins: ["./scripts/oxlint-comp0.ts"],
  rules: {
    "comp0/compact-ternaries": "error",
    "comp0/inline-class-names": "error",
    "comp0/memo-needs-reason": "error",
    "comp0/no-synthetic-events": "error",
    "comp0/presence-data-attributes": "error",
    "no-nested-ternary": "error",
    "react/jsx-key": "error",
    "react/no-unstable-nested-components": "error",
    "typescript/consistent-type-definitions": ["error", "type"],
    "typescript/no-explicit-any": "warn",
  },
  settings: {
    "better-tailwindcss": {
      cwd: "./apps/docs",
      entryPoint: "./src/styles.css",
      selectors: [
        {
          kind: "callee",
          match: [{ type: "strings" }],
          name: "^(?:cx|cn)$",
        },
        {
          kind: "callee",
          match: [{ type: "objectKeys" }],
          name: "^(?:cx|cn)$",
        },
      ],
    },
  },
  overrides: [
    {
      files: ["packages/react/src/**/*.tsx"],
      rules: {
        "comp0/props-above-component": "error",
        // Parts render `const Part = partElement(as, "tag")` / `rootElement(as)`, which return
        // the caller's `as`, a tag string, or a module-level component — never a component
        // created during render. The rule cannot see through the call; nested component
        // definitions are still caught by react/no-unstable-nested-components.
        "react/static-components": "off",
      },
    },
    {
      files: ["packages/react/src/internal/**", "packages/react/src/**/*.test.tsx"],
      rules: {
        "comp0/props-above-component": "off",
      },
    },
    {
      files: [
        "packages/react/src/button/Button.tsx",
        "packages/react/src/combobox/ComboboxTrigger.tsx",
        "packages/react/src/context-menu/ContextMenu.tsx",
        "packages/react/src/dialog/Dialog.tsx",
        "packages/react/src/drawer/Drawer.tsx",
        "packages/react/src/grid-list/GridListItem.tsx",
        "packages/react/src/grid-list/useGridListGroupRegistry.ts",
        "packages/react/src/link/Link.tsx",
        "packages/react/src/menu/Menu.tsx",
        "packages/react/src/menu/MenuList.tsx",
        "packages/react/src/menu/MenuTrigger.tsx",
        "packages/react/src/password-field/PasswordFieldToggle.tsx",
        "packages/react/src/popover/Popover.tsx",
        "packages/react/src/preview/Preview.tsx",
        "packages/react/src/select/SelectPopover.tsx",
        "packages/react/src/table/Table.tsx",
        "packages/react/src/resizer/Resizer.tsx",
        "packages/react/src/tag-group/TagList.tsx",
        "packages/react/src/tag-picker/TagPicker.tsx",
        "packages/react/src/tooltip/Tooltip.tsx",
        "packages/react/src/internal/overlay/surface.ts",
      ],
      rules: {
        // Refs are passed to ref composition and context providers, not dereferenced during render; the compiler cannot follow those boundaries.
        "react/refs": "off",
      },
    },
    {
      files: [
        "apps/docs/src/components/shell/CommandPalette.tsx",
        "apps/docs/src/examples/cases/messages.streaming.tsx",
        "apps/docs/src/examples/cases/steps.generated-surface.tsx",
        "apps/docs/src/examples/cases/tree.activity.tsx",
        "packages/core/src/utils.test.tsx",
        "packages/react/src/autocomplete/Autocomplete.tsx",
        "packages/react/src/calendar/Calendar.tsx",
        "packages/react/src/grid-list/useGridListMoveTransaction.ts",
        "packages/react/src/grid-list/useGridListRows.ts",
        "packages/react/src/inventory/Inventory.tsx",
        "packages/react/src/list-box/ListBox.tsx",
        "packages/react/src/password-field/PasswordField.tsx",
        "packages/react/src/range-calendar/RangeCalendar.tsx",
        "packages/react/src/tag-picker/TagPicker.tsx",
        "packages/react/src/tour/Tour.tsx",
        "packages/react/src/tree/Tree.tsx",
        "packages/react/src/tree-grid/TreeGrid.tsx",
        "packages/react/src/chart/ChartTooltip.tsx",
        "packages/react/src/grid-list/gridlist.composition.test.tsx",
      ],
      rules: {
        // These effects reconcile committed DOM registrations, focus, hydration, or externally controlled state; they bail out when synchronized.
        "react/set-state-in-effect": "off",
      },
    },

    {
      files: [
        "packages/react/src/list-box/ListBox.tsx",
        "packages/react/src/list-box/ListBoxOption.tsx",
        "packages/react/src/select/SelectOption.tsx",
        "packages/react/src/combobox/ComboboxOption.tsx",
        "packages/react/src/grid-list/grid-list-shared.tsx",
        "packages/react/src/grid-list/GridListItem.tsx",
        "packages/react/src/resizer/Resizer.tsx",
        "packages/react/src/tag-group/Tag.tsx",
        "packages/react/src/tree-grid/TreeGridCell.tsx",
        "packages/react/src/tree-grid/TreeGridColumn.tsx",
        "packages/react/src/tree-grid/TreeGridRow.tsx",
        "packages/react/src/tree-grid/TreeGridRowGroup.tsx",
      ],
      rules: {
        // These are custom APG composites; native select/option, table row/cell,
        // and hr elements cannot provide their children-driven content, roving
        // focus, or resize behavior.
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      files: [
        "packages/react/src/meter/Meter.tsx",
        "packages/react/src/progress-bar/ProgressBar.tsx",
      ],
      rules: {
        // The native elements do not allow consumers to render and style their
        // own track and fill, so these components apply the equivalent roles.
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      files: [
        "packages/react/src/range-slider/RangeSlider.tsx",
        "packages/react/src/range-slider/RangeSliderThumb.tsx",
        "packages/react/src/pin-input/PinInput.tsx",
      ],
      rules: {
        // A single native range input cannot host two interlocked thumbs, and
        // fieldset styling quirks make a plain group div the right container
        // for slider thumbs and pin fields.
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      files: [
        "packages/react/src/list-box/ListBox.tsx",
        "packages/react/src/tabs/TabList.tsx",
        "packages/react/src/toolbar/Toolbar.tsx",
      ],
      rules: {
        // Focus is roved among owned options/tabs/rows, not placed on the
        // collection container.
        "jsx-a11y/interactive-supports-focus": "off",
      },
    },
    {
      files: ["packages/react/src/tree/TreeGroup.tsx"],
      rules: {
        // A tree's child-item container is a custom APG composite part; the
        // suggested fieldset/details cannot host nested treeitems.
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      files: ["packages/react/src/tree/Tree.tsx"],
      rules: {
        // Focus is roved among the owned treeitems, not placed on the tree
        // container.
        "jsx-a11y/interactive-supports-focus": "off",
      },
    },
    {
      files: ["packages/react/src/tree-grid/TreeGrid.tsx"],
      rules: {
        // A native table supplies the structure while treegrid supplies
        // composite focus and hierarchy.
        "jsx-a11y/no-noninteractive-element-to-interactive-role": "off",
        // Registrations are ref-backed and may change on any commit; the
        // effect bails out when hierarchy and roving focus are unchanged.
        "react-hooks/exhaustive-deps": "off",
      },
    },
    {
      files: ["packages/react/src/grid-list/useGridListMoveTransaction.ts"],
      rules: {
        // The effects judge the controlled order against a pending move once per
        // commit; re-running them on unrelated renders would cancel a move that
        // is still waiting on its owner.
        "react-hooks/exhaustive-deps": "off",
      },
    },
    {
      files: ["packages/react/src/tree-grid/TreeGridCell.tsx"],
      rules: {
        // Cells need an explicit role inside a table promoted to treegrid.
        "jsx-a11y/no-redundant-roles": "off",
      },
    },
    {
      files: ["packages/react/src/tree-grid/TreeGridRow.tsx"],
      rules: {
        // Rows need explicit treegrid semantics and a roving tab stop.
        "jsx-a11y/no-interactive-element-to-noninteractive-role": "off",
        "jsx-a11y/no-redundant-roles": "off",
      },
    },
    {
      files: ["packages/react/src/tree/Tree.tsx", "packages/react/src/tree/tree-shared.tsx"],
      rules: {
        // These effects intentionally run after every commit: registered items
        // are sorted into DOM order and the roving tab stop is validated
        // against visibility; both bail out by returning the current state
        // when nothing changed, so they cannot loop.
        "react-hooks/exhaustive-deps": "off",
      },
    },
    {
      files: [
        "packages/react/src/combobox/ComboboxOption.tsx",
        "packages/react/src/list-box/ListBoxOption.tsx",
        "packages/react/src/menu/MenuItem.tsx",
      ],
      rules: {
        // Virtual collection focus stays in the input; options are addressed with aria-activedescendant.
        "jsx-a11y/click-events-have-key-events": "off",
        "jsx-a11y/interactive-supports-focus": "off",
        // Labels are re-crawled from rendered children every render on purpose;
        // state and registration bail out when the crawled text is unchanged.
        "react-hooks/exhaustive-deps": "off",
      },
    },
    {
      files: ["packages/react/src/menu/MenuPopover.tsx"],
      rules: {
        // The role-less floating surface owns dismissal keyboard and blur interactions.
        "jsx-a11y/no-static-element-interactions": "off",
      },
    },
    {
      files: ["packages/react/src/menu/MenuList.tsx"],
      rules: {
        // Focus is roved among the owned menuitems, not placed on the menu container.
        "jsx-a11y/interactive-supports-focus": "off",
      },
    },
    {
      files: [
        "packages/react/src/combobox/ComboboxOptGroup.tsx",
        "packages/react/src/select/SelectOptGroup.tsx",
      ],
      rules: {
        // Native optgroup is only valid inside select; custom listboxes use an ARIA group.
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      files: ["packages/react/src/table/Table.tsx", "packages/react/src/calendar/CalendarGrid.tsx"],
      rules: {
        // Promoting a native table to role=grid is the point of the component.
        "jsx-a11y/no-noninteractive-element-to-interactive-role": "off",
      },
    },
    {
      files: [
        "packages/react/src/carousel/Carousel.tsx",
        "packages/react/src/carousel/CarouselSlide.tsx",
      ],
      rules: {
        // The APG carousel pattern names the root and each slide with
        // role="group" plus an aria-roledescription; the suggested
        // fieldset/details elements carry the wrong semantics.
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      files: ["packages/react/src/carousel/Carousel.tsx"],
      rules: {
        // WCAG 2.2.2 pause-on-hover/focus bookkeeping listens on the carousel
        // root; the handlers only pause auto-rotation and trigger no action,
        // so the root stays non-interactive.
        "jsx-a11y/no-noninteractive-element-interactions": "off",
      },
    },
    {
      files: ["packages/react/src/feed/Feed.tsx"],
      rules: {
        // The APG feed pattern handles PageDown/PageUp and Ctrl+Home/End on
        // the feed container while focus stays on the articles inside it.
        "jsx-a11y/no-noninteractive-element-interactions": "off",
      },
    },
    {
      files: ["packages/react/src/split-button/SplitButton.tsx"],
      rules: {
        // A split button groups its two segments with role="group" and roves
        // focus between them from the container; the suggested fieldset/details
        // carry the wrong semantics, and the arrow-key handler only moves the
        // roving tab stop, so the group stays non-interactive.
        "jsx-a11y/prefer-tag-over-role": "off",
        "jsx-a11y/no-noninteractive-element-interactions": "off",
      },
    },
    {
      files: [
        "apps/docs/src/components/shell/DocsNavigation.tsx",
        "apps/docs/src/components/teaching/Anatomy.tsx",
        "apps/docs/src/components/teaching/StepList.tsx",
        "apps/docs/src/routes/_index/ComponentDirectory.tsx",
        "apps/docs/src/routes/_index/LearningPath.tsx",
        "apps/docs/src/routes/components-index/route.tsx",
        "apps/docs/src/routes/components/ComponentOutline.tsx",
        "apps/docs/src/routes/components/route.tsx",
        "apps/docs/src/routes/learn/route.tsx",
      ],
      rules: {
        // Tailwind's reset removes list markers; the explicit role preserves
        // list semantics in browsers that otherwise drop them.
        "jsx-a11y/no-redundant-roles": "off",
      },
    },
    {
      files: [
        "apps/docs/src/components/teaching/CodeBlock.tsx",
        "apps/docs/src/components/teaching/IntelligentUiDemo.tsx",
      ],
      rules: {
        // Overflowing code is keyboard-scrollable, so the pre needs a tab stop.
        "jsx-a11y/no-noninteractive-tabindex": "off",
      },
    },
    {
      files: ["apps/docs/src/examples/cases/autocomplete.menu.tsx"],
      rules: {
        // The popover combines a search editor and menu into an APG dialog;
        // native dialog cannot provide the popover behavior.
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      files: [
        "packages/react/src/autocomplete/autocomplete.composition.test.tsx",
        "packages/react/src/interactions.browser.test.tsx",
        "packages/react/src/toolbar/toolbar.composition.test.tsx",
      ],
      rules: {
        // These fixtures intentionally model composite ARIA roles that the
        // components must recognize without imposing native element behavior.
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      files: ["apps/docs/src/routes/_index/HomeHero.tsx"],
      rules: {
        // The labelled DOM wireframe is exposed as one illustration.
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      files: ["apps/docs/src/**/*.ts", "apps/docs/src/**/*.tsx"],
      jsPlugins: ["eslint-plugin-better-tailwindcss"],
      rules: {
        "better-tailwindcss/enforce-consistent-line-wrapping": [
          "error",
          {
            classesPerLine: 0,
            group: "newLine",
            indent: 2,
            lineBreakStyle: "unix",
            preferSingleLine: false,
            printWidth: 80,
            strictness: "loose",
          },
        ],
        "better-tailwindcss/no-duplicate-classes": "error",
        "better-tailwindcss/no-unnecessary-whitespace": ["error", { allowMultiline: true }],
      },
    },
  ],
});
