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

Pushing a change to either library's `package.json` on `main` runs `pnpm -r publish --tag next`, publishing every workspace version that is not already in the registry to the prerelease channel. Push an exact version tag such as `v0.2.0` to publish the current unpublished versions under `latest` instead. Keep `@comp0/core` and `@comp0/react` on the same version and bump every prerelease version before publishing because npm versions are immutable.

Publishing uses npm trusted publishing: both packages authorize the GitHub Actions workflow `release.yml`, and the workflow exchanges its OIDC identity for a short-lived registry credential. No npm token is stored in GitHub. npm records provenance automatically; the explicit publish flag keeps that requirement visible in the workflow. The workspace root and documentation app are private, so recursive publishing considers only `@comp0/core` and `@comp0/react`.

## React Compiler

The package build, docs app, and both Vitest projects transform source with the exactly pinned `oxc-transform@0.135.0` configuration in [`react-compiler-vite.ts`](./react-compiler-vite.ts). Source consumers must apply an equivalent React Compiler transform targeting React 19.

Version 0.136.0 stopped emitting fallback output for this repository's expected compiler bailouts, and later versions removed the Node API used here. Do not change the pin without rerunning the Babel-versus-oxc conformance comparison and updating the compiled-file smoke baseline.

Ordinary values and callbacks should be left to the compiler. Explicit memoization is reserved for semantic identity, effect-dependency safety across compiler bailouts, context fanout, or measured hot paths. The package-specific constraints and known hot paths are documented in [`packages/react/PERFORMANCE.md`](./packages/react/PERFORMANCE.md).

## Documentation app

The deployed documentation is a React Router RSC Framework Mode application on Cloudflare Workers. Its architecture, maintenance commands, and pinned preview stack are documented in [`apps/docs/README.md`](./apps/docs/README.md).
