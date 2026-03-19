# van-stack

`van-stack` is a router-first framework for VanJS with support for CSR, SSR, SSG, and adaptive navigation. It is built around one shared route model, one shared Van render facade, and multiple runtime entrypoints.

## Install

```bash
bun add van-stack
```

## Why van-stack?

- filesystem routing with reserved route-module filenames
- one route model across CSR, SSR, and SSG
- a framework-owned `van-stack/render` facade for shared Van components
- three CSR runtime modes: `hydrated`, `shell`, and `custom`
- explicit hydration policies: `document-only`, `islands`, and `app`
- adaptive navigation with `replace` and `stack`
- optional Vite integration instead of Vite-coupled architecture

## Package Surface

- `van-stack`: core route model, matching, types, defaults
- `van-stack/compiler`: filesystem route discovery, in-memory route loading, optional manifest writing
- `van-stack/render`: shared Van facade for route modules and demos
- `van-stack/csr`: client router for `hydrated`, `shell`, and `custom`
- `van-stack/ssr`: request-to-HTML rendering with bootstrap payloads
- `van-stack/ssg`: static generation from the same route graph
- `van-stack/vite`: optional DX adapter

## How It Fits Together

1. Author route modules under `src/routes`.
2. Use `van-stack/compiler` to load those routes into memory with `loadRoutes({ root: "src/routes" })`, or emit `.van-stack/routes.generated.ts` when a browser CSR app wants route-level chunks.
3. Write shared route components against `van-stack/render`.
4. Pass the loaded routes into `van-stack/csr`, `van-stack/ssr`, or `van-stack/ssg`.
5. Add `van-stack/vite` only if you want route-aware DX on top of the compiler layer.

Filesystem routing is the default path, but it is not mandatory. Manual route arrays still work when an app intentionally wants to bypass the compiler.

## Quick Start

### Route Files

```text
src/routes/
  app/
    layout.ts
    @sidebar/
      page.ts
    users/
      [id]/
        page.ts
        loader.ts
        meta.ts
```

`@slot` directories are pathless route branches that attach to the nearest owning `layout.ts`. The default branch is still exposed as `children`; named branches are exposed as `slots[name]`, and their resolved data is exposed as `slotData[name]`.

### Load Routes

```ts
import { loadRoutes } from "van-stack/compiler";

const routes = await loadRoutes({ root: "src/routes" });
```

That gives you a runtime-ready route list. If a custom build pipeline needs a persisted artifact, the compiler can still write `.van-stack/routes.generated.ts` explicitly:

```ts
import { writeRouteManifest } from "van-stack/compiler";

await writeRouteManifest({ root: "src/routes" });
```

### Route Module Example

`loader.ts`

```ts
export default async function loader(input: {
  params: { slug: string };
  request: Request;
}) {
  return {
    post: {
      slug: input.params.slug,
      title: `Post: ${input.params.slug}`,
      excerpt: `Notes about ${input.params.slug}`,
    },
    requestUrl: input.request.url,
  };
}
```

`page.ts`

```ts
import { van } from "van-stack/render";

const { article, h1, p } = van.tags;

export default function page(input: {
  data: {
    post: { title: string; excerpt: string };
  };
}) {
  return article(h1(input.data.post.title), p(input.data.post.excerpt));
}
```

`meta.ts`

```ts
export default function meta(input: {
  params: { slug: string };
  data: {
    post: { title: string; excerpt: string };
  };
}) {
  return {
    title: input.data.post.title,
    description: input.data.post.excerpt,
    canonical: `/posts/${input.params.slug}`,
  };
}
```

`layout.ts`

```ts
import { van } from "van-stack/render";

const { aside, div, main } = van.tags;

export default function layout(input: {
  children: unknown;
  slots: Record<string, unknown>;
  slotData: Record<string, unknown>;
}) {
  return div(
    { class: "control-plane" },
    aside(input.slots.sidebar),
    main(input.children),
  );
}
```

`route.ts` is for raw `Request -> Response` handlers such as `robots.txt`, `sitemap.xml`, feeds, proxies, or webhook endpoints:

```ts
export default function route() {
  return new Response("User-agent: *\nAllow: /\n", {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
```

