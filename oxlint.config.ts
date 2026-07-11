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
      ],
      rules: {
        // These are custom APG composites; native select/option elements cannot provide their
        // children-driven content, roving focus, or active-descendant contracts.
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      files: [
        "packages/react/src/components/ListBox.tsx",
        "packages/react/src/components/TabList.tsx",
      ],
      rules: {
        // Focus is roved among owned options/tabs, not placed on the collection container.
        "jsx-a11y/interactive-supports-focus": "off",
      },
    },
    {
      files: ["packages/react/src/components/ComboboxOption.tsx"],
      rules: {
        // Combobox focus stays in the input; options are addressed with aria-activedescendant.
        "jsx-a11y/click-events-have-key-events": "off",
        "jsx-a11y/interactive-supports-focus": "off",
      },
    },
    {
      files: [
        "packages/react/src/components/MenuContent.tsx",
        "packages/react/src/components/SelectContent.tsx",
      ],
      rules: {
        // The role is customizable in props but defaults to listbox at runtime.
        "jsx-a11y/no-static-element-interactions": "off",
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
