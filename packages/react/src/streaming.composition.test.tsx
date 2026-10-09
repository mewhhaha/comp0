import { type ReactElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, setup } from "../test/render.js";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  BusyRegion,
  Carousel,
  CarouselSlide,
  CarouselViewport,
  ColorSwatch,
  Feed,
  FloatingPanel,
  FloatingPanelGroup,
  FeedArticle,
  GridList,
  GridListItem,
  Label,
  ListBox,
  ListBoxOption,
  Messages,
  Pagination,
  Preview,
  PaginationItem,
  PaginationList,
  PaginationPage,
  Select,
  SelectOption,
  SelectPopover,
  SelectTrigger,
  SelectValue,
  Steps,
  StepsItem,
  StepsList,
  StepsPanel,
  StepsTrigger,
  Tab,
  TabList,
  TabPanel,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableRowHeader,
  Tabs,
  Timeline,
  TimelineItem,
  Tree,
  TreeGrid,
  TreeGridCell,
  TreeGridRow,
  TreeGridRowGroup,
  TreeItem,
} from "./index.js";

/*
 * Collections arrive item by item inside a busy region. Each family keeps the
 * items already rendered (same DOM nodes, no remounts), logs nothing, and never
 * moves focus while the content grows.
 */

function items(count: number) {
  return Array.from({ length: count }, (_, index) => `Item ${index}`);
}

type CollectionCase = {
  name: string;
  list: (count: number) => ReactElement;
};