`hydrate.ts` is for real DOM hydration of SSR routes using `hydrationPolicy: "app"`:

```ts
import { van } from "van-stack/render";

export default function hydrate(input: {
  root: Element;
  data: { post: { likes: number } };
}) {
  const likes = van.state(input.data.post.likes);
  const button = input.root.querySelector("[data-like-button]");
  const count = input.root.querySelector("[data-like-count]");

  if (!(button instanceof HTMLButtonElement) || !(count instanceof HTMLSpanElement)) {
    throw new Error("Missing hydration markers.");
  }

  van.hydrate(button, (dom) => {
    dom.onclick = () => {
      likes.val += 1;
    };
    return dom;
  });

  van.hydrate(count, (dom) => {
    dom.textContent = String(likes.val);
    return dom;
  });
}
```

### Shell CSR Boot

```ts
import { loadRoutes } from "van-stack/compiler";
import { createRouter } from "van-stack/csr";

const routes = await loadRoutes({ root: "src/routes" });

const router = createRouter({
  mode: "shell",
  routes,
  history: window.history,
  transport: {
    async load(match) {
      const response = await fetch(`/_van-stack/data${match.pathname}`);
      return response.json();
    },
  },
});

await router.load("/posts/agentic-coding-is-the-future");
await router.navigate("/posts/github-down");
```

### Chunked CSR Boot

Use the emitted route manifest when a browser CSR app wants bundler-visible lazy `import()` boundaries for per-route chunks:

```ts
import routes from "../.van-stack/routes.generated";
import { startClientApp } from "van-stack/csr";

const app = startClientApp({
  mode: "shell",
  routes,
  history: window.history,
});

await app.ready;
```

The generated manifest is the opt-in chunking path. Apps that bundle everything eagerly can keep using `loadRoutes({ root: "src/routes" })`.

### App Hydration Handoff

For SSR branches using `hydrationPolicy: "app"`, the client handoff no longer has to be wired by hand:

```ts
import { loadRoutes } from "van-stack/compiler";
import { hydrateApp } from "van-stack/csr";

const routes = await loadRoutes({ root: "src/routes" });

const app = hydrateApp({ routes });
await app.ready;

app.router.subscribe((entry) => {
  console.log(entry.path, entry.data);
});
```

`hydrateApp(...)` reads the SSR bootstrap payload, resolves the matched route `hydrate.ts`, waits for that route-level DOM hydration to finish via `app.ready`, then creates a `hydrated` router, intercepts same-origin in-app link clicks, and listens for `popstate`.

### Islands Hydration

For SSR branches using `hydrationPolicy: "islands"`, you can hydrate focused route islands without creating a client router:

```ts
import { loadRoutes } from "van-stack/compiler";
import { hydrateIslands } from "van-stack/csr";

const routes = await loadRoutes({ root: "src/routes" });

const hydration = hydrateIslands({ routes });
await hydration.ready;
```

`hydrateIslands(...)` reads the SSR bootstrap payload, resolves the matched route `hydrate.ts`, and runs that route-level hydration against the server-owned document without taking over navigation.

## API Tour

### `van-stack/compiler`

Use the compiler when you want filesystem routing:

```ts
import { loadRoutes, writeRouteManifest } from "van-stack/compiler";

const routes = await loadRoutes({ root: "src/routes" });

// Optional emitted artifact for chunked browser CSR or custom build tooling.
await writeRouteManifest({ root: "src/routes" });
```

`loadRoutes(...)` is still the recommended default. Writing `.van-stack/routes.generated.ts` is the opt-in path when a browser CSR app wants route-level JS chunks.

### `van-stack/render`

Route modules should import Van and VanX through the framework facade, not from concrete client or server packages:

```ts
import { van, vanX } from "van-stack/render";

const { button, div, p } = van.tags;

export default function page() {
  const count = van.state(0);
  const post = vanX.reactive({
    title: "Increment Demo",
    likes: 0,
  });

  return div(
    p(() => post.title),
    button(
      {
        onclick: () => {
          count.val += 1;
          post.likes += 1;
        },
      },
      "Increment",
    ),
    p(() => `Count: ${count.val}`),
    p(() => `Likes: ${post.likes}`),
  );
}
```

