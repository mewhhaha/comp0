# comp0 documentation app

The docs app runs React Router RSC Framework Mode on Cloudflare Workers. Route content and Shiki highlighting are server components; the shell, live examples, copy button, previews, and lesson pager are client islands. The server sends only a compact navigation and search index to the shell.

Component pages are generated from `src/content/catalog.ts`. The live and displayed example for a component is the same source file under `src/examples/cases`. Each live example loads on demand, so visiting one component page does not fetch the whole example catalog.

The preview stack is pinned exactly in `package.json`. React Router, the Vite React/RSC and Cloudflare plugins, the native compiler, and Wrangler are upgraded as one tested set. Repeat cold-cache, bundle-boundary, Worker preview, and browser checks when updating them.

```sh
pnpm dev
pnpm --filter @comp0/docs build
pnpm --filter @comp0/docs run preview
pnpm --filter @comp0/docs run deploy
```

The production build verifies that the catalog and Shiki do not enter client assets, examples remain lazy, and every component page plus its variants stays below the former SPA JavaScript budget. With a dev or preview server running, run `DOCS_URL=http://127.0.0.1:4173 pnpm test:docs` to verify hydration and live Select interaction. The public Worker is [comp0-docs.horrible.workers.dev](https://comp0-docs.horrible.workers.dev).