const collections: CollectionCase[] = [
  {
    name: "Table",
    list: (count) => (
      <Table>
        <TableBody>
          {items(count).map((name) => (
            <TableRow key={name}>
              <TableRowHeader>{name}</TableRowHeader>
              <TableCell>cell</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ),
  },
  {
    name: "ListBox",
    list: (count) => (
      <ListBox aria-label="Choices">
        {items(count).map((name) => (
          <ListBoxOption key={name} value={name}>
            {name}
          </ListBoxOption>
        ))}
      </ListBox>
    ),
  },
  {
    name: "Select",
    list: (count) => (
      <Select name="streamed" defaultValue="Item 0">
        <Label>Choice</Label>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectPopover>
          {items(count).map((name) => (
            <SelectOption key={name} value={name}>
              {name}
            </SelectOption>
          ))}
        </SelectPopover>
      </Select>
    ),
  },
  {
    name: "Tabs",
    list: (count) => (
      <Tabs defaultValue="Item 0">
        <TabList aria-label="Sections">
          {items(count).map((name) => (
            <Tab key={name} value={name}>
              {name}
            </Tab>
          ))}
        </TabList>
        {items(count).map((name) => (
          <TabPanel key={name} value={name}>
            Panel {name}
          </TabPanel>
        ))}
      </Tabs>
    ),
  },
  {
    name: "Accordion",
    list: (count) => (
      <Accordion defaultValue="Item 0">
        {items(count).map((name) => (
          <AccordionItem key={name} value={name}>
            <AccordionHeader>
              <AccordionTrigger>{name}</AccordionTrigger>
            </AccordionHeader>
            <AccordionPanel>Details {name}</AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    ),
  },
  {
    name: "Tree",
    list: (count) => (
      <Tree aria-label="Files">
        {items(count).map((name) => (
          <TreeItem key={name} value={name}>
            {name}
          </TreeItem>
        ))}
      </Tree>
    ),
  },
  {
    name: "TreeGrid",
    list: (count) => (
      <TreeGrid aria-label="Files">
        <TreeGridRowGroup>
          {items(count).map((name) => (
            <TreeGridRow key={name} value={name}>
              <TreeGridCell>{name}</TreeGridCell>
            </TreeGridRow>
          ))}
        </TreeGridRowGroup>
      </TreeGrid>
    ),
  },
  {
    name: "GridList",
    list: (count) => (
      <GridList aria-label="Tasks">
        {items(count).map((name) => (
          <GridListItem key={name} value={name}>
            {name}
          </GridListItem>
        ))}
      </GridList>
    ),
  },
  {
    name: "Timeline",
    list: (count) => (
      <Timeline aria-label="History">
        {items(count).map((name) => (
          <TimelineItem key={name}>{name}</TimelineItem>
        ))}
      </Timeline>
    ),
  },
  {
    name: "Feed",
    list: (count) => (
      <Feed aria-label="Stories">
        {items(count).map((name) => (
          <FeedArticle key={name} aria-label={name}>
            {name}
          </FeedArticle>
        ))}
      </Feed>
    ),
  },
  {
    name: "Messages",
    list: (count) => (
      <Messages aria-label="Conversation">
        {items(count).map((name) => (
          <p key={name}>{name}</p>
        ))}
      </Messages>
    ),
  },
  {
    name: "Pagination",
    list: (count) => (
      <Pagination defaultValue={1} totalPages={count}>
        <PaginationList>
          {items(count).map((name, index) => (
            <PaginationItem key={name}>
              <PaginationPage value={index + 1}>{name}</PaginationPage>
            </PaginationItem>
          ))}
        </PaginationList>
      </Pagination>
    ),
  },
  {
    name: "Steps",
    list: (count) => (
      <Steps defaultValue="Item 0">
        <StepsList>
          {items(count).map((name) => (
            <StepsItem key={name} value={name}>
              <StepsTrigger>{name}</StepsTrigger>
            </StepsItem>
          ))}
        </StepsList>
        {items(count).map((name) => (
          <StepsPanel key={name} value={name}>
            Panel {name}
          </StepsPanel>
        ))}
      </Steps>
    ),
  },
  {
    name: "Carousel",
    list: (count) => (
      <Carousel aria-label="Highlights">
        <CarouselViewport>
          {items(count).map((name) => (
            <CarouselSlide key={name}>{name}</CarouselSlide>
          ))}
        </CarouselViewport>
      </Carousel>
    ),
  },
];

function busy(children: ReactNode, isBusy = true) {
  return (
    <>
      <button type="button">Outside</button>
      <BusyRegion busy={isBusy}>{children}</BusyRegion>
    </>
  );
}

function itemNamed(container: HTMLElement, name: string) {
  const match = [...container.querySelectorAll("*")].find(
    (element) => element.childElementCount === 0 && element.textContent === name,
  );
  expect(match, `${name} should render`).toBeDefined();
  return match!;
}

describe("collections inside a busy region", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(collections)(
    "$name keeps rendered items, logs nothing, and leaves focus alone as items stream in",
    async ({ list }) => {
      const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const { container, rerender, user } = setup(busy(list(1)));
      await user.click(container.querySelector("button")!);
      const outside = document.activeElement;
      const first = itemNamed(container, "Item 0");

      for (const count of [2, 3, 4]) {
        rerender(busy(list(count)));
        expect(itemNamed(container, "Item 0")).toBe(first);
        expect(document.activeElement).toBe(outside);
      }
      expect(itemNamed(container, "Item 3")).toBeDefined();

      rerender(busy(list(4), false));
      expect(itemNamed(container, "Item 0")).toBe(first);
      expect(document.activeElement).toBe(outside);
      expect(error).not.toHaveBeenCalled();
    },
  );

  it.each(collections.filter(({ name }) => ["Tabs", "Tree", "Steps", "Accordion"].includes(name)))(
    "$name keeps focus on the focused item while siblings arrive",
    async ({ list }) => {
      const { container, rerender, user } = setup(busy(list(2)));
      await user.tab();
      await user.tab();
      const focused = document.activeElement;
      expect(container.contains(focused)).toBe(true);

      rerender(busy(list(3)));
      rerender(busy(list(4)));

      expect(document.activeElement).toBe(focused);
    },
  );
});

describe("warnings inside a busy region", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("holds Pagination warnings until the region settles", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const ui = (isBusy: boolean) =>
      busy(
        <Pagination totalPages={0} defaultValue={1}>
          <PaginationList />
        </Pagination>,
        isBusy,
      );
    const { rerender } = render(ui(true));
    expect(error).not.toHaveBeenCalled();

    rerender(ui(false));
    expect(error.mock.calls).toEqual([
      ["Pagination totalPages must be a positive integer; received 0. Using 1."],
    ]);

    rerender(ui(false));
    expect(error).toHaveBeenCalledTimes(1);
  });

  it("holds TreeGrid hierarchy warnings until the region settles", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const ui = (isBusy: boolean, withParent: boolean) =>
      busy(
        <TreeGrid aria-label="Streamed files">
          <TreeGridRowGroup>
            <TreeGridRow value="child" parentValue="stream-parent">
              <TreeGridCell>child</TreeGridCell>
            </TreeGridRow>
            {withParent && (
              <TreeGridRow value="stream-parent">
                <TreeGridCell>parent</TreeGridCell>
              </TreeGridRow>
            )}
          </TreeGridRowGroup>
        </TreeGrid>,
        isBusy,
      );
    const { rerender } = render(ui(true, false));
    expect(error).not.toHaveBeenCalled();

    // The parent arrives while streaming: the hierarchy becomes valid and nothing is reported.
    rerender(ui(true, true));
    rerender(ui(false, true));
    expect(error).not.toHaveBeenCalled();

    rerender(ui(false, false));
    expect(error.mock.calls).toHaveLength(1);
    expect(String(error.mock.calls[0]?.[0])).toContain('missing parentValue "stream-parent"');
  });

  it.each([
    {
      name: "Preview",
      ui: () => <Preview openDelay={-7}>preview</Preview>,
      message: "Preview delays must be non-negative; received openDelay -7",
    },
    {
      name: "ColorSwatch",
      ui: () => <ColorSwatch color="streamed-not-a-color" />,
      message: 'ColorSwatch color "streamed-not-a-color" must be a three- or six-digit hex color',
    },
    {
      name: "FloatingPanel",
      ui: () => (
        <FloatingPanelGroup>
          <FloatingPanel position={{ x: Number.NaN, y: 3 }}>panel</FloatingPanel>
        </FloatingPanelGroup>
      ),
      message: "FloatingPanel position must contain finite x and y coordinates",
    },
  ])("holds $name warnings until the region settles", ({ ui, message }) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { rerender } = render(busy(ui()));
    expect(error).not.toHaveBeenCalled();

    rerender(busy(ui(), false));
    rerender(busy(ui(), false));
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0]?.[0])).toContain(message);
  });
});