The render facade also exposes `van.hydrate(...)` for route-level DOM hydration modules. Under the hood, CSR binds the real VanX runtime while SSR and SSG bind the server-safe VanX placeholder recommended by the official Van fullstack SSR pattern.

### Third-Party Van Libraries

First-party route code should still use `van-stack/render`. Compatibility shims exist for imported packages that hard-import `vanjs-core` or `vanjs-ext` directly:

```ts
import { vanStackVite, getVanStackCompatAliases } from "van-stack/vite";
```

Use `vanStackVite()` for Vite apps, or reuse `getVanStackCompatAliases()` in Vitest and custom Vite configs so those packages resolve through the bound `van-stack/render` environment. For direct Node SSR and SSG entrypoints, start the process with `van-stack/compat/node-register`.

For Bun SSR and SSG entrypoints, run Bun with the shipped compat override:

```bash
bun run --tsconfig-override ./node_modules/van-stack/compat/bun-tsconfig.json ./src/server.ts
```

`van-stack/compat/bun-preload` is intentionally unsupported. Bun runtime plugins do not intercept bare package imports during `bun run`, so Bun needs the `tsconfig` override path instead.

For a repeatable app setup, add a dedicated Bun tsconfig and call it from package scripts:

`tsconfig.bun.json`

```json
{
  "extends": "./node_modules/van-stack/compat/bun-tsconfig.json"
}
```

`package.json`

```json
{
  "scripts": {
    "ssr": "bun run --tsconfig-override ./tsconfig.bun.json ./src/server.ts",
    "ssg": "bun run --tsconfig-override ./tsconfig.bun.json ./src/build.ts"
  }
}
```

`bunfig.toml` does not currently expose a `tsconfig` override setting, so the supported Bun DX path is a checked-in `tsconfig.bun.json` plus package script aliases.

Compatibility only works when the resolver hook runs before those third-party modules are evaluated. In practice that means you must bind the render env before module evaluation reaches any imported library that reads `van` or `vanX` eagerly.

### `van-stack/csr`

`van-stack/csr` supports three runtime modes:

- `hydrated`: continue from SSR HTML and bootstrap data
- `shell`: boot from a tiny document and use transport-backed loading
- `custom`: boot from a tiny document and keep data ownership in the host app or in components

For framework-owned client rendering, use `startClientApp({ routes, ... })`. It accepts either eager route arrays or lazy manifest-shaped routes from `.van-stack/routes.generated.ts`:

```ts
import routes from "../.van-stack/routes.generated";
import { startClientApp } from "van-stack/csr";

const app = startClientApp({
  mode: "shell",
  routes,
  history: window.history,
});

await app.ready;
```

Resolver-driven `custom` mode:

```ts
import { createRouter } from "van-stack/csr";

const routes = [{ id: "posts/[slug]", path: "/posts/:slug" }];

const router = createRouter({
  mode: "custom",
  routes,
  history: window.history,
  async resolve(match) {
    return graphqlClient.query({
      query: PostBySlugDocument,
      variables: { slug: match.params.slug },
    });
  },
});
```

Component-owned `custom` mode:

```ts
const router = createRouter({
  mode: "custom",
  routes,
  history: window.history,
});
```

In that second shape, VanStack owns route matching, params, query parsing, history, and navigation. Route data is not preloaded; components fetch for themselves.

For SSR handoff in `app` hydration mode, prefer `hydrateApp(...)` over manual bootstrap wiring:

```ts
import { hydrateApp } from "van-stack/csr";

const app = hydrateApp({ routes });
await app.ready;

app.router.subscribe((entry) => {
  console.log(entry.path);
});
```

### `van-stack/ssr`

SSR consumes the same route graph and returns HTML plus bootstrap state:

```ts
import { loadRoutes } from "van-stack/compiler";
import { renderRequest } from "van-stack/ssr";

const routes = await loadRoutes({ root: "src/routes" });

const response = await renderRequest({
  request,
  routes,
});

console.log(response.status);
console.log(await response.text());
```

`request` is the incoming server/runtime request object.

