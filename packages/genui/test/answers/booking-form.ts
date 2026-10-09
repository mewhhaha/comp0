import { type JsonValue } from "../../src/json/parse.js";

/** A booking form that uses every kind of control, grouped in sections. */
export const bookingForm: JsonValue = {
  type: "Stack",
  children: [
    { type: "Heading", text: "Book your stay", level: 2 },
    {
      type: "Text",
      text: "Tell us when you arrive and what you need. We will confirm by email.",
      tone: "muted",
    },
    {
      type: "Form",
      name: "booking",
      title: "Book your stay",
      submitLabel: "Request booking",
      children: [
        {
          type: "Card",
          title: "Guest",
          children: [
            {
              type: "TextField",
              label: "Full name",
              name: "name",
              required: true,
              placeholder: "Ada Lovelace",
              description: "As on your passport.",
            },
            {
              type: "TextField",
              label: "Email",
              name: "email",
              inputType: "email",
              required: true,
              placeholder: "you@example.com",
            },
            {
              type: "TextField",
              label: "Phone",
              name: "phone",
              inputType: "tel",
              placeholder: "+46 70 000 00 00",
              description: "Optional.",
            },
          ],
        },
        {
          type: "Card",
          title: "Trip",
          children: [
            {
              type: "DatePicker",
              label: "Arrival",
              name: "arrival",
              value: "2026-11-02",
              required: true,
              description: "Check-in is from 3 pm.",
            },
            {
              type: "NumberField",
              label: "Nights",
              name: "nights",
              value: 3,
              min: 1,
              max: 30,
              step: 1,
              required: true,
              description: "Up to 30 nights.",
            },
            {
              type: "Select",
              label: "Room",
              name: "room",
              options: [
                { value: "single", label: "Single room" },
                { value: "double", label: "Double room" },
                { value: "suite", label: "Suite" },
                { value: "family", label: "Family room" },
                { value: "loft", label: "Loft" },
                { value: "villa", label: "Villa" },
              ],
              value: "double",
              required: true,
            },
            {
              type: "RadioGroup",
              label: "Board",
              name: "board",
              options: [
                { value: "none", label: "Room only" },
                { value: "breakfast", label: "Breakfast" },
                { value: "half", label: "Half board" },
              ],
              value: "breakfast",
              required: true,
              description: "Billed per night.",
            },
          ],
        },
        {
          type: "Card",
          title: "Preferences",
          children: [
            {
              type: "CheckboxGroup",
              label: "Extras",
              name: "extras",
              options: ["Airport pickup", "Late checkout", "Cot"],
              value: ["Airport pickup"],
              description: "Pick any.",
            },
            {
              type: "Checkbox",
              label: "I accept the cancellation policy",
              name: "terms",
              checked: false,
              required: true,
            },
            { type: "Switch", label: "Email me offers", name: "offers", checked: false },
            {
              type: "TextArea",
              label: "Notes",
              name: "notes",
              placeholder: "Allergies, arrival time, anything else.",
              description: "We read every note.",
            },
          ],
        },
      ],
    },
    {
      type: "Disclosure",
      summary: "Need to change a booking?",
      children: [
        {
          type: "Text",
          text: "Reply to the confirmation email and we will change it for free up to 48 hours before arrival.",
        },
      ],
    },
  ],
};
