# comp0 documentation app

The docs app runs React Router RSC Framework Mode on Cloudflare Workers. Route content and Shiki highlighting are server components; the shell, live examples, copy button, previews, and lesson pager are client islands. The server sends only a compact navigation and search index to the shell.

Component pages are generated from `src/content/catalog.ts`. The live and displayed example for a component is the same source file under `src/examples/cases`.

The preview stack is pinned exactly in `package.json`: React Router 8.2.0, `@vitejs/plugin-react` 6.0.3, `@vitejs/plugin-rsc` 0.5.27, `@cloudflare/vite-plugin` 1.44.0, and Wrangler 4.110.0. These APIs are experimental; upgrade them as one tested set and repeat cold-cache, bundle-boundary, Worker preview, and browser checks.

```sh
pnpm dev
pnpm --filter @comp0/docs build
pnpm --filter @comp0/docs run preview
pnpm --filter @comp0/docs run deploy
```

The production build verifies that the catalog and Shiki do not enter client assets. The public Worker is [comp0-docs.horrible.workers.dev](https://comp0-docs.horrible.workers.dev).