For non-HTML endpoints such as `robots.txt`, `sitemap.xml`, or reverse-proxy style content routes, define `route.ts` and return a raw `Response`.

### `van-stack/ssg`

SSG also consumes the same route graph:

```ts
import { loadRoutes } from "van-stack/compiler";
import { buildStaticRoutes, exportStaticSite } from "van-stack/ssg";

const routes = await loadRoutes({ root: "src/routes" });
const artifacts = await buildStaticRoutes({ routes });

await exportStaticSite({
  routes,
  outDir: "dist",
  assets: [{ from: "public" }],
});
```

`buildStaticRoutes(...)` is the in-memory primitive for caches, tests, and previews. `exportStaticSite(...)` writes deployable static output for generic web servers.

Routes that participate in SSG should provide `entries.ts` so dynamic params can expand into concrete paths. That applies to both `page.ts` HTML routes and raw `route.ts` outputs such as `robots.txt`, `feed.xml`, or `sitemap.xml`.

## Runtime Model

### CSR Modes

- `hydrated`: web browser starts from SSR HTML, then continues as a client app
- `shell`: app starts from a tiny HTML shell and uses VanStack-owned route loading
- `custom`: app starts from a tiny HTML shell and owns its data loading strategy

### Hydration Policies

- `document-only`: SSR HTML only
- `islands`: SSR HTML plus targeted client activation
- `app`: SSR HTML followed by full client-router handoff

In practice, `app` handoff means SSR emits bootstrap state and an app root, while the client calls `hydrateApp({ routes })`, awaits `app.ready`, and then continues from that initial route with real DOM hydration plus router takeover.

Hydration policy is about how SSR output becomes interactive. CSR mode is about how a client router boots and where data comes from.

### Presentation Modes

- `replace`: browser-style view replacement
- `stack`: mobile-style pushed views

Presentation is separate from route matching and data loading. The same route tree can present as `replace` on desktop and `stack` on mobile or Tauri shells.

## Demos

For the fastest evaluator path, run the showcase from the repo root:

```bash
bun run start
```

- `demo/showcase`: evaluator-first demo workspace for the shared blog app
  - `Runtime Gallery`: live `ssg`, `ssr`, `hydrated`, `islands`, `shell`, `custom`, and `chunked` comparisons against one Northstar Journal blog app
  - Post detail routes demonstrate server-backed likes and bookmarks, with component-level hydration for `hydrated` and `islands`
  - `Guided Walkthrough`: annotated evaluator pages that explain those same seven modes and link back to the live routes
  - `Adaptive Navigation`: a separate `stack` presentation track over the same blog graph
- `demo/csr`: focused reference for `hydrated`, `shell`, and `custom` client boot patterns
- `demo/chunked-csr`: focused reference for route-level CSR chunking through `.van-stack/routes.generated.ts` and `startClientApp({ routes })`, including a `/shell-workbench/overview` control-plane route built from `layout.ts` plus a pathless `@sidebar` slot
- `demo/ssr-blog`: focused reference for SSR blog routes, slug loaders, and bootstrap handoff
- `demo/ssg-site`: focused reference for static generation from route entries, raw `route.ts` outputs, and exported asset trees that can be served by generic web servers; run `bun ./demo/ssg-site/build.ts` to write `demo/ssg-site/dist/`
- `demo/adaptive-nav`: focused reference for `replace` vs `stack` presentation
- `demo/third-party-compat`: focused reference for libraries that import `vanjs-core` and `vanjs-ext` directly, rendered through `van-stack/vite` in CSR, `van-stack/compat/node-register` in Node SSR and SSG, and `compat/bun-tsconfig.json` in Bun SSR and SSG

## Docs

- [Getting Started](./docs/getting-started.md)
- [Route Conventions](./docs/route-conventions.md)
- [Loaders And Actions](./docs/loaders-and-actions.md)
- [Hydration Modes](./docs/hydration-modes.md)
- [Shared Components](./docs/shared-components.md)
- [Bun Runtime](./docs/bun.md)
- [Adaptive Navigation](./docs/adaptive-navigation.md)
- [Optional Vite Integration](./docs/vite.md)
- [Demos](./docs/demos.md)
