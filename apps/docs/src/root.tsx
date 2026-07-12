import { type ReactNode } from "react";
import { Links, Meta, Outlet, ScrollRestoration } from "react-router";
import { DocsShell } from "./components/shell/index.js";
import { docsNavigation, paletteEntries } from "./content/navigation.js";
import "./styles.css";

export function meta() {
  return [
    { title: "comp0 docs · Headless React, explained" },
    {
      name: "description",
      content: "Step-by-step guides for building accessible headless React components with comp0.",
    },
  ];
}

export function ServerLayout({ children }: { children: ReactNode }) {
  return (
    <html className="antialiased" lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta content="#fffaf2" media="(prefers-color-scheme: light)" name="theme-color" />
        <meta content="#080808" media="(prefers-color-scheme: dark)" name="theme-color" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link href="https://rsms.me/" rel="preconnect" />
        <link href="https://rsms.me/inter/inter.css" rel="stylesheet" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        {import.meta.env.DEV ? <script src="https://ui.sh/ui-picker.js" /> : null}
      </body>
    </html>
  );
}

export function ServerComponent() {
  return (
    <DocsShell navigation={docsNavigation} paletteEntries={paletteEntries}>
      <Outlet />
    </DocsShell>
  );
}
