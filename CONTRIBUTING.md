# Contributing to comp0

Install the workspace and Chromium used by the browser tests:

```sh
pnpm install
pnpm exec playwright install chromium
pnpm dev
```

Before submitting a change, run the checks that cover it. The complete local verification set is:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:browser
pnpm build
pnpm test:package
pnpm test:compiler-smoke
```

`test:package` runs each library's prepack build, inspects both tarballs, installs them in a temporary consumer, typechecks current composition and polymorphic-link examples, executes both library root exports, and verifies that undeclared subpaths are rejected.

## Releases

Release Please maintains one release pull request for `@comp0/core` and `@comp0/react`, with their versions linked. Merging the release pull request creates path-specific GitHub releases and publishes the libraries in dependency order.

Publishing authenticates with the required `NPM_TOKEN` repository secret and records npm provenance. An optional `RELEASE_PLEASE_TOKEN` GitHub App or personal access token lets the release pull request trigger the normal pull-request CI workflow; otherwise Release Please uses `GITHUB_TOKEN`.

## React Compiler

The package build, docs app, and both Vitest projects transform source with the exactly pinned `oxc-transform@0.135.0` configuration in [`react-compiler-vite.ts`](./react-compiler-vite.ts). Source consumers must apply an equivalent React Compiler transform targeting React 19.

Version 0.136.0 stopped emitting fallback output for this repository's expected compiler bailouts, and later versions removed the Node API used here. Do not change the pin without rerunning the Babel-versus-oxc conformance comparison and updating the compiled-file smoke baseline.

Ordinary values and callbacks should be left to the compiler. Explicit memoization is reserved for semantic identity, effect-dependency safety across compiler bailouts, context fanout, or measured hot paths. The package-specific constraints and known hot paths are documented in [`packages/react/PERFORMANCE.md`](./packages/react/PERFORMANCE.md).

## Documentation app

The deployed documentation is a React Router RSC Framework Mode application on Cloudflare Workers. Its architecture, maintenance commands, and pinned preview stack are documented in [`apps/docs/README.md`](./apps/docs/README.md).
