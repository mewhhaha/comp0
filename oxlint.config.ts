import { defineConfig } from "oxlint";

export default defineConfig({
  ignorePatterns: ["dist", "node_modules", "apps/docs/build"],
  plugins: ["typescript", "react", "jsx-a11y"],
  rules: {
    "react/jsx-key": "error",
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
      files: [
        "packages/react/src/components/ListBox.tsx",
        "packages/react/src/components/ListBoxItem.tsx",
        "packages/react/src/components/SelectOption.tsx",
        "packages/react/src/components/ComboboxOption.tsx",
        "packages/react/src/components/GridListItem.tsx",
        "packages/react/src/components/Tag.tsx",
        "packages/react/src/components/Resizer.tsx",
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
        "packages/react/src/components/Meter.tsx",
        "packages/react/src/components/ProgressBar.tsx",
      ],
      rules: {
        // The native elements do not allow consumers to render and style their
        // own track and fill, so these components apply the equivalent roles.
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      files: [
        "packages/react/src/components/RangeSlider.tsx",
        "packages/react/src/components/RangeSliderThumb.tsx",
        "packages/react/src/components/PinInput.tsx",
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
        "packages/react/src/components/ListBox.tsx",
        "packages/react/src/components/TabList.tsx",
        "packages/react/src/components/GridList.tsx",
        "packages/react/src/components/TagList.tsx",
        "packages/react/src/components/Toolbar.tsx",
      ],
      rules: {
        // Focus is roved among owned options/tabs/rows, not placed on the
        // collection container.
        "jsx-a11y/interactive-supports-focus": "off",
      },
    },
    {
      files: ["packages/react/src/components/TreeGroup.tsx"],
      rules: {
        // A tree's child-item container is a custom APG composite part; the
        // suggested fieldset/details cannot host nested treeitems.
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      files: ["packages/react/src/components/Tree.tsx"],
      rules: {
        // Focus is roved among the owned treeitems, not placed on the tree
        // container.
        "jsx-a11y/interactive-supports-focus": "off",
      },
    },
    {
      files: ["packages/react/src/components/TreeGrid.tsx"],
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
      files: ["packages/react/src/components/TreeGridCell.tsx"],
      rules: {
        // Cells need an explicit role inside a table promoted to treegrid.
        "jsx-a11y/no-redundant-roles": "off",
      },
    },
    {
      files: ["packages/react/src/components/TreeGridRow.tsx"],
      rules: {
        // Rows need explicit treegrid semantics and a roving tab stop.
        "jsx-a11y/no-interactive-element-to-noninteractive-role": "off",
        "jsx-a11y/no-redundant-roles": "off",
      },
    },
    {
      files: [
        "packages/react/src/components/Tree.tsx",
        "packages/react/src/components/tree-shared.tsx",
      ],
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
        "packages/react/src/components/ComboboxOption.tsx",
        "packages/react/src/components/ListBoxItem.tsx",
        "packages/react/src/components/MenuItem.tsx",
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
      files: [
        "packages/react/src/components/GridListItem.tsx",
        "packages/react/src/components/Tag.tsx",
      ],
      rules: {
        // Rows receive roving focus and keyboard handling from their grid container.
        "jsx-a11y/click-events-have-key-events": "off",
      },
    },
    {
      files: ["packages/react/src/components/MenuPopover.tsx"],
      rules: {
        // The role-less floating surface owns dismissal keyboard and blur interactions.
        "jsx-a11y/no-static-element-interactions": "off",
      },
    },
    {
      files: ["packages/react/src/components/MenuList.tsx"],
      rules: {
        // Focus is roved among the owned menuitems, not placed on the menu container.
        "jsx-a11y/interactive-supports-focus": "off",
      },
    },
    {
      files: [
        "packages/react/src/components/ComboboxOptGroup.tsx",
        "packages/react/src/components/SelectOptGroup.tsx",
      ],
      rules: {
        // Native optgroup is only valid inside select; custom listboxes use an ARIA group.
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      files: [
        "packages/react/src/components/Table.tsx",
        "packages/react/src/components/CalendarGrid.tsx",
      ],
      rules: {
        // Promoting a native table to role=grid is the point of the component.
        "jsx-a11y/no-noninteractive-element-to-interactive-role": "off",
      },
    },
    {
      files: ["packages/react/src/components/Resizer.tsx"],
      rules: {
        // An APG window splitter is an interactive separator by definition.
        "jsx-a11y/no-noninteractive-element-interactions": "off",
      },
    },
    {
      files: [
        "packages/react/src/components/Carousel.tsx",
        "packages/react/src/components/CarouselSlide.tsx",
      ],
      rules: {
        // The APG carousel pattern names the root and each slide with
        // role="group" plus an aria-roledescription; the suggested
        // fieldset/details elements carry the wrong semantics.
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      files: ["packages/react/src/components/Carousel.tsx"],
      rules: {
        // WCAG 2.2.2 pause-on-hover/focus bookkeeping listens on the carousel
        // root; the handlers only pause auto-rotation and trigger no action,
        // so the root stays non-interactive.
        "jsx-a11y/no-noninteractive-element-interactions": "off",
      },
    },
    {
      files: ["packages/react/src/components/Feed.tsx"],
      rules: {
        // The APG feed pattern handles PageDown/PageUp and Ctrl+Home/End on
        // the feed container while focus stays on the articles inside it.
        "jsx-a11y/no-noninteractive-element-interactions": "off",
      },
    },
    {
      files: ["packages/react/src/components/SplitButton.tsx"],
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
      files: ["apps/docs/src/components/teaching/CodeBlock.tsx"],
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
        "packages/react/src/autocomplete.composition.test.tsx",
        "packages/react/src/interactions.browser.test.tsx",
        "packages/react/src/toolbar.composition.test.tsx",
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
