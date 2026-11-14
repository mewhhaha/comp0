import { Suspense, use, type ReactElement } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import {
  GridList,
  GridListItem,
  ListBox,
  ListBoxOption,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TabList,
  Tabs,
} from "./index.js";

function stream(ui: ReactElement, onShell: () => void) {
  let html = "";
  return new Promise<string>((done, fail) => {
    const sink = new Writable({
      write(chunk, _encoding, callback) {
        html += String(chunk);
        callback();
      },
      final(callback) {
        callback();
        done(html);
      },
    });
    const pipeable = renderToPipeableStream(ui, {
      onShellReady() {
        pipeable.pipe(sink);
        onShell();
      },
      onError: fail,
    });
  });
}

const streamedStops = (html: string, role: string) =>
  [...html.matchAll(new RegExp(`<[a-z]+[^>]*role="${role}"[^>]*>`, "g"))].filter((match) =>
    match[0].includes('tabindex="0"'),
  );

// Table cells carry no role; their stop is the one cell with tabindex="0".
const streamedCellStops = (html: string) =>
  [...html.matchAll(/<t[dh][\s>][^>]*>/g)].filter((match) => match[0].includes('tabindex="0"'));

function gate() {
  let open!: () => void;
  const promise = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { promise, open };
}

/**
 * Streaming SSR, kept apart from the hydration suites: `renderToPipeableStream` makes React log
 * a "multiple renderers" error in later tests of the same file. An item that streams in after
 * the shell cannot take the stop from one whose HTML was already sent, so the HTML holds one
 * stop. `collection-pass.out-of-order.test.tsx` covers what happens once that HTML hydrates.
 */
describe("collection pass with streaming", () => {
  it("streams one tab stop when the selected option suspends on the server", async () => {
    const late = gate();
    const Late = () => {
      use(late.promise);
      return (
        <>
          <ListBoxOption value="pear">Pear</ListBoxOption>
          <ListBoxOption value="plum">Plum</ListBoxOption>
        </>
      );
    };

    const html = await stream(
      <ListBox aria-label="Fruit" defaultValue="plum">
        <ListBoxOption value="apple">Apple</ListBoxOption>
        <Suspense fallback={null}>
          <Late />
        </Suspense>
      </ListBox>,
      late.open,
    );

    expect(streamedStops(html, "option")).toHaveLength(1);
  });

  it("streams one tab stop when the selected tab suspends on the server", async () => {
    const late = gate();
    const Late = () => {
      use(late.promise);
      return <Tab value="two">Two</Tab>;
    };

    const html = await stream(
      <Tabs defaultValue="two">
        <TabList aria-label="Project">
          <Tab value="one">One</Tab>
          <Suspense fallback={null}>
            <Late />
          </Suspense>
        </TabList>
      </Tabs>,
      late.open,
    );

    expect(streamedStops(html, "tab")).toHaveLength(1);
  });

  it("streams one tab stop when the selected row suspends on the server", async () => {
    const late = gate();
    const Late = () => {
      use(late.promise);
      return <GridListItem value="b">B</GridListItem>;
    };

    const html = await stream(
      <GridList aria-label="Files" defaultValue="b">
        <GridListItem value="a">A</GridListItem>
        <Suspense fallback={null}>
          <Late />
        </Suspense>
      </GridList>,
      late.open,
    );

    expect(streamedStops(html, "row")).toHaveLength(1);
  });

  it("streams one tab stop when the first table row suspends on the server", async () => {
    const late = gate();
    const Late = () => {
      use(late.promise);
      return (
        <TableRow>
          <TableCell>Ada</TableCell>
          <TableCell>Engineer</TableCell>
        </TableRow>
      );
    };

    const html = await stream(
      <Table aria-label="People">
        <TableBody>
          <Suspense fallback={null}>
            <Late />
          </Suspense>
          <TableRow>
            <TableCell>Grace</TableCell>
            <TableCell>Admiral</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
      late.open,
    );

    expect(streamedCellStops(html)).toHaveLength(1);
  });
});
