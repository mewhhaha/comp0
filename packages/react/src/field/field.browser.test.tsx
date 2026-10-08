import { describe, it } from "vitest";
import { render } from "../../test/render.js";
import { expectNoAxeViolations } from "../../test/axe.js";
import {
  Checkbox,
  CheckboxGroup,
  Description,
  FieldError,
  Fieldset,
  Input,
  Label,
  Legend,
  NumberField,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
  Radio,
  RadioGroup,
  SearchField,
  SearchFieldClear,
  SearchFieldInput,
  TextArea,
  TextField,
} from "../index.js";

describe("invalid field states", () => {
  it("has no axe violations with text controls marked invalid", async () => {
    const { container, unmount } = render(
      <>
        <TextField id="email" defaultValue="not an email" invalid required>
          <Label>Email</Label>
          <Description>We send receipts here.</Description>
          <Input name="email" type="email" />
          <FieldError>Enter a valid email.</FieldError>
        </TextField>
        <TextField id="notes" defaultValue="" invalid>
          <Label>Notes</Label>
          <TextArea name="notes" />
          <FieldError>Notes are required.</FieldError>
        </TextField>
        <SearchField id="query" defaultValue="docs" invalid>
          <Label>Search</Label>
          <SearchFieldInput name="q" />
          <SearchFieldClear>Clear</SearchFieldClear>
          <FieldError>No results for that query.</FieldError>
        </SearchField>
        <NumberField id="tickets" defaultValue={0} min={1} invalid required>
          <Label>Tickets</Label>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
          <FieldError>Order at least one ticket.</FieldError>
        </NumberField>
      </>,
    );

    await expectNoAxeViolations(container, "invalid text controls");
    unmount();
  });

  it("has no axe violations with invalid choice groups", async () => {
    const { container, unmount } = render(
      <>
        <CheckboxGroup id="topics" name="topics" invalid required>
          <Legend>Topics</Legend>
          <Checkbox value="news">News</Checkbox>
          <Checkbox value="events">Events</Checkbox>
          <FieldError>Choose at least one topic.</FieldError>
        </CheckboxGroup>
        <RadioGroup id="plan" name="plan" invalid required>
          <Legend>Plan</Legend>
          <Radio value="free">Free</Radio>
          <Radio value="pro">Pro</Radio>
          <FieldError>Choose a plan.</FieldError>
        </RadioGroup>
        <Fieldset id="billing" invalid>
          <Legend>Billing</Legend>
          <Description>Both addresses are required.</Description>
          <FieldError>Billing details are incomplete.</FieldError>
        </Fieldset>
      </>,
    );

    await expectNoAxeViolations(container, "invalid choice groups");
    unmount();
  });
});
