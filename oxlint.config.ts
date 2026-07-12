import { defineConfig } from "oxlint";

export default defineConfig({
  ignorePatterns: ["dist", "node_modules", "apps/docs/dist"],
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
        "packages/react/src/components/TagGroup.tsx",
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
      files: ["packages/react/src/components/ComboboxOption.tsx"],
      rules: {
        // Combobox focus stays in the input; options are addressed with aria-activedescendant.
        "jsx-a11y/click-events-have-key-events": "off",
        "jsx-a11y/interactive-supports-focus": "off",
        // Labels are re-crawled from rendered children every render on purpose;
        // registration bails out when the crawled text is unchanged.
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
        // The role is customizable in props but defaults to menu at runtime.
        "jsx-a11y/no-static-element-interactions": "off",
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
      files: ["apps/docs/src/*.ts", "apps/docs/src/*.tsx"],
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
