import type { LearnDoc } from "./types.js";

export const learnDocs = [
  {
    slug: "installation",
    order: 1,
    title: "Installation",
    summary: "Add comp0 once, then take every public component from the same front door.",
    sections: [
      {
        id: "install",
        title: "Install the package",
        explanation:
          "Your app needs the React package before it can use its components. Run this in the app folder, not inside the component library. After that, your package manager records comp0 as something your app depends on.",
        code: "pnpm add @comp0/react",
        language: "bash",
        note: "Think of installation as putting a new box of building blocks in your toy cupboard.",
      },
      {
        id: "root-import",
        title: "Use one root-only import",
        explanation:
          "Every supported component comes from @comp0/react. This is the front door that stays stable while internal files may move around. Import the names you need, then use them like normal React components.",
        code: 'import { Button, TextField } from "@comp0/react";\n\n<Button>Save</Button>',
        language: "tsx",
      },
      {
        id: "first-component",
        title: "Start with one small component",
        explanation:
          "Pick one job, such as saving a form, and add the matching component. comp0 is headless, so it gives you behavior and HTML meaning but not a finished visual theme. Style it with Tailwind utility classes after the behavior makes sense — every example in these docs does the same.",
        code: '<Button className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800">\n  Save\n</Button>',
        language: "tsx",
      },
    ],
  },
  {
    slug: "composition",
    order: 2,
    title: "Composition",
    summary: "Put named pieces together so each piece has one easy-to-understand job.",
    sections: [
      {
        id: "provider-roots",
        title: "Some roots are invisible helpers",
        explanation:
          "A root such as Dialog or TextField can hold state and connect its children without adding an extra HTML box. By default, its children become the visible DOM. This keeps your HTML clean and lets each child own the element it really is.",
        code: '<TextField>\n  <Label>Email</Label>\n  <Input name="email" />\n</TextField>',
        language: "tsx",
        note: "Imagine the root as a backpack: it carries shared information, but it is not another piece of furniture in the room.",
      },
      {
        id: "fragment-and-as",
        title: "Add a wrapper only when you need one",
        explanation:
          "The default children behave like a React Fragment, so no wrapper is rendered. If layout or semantics need a real element, pass as with the element you want. Do not add a wrapper just because a component has a root name.",
        code: '<Dialog as="section" aria-label="Account settings">\n  {children}\n</Dialog>',
        language: "tsx",
      },
      {
        id: "named-parts",
        title: "Keep named parts in their jobs",
        explanation:
          "Triggers open things, content holds what appears, and items are the choices inside a collection. Put each part where its parent pattern expects it. This gives comp0 enough information to connect IDs, focus, and keyboard behavior for you.",
        code: "<Popover>\n  <PopoverTrigger>More</PopoverTrigger>\n  <PopoverOverlay>Extra choices</PopoverOverlay>\n</Popover>",
        language: "tsx",
      },
    ],
  },
  {
    slug: "styling",
    order: 3,
    title: "Styling",
    summary:
      "Style every part with Tailwind utility classes and let state attributes drive what changes.",
    sections: [
      {
        id: "tailwind-utilities",
        title: "Style the element that exists",
        explanation:
          "Headless means comp0 does not choose your colors, spacing, or borders. Pass className with Tailwind utilities to the part that actually renders an element, exactly as you would style native HTML. Plain CSS works too, but every example in these docs uses Tailwind so you can copy classes straight into your app.",
        code: '<SelectTrigger className="w-full rounded-lg border border-zinc-950/10 bg-white px-3 py-2 text-sm">\n  <SelectValue />\n</SelectTrigger>',
        language: "tsx",
        note: "Do not search for a hidden comp0 theme. Your classes are intentionally in charge.",
      },
      {
        id: "presence-state",
        title: "Style state with data variants",
        explanation:
          'Components add attributes such as data-open only while that state is true. When a popover closes, data-open is removed instead of becoming data-open="false". Tailwind\'s data variants match exactly that presence, so data-open: and data-selected: utilities switch on and off with the state.',
        code: '<MenuTrigger className="rounded-lg px-3 py-2 text-sm data-open:bg-zinc-100">\n  Actions\n</MenuTrigger>\n\n<SelectOption className="px-3 py-2 text-sm data-selected:bg-teal-100 data-selected:font-medium" value="small">\n  Small\n</SelectOption>',
        language: "tsx",
      },
      {
        id: "focus",
        title: "Show focus clearly",
        explanation:
          "Keyboard users need to see where they are before they press a key. Keep a strong focus-visible: outline or replace it with an equally obvious style. Also style disabled and invalid states, with data-disabled: and data-invalid:, so a control does not silently change meaning.",
        code: '<Button className="rounded-lg bg-teal-700 px-3 py-2 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 data-disabled:opacity-50">\n  Save\n</Button>',
        language: "tsx",
      },
    ],
  },
  {
    slug: "forms-and-state",
    order: 4,
    title: "Forms and state",
    summary:
      "Let native controls send values, and decide who remembers a component’s current state.",
    sections: [
      {
        id: "names",
        title: "Name values that a form should send",
        explanation:
          "A form only sends a control when it has a name. Put name on native inputs, checkboxes, and form-enabled picker roots. For example, Select uses its name to create a visually hidden native select proxy for submission.",
        code: '<form>\n  <Input name="email" type="email" />\n  <Select name="size" defaultValue="small">\n    <Label>Size</Label>\n    <SelectTrigger><SelectValue /></SelectTrigger>\n    <SelectPopover>...</SelectPopover>\n  </Select>\n</form>',
        language: "tsx",
        note: "A label tells a person what a control means; a name tells the browser what key to send.",
      },
      {
        id: "submit-on-enter",
        title: "Add a value by pressing Enter",
        explanation:
          'An input beside a submit button is just a form. A text input and a Button with type="submit" share one form, so pressing Enter in the field and pressing the button both fire the form\'s onSubmit — you never write a key handler for it. Give the Input a name, read that value from the submit event, then reset the form for the next entry. This is the whole “add item” field, composed from pieces you already have.',
        code: '<form\n  onSubmit={(event) => {\n    event.preventDefault();\n    const form = event.currentTarget;\n    onAdd(String(new FormData(form).get("item")));\n    form.reset();\n  }}\n>\n  <TextField>\n    <Label>New item</Label>\n    <Input name="item" placeholder="Add an item" />\n  </TextField>\n  <Button type="submit">Add</Button>\n</form>',
        language: "tsx",
        note: "The platform does the work: Enter in a text input submits its form, and comp0's Button submits when its type is submit. SearchField is this same shape, specialized for search with an onSubmit value and a clear button.",
      },
      {
        id: "controlled",
        title: "Control state when your app needs to know now",
        explanation:
          "Use value with onChange when your app owns a selected value. Use open with onToggle when your app owns whether an overlay is open. The component asks for a change, and your state gives it the new value back.",
        code: "const [open, setOpen] = useState(false);\n\n<Dialog open={open} onToggle={setOpen}>...</Dialog>",
        language: "tsx",
      },
      {
        id: "defaults",
        title: "Use a default for a starting value",
        explanation:
          "Use defaultValue, defaultSelected, or defaultOpen when the component may remember its own state after the first render. This is simpler for a small form that does not need live app state. Do not pass both a controlled value and expect a default to keep changing it later.",
        code: '<Checkbox defaultSelected>Send me updates</Checkbox>\n<Accordion defaultValue="shipping">...</Accordion>',
        language: "tsx",
      },
    ],
  },
  {
    slug: "keyboard-and-accessibility",
    order: 5,
    title: "Keyboard and accessibility",
    summary: "Make every control understandable without a mouse or a pair of eyes.",
    sections: [
      {
        id: "names",
        title: "Give controls a name",
        explanation:
          "Visible text is usually the best name because everyone can see it. Use Label with fields, and use aria-label for an icon-only button or an unnamed list. A screen reader should be able to say what the focused thing does.",
        code: '<TextField>\n  <Label>Email</Label>\n  <Input name="email" />\n</TextField>\n\n<Button aria-label="Close">×</Button>',
        language: "tsx",
        note: "A tooltip is extra help, not a replacement for a button or input name.",
      },
      {
        id: "expected-keys",
        title: "Keep familiar key symbols",
        explanation:
          "Enter and Space activate buttons. Arrow keys move through menus, list boxes, radio groups, and tabs; Escape closes overlays. Let the component handle these familiar keys instead of giving them surprising new jobs.",
        code: '<Menu>\n  <MenuTrigger>Actions</MenuTrigger>\n  <MenuPopover aria-label="Actions">...</MenuPopover>\n</Menu>',
        language: "tsx",
      },
      {
        id: "focus-and-feedback",
        title: "Protect focus and explain errors",
        explanation:
          "When a dialog closes, focus should return to the trigger that opened it. Keep a visible focus ring so people can follow that movement. Put Description and FieldError next to a field so help and validation feedback are connected to the input.",
        code: '<TextField invalid>\n  <Label>Email</Label>\n  <Input name="email" />\n  <FieldError>Enter a valid email.</FieldError>\n</TextField>',
        language: "tsx",
      },
    ],
  },
  {
    slug: "ssr",
    order: 6,
    title: "SSR",
    summary: "Make the first server picture and first browser picture match exactly.",
    sections: [
      {
        id: "same-first-render",
        title: "Render the same first tree",
        explanation:
          "Server rendering makes HTML before the browser can use window, localStorage, or media queries. React then connects to that HTML in the browser. If the first browser tree is different, React has to repair a mismatch and your UI can jump.",
        code: "// Good: the same initial value on server and client\n<Dialog defaultOpen={false}>...</Dialog>",
        language: "tsx",
        note: "Treat the server render as the first photograph. The browser must begin with the same photograph before it starts moving.",
      },
      {
        id: "after-mount",
        title: "Read browser-only information after mount",
        explanation:
          "If a saved browser preference should open a panel, read it in an effect after hydration. Start with a stable default first. Then update controlled state once the browser is available.",
        code: 'const [open, setOpen] = useState(false);\nuseEffect(() => setOpen(localStorage.getItem("help") === "open"), []);\n\n<Popover open={open} onToggle={setOpen}>...</Popover>',
        language: "tsx",
      },
      {
        id: "stable-ids",
        title: "Keep component order stable",
        explanation:
          "Field and overlay parts make matching IDs so labels, descriptions, triggers, and content can find each other. React can make those IDs match on server and client when the component tree has the same order. Avoid conditionally inserting a different first child only in the browser.",
        code: '// Keep this shape on server and client\n<TextField><Label>Name</Label><Input name="name" /></TextField>',
        language: "tsx",
      },
    ],
  },
] satisfies LearnDoc[];

export const learnBySlug = new Map(learnDocs.map((page) => [page.slug, page]));
