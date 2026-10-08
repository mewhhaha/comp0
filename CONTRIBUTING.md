# Contributing to comp0

Install the workspace and Chromium used by the browser tests:

```sh
pnpm install
pnpm exec playwright install chromium
pnpm dev
```

Before submitting a change, run the checks that cover it. `pnpm verify` runs the complete local set (the same jobs CI runs):

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:all          # unit (jsdom) and browser (Chromium) projects
pnpm test:package
pnpm test:compiler-smoke   # builds every package and the docs app first
pnpm test:e2e          # Playwright Test against `vite preview` of the docs build
```

`pnpm test:e2e` serves `apps/docs/build` on port 4318; run it after a build. Set `DOCS_URL` to test an already-running server instead. CI also runs a scheduled weekly `pnpm audit --prod`; run it locally when changing dependencies.

Guards that read the docs and sources: `apps/docs/src/content/props.test.ts` typechecks every prop table against the real component types (`DOCS_PROPS_SLUGS=select,menu` limits it to some pages), and `apps/docs/src/content/data-attributes.test.ts` checks emitted `data-*` attributes against `packages/react/data-attributes.json` and each page's `stateHooks` (`DATA_ATTR_FAMILIES=select,menu` limits it to some families).

`test:package` runs each library's prepack build, inspects both tarballs, installs them in a temporary consumer, typechecks current composition and polymorphic-link examples, executes both library root exports, and verifies that undeclared subpaths are rejected.

## Releases

Pushing a change to either library's `package.json` on `main` runs `pnpm -r publish --tag next`, publishing every workspace version that is not already in the registry to the prerelease channel. Push an exact version tag such as `v0.2.0` to publish the current unpublished versions under `latest` instead. Keep `@comp0/core` and `@comp0/react` on the same version and bump every prerelease version before publishing because npm versions are immutable.

Publishing uses npm trusted publishing: both packages authorize the GitHub Actions workflow `release.yml`, and the workflow exchanges its OIDC identity for a short-lived registry credential. No npm token is stored in GitHub. npm records provenance automatically; the explicit publish flag keeps that requirement visible in the workflow. The workspace root and documentation app are private, so recursive publishing considers only `@comp0/core` and `@comp0/react`.

## React Compiler

The package build uses `oxc-transform-react@0.148.0`, targeting React 19. The docs app and both Vitest projects use the native `compiler: true` option in `@vitejs/plugin-react`. The plugin compiles client environments, preserves Fast Refresh, and leaves RSC/SSR environments uncompiled. Vitest compiles package source; server-only docs helpers stay outside its client transform.

`pnpm test:compiler-conformance` also fails when a component module under `packages/react/src` is not compiled by the native compiler, printing the Babel bailout reason; a file may be listed with a reason in `packages/react/react-compiler-exceptions.json`, and stale entries fail too. After reviewing an intended change in compiled files, run `pnpm compiler:baseline` (it builds, then rewrites `react-compiler-files.json`).

Before changing the compiler pin, run `pnpm test:compiler-conformance`. It compares every package source file against Babel, checks that native compilation covers every file Babel compiles, and verifies recoverable bailout output and fatal diagnostics. `pnpm test:compiler-smoke` also verifies the exact compiled-file baseline in `packages/react/react-compiler-files.json` and imports the production package. Review any baseline changes before updating that file. Babel is a development-only conformance dependency; package and Vite builds use the native compiler.

Ordinary values and callbacks should be left to the compiler. Explicit memoization is reserved for semantic identity, effect-dependency safety across compiler bailouts, context fanout, or measured hot paths. The package-specific constraints and known hot paths are documented in [`packages/react/PERFORMANCE.md`](./packages/react/PERFORMANCE.md).

## Documentation app

The deployed documentation is a React Router RSC Framework Mode application on Cloudflare Workers. Its architecture, maintenance commands, and pinned preview stack are documented in [`apps/docs/README.md`](./apps/docs/README.md).
