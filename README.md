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
2. Use `van-stack/compiler` to load those routes into memory with `loadRoutes({ root: "src/routes" })`.
3. Write shared route components against `van-stack/render`.
4. Pass the loaded routes into `van-stack/csr`, `van-stack/ssr`, or `van-stack/ssg`.
5. Add `van-stack/vite` only if you want route-aware DX on top of the compiler layer.

Filesystem routing is the default path, but it is not mandatory. Manual route arrays still work when an app intentionally wants to bypass the compiler.

## Quick Start

### Route Files

```text
src/routes/
  posts/
    [slug]/
      page.ts
      hydrate.ts
      route.ts
      loader.ts
      meta.ts
```

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
export default async function loader(input: { params: { slug: string } }) {
  return {
    post: {
      slug: input.params.slug,
      title: `Post: ${input.params.slug}`,
      excerpt: `Notes about ${input.params.slug}`,
    },
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

// Optional emitted artifact for custom build tooling.
await writeRouteManifest({ root: "src/routes" });
```

`loadRoutes(...)` is the recommended path. Writing `.van-stack/routes.generated.ts` is optional.

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

### `van-stack/csr`

`van-stack/csr` supports three runtime modes:

- `hydrated`: continue from SSR HTML and bootstrap data
- `shell`: boot from a tiny document and use transport-backed loading
- `custom`: boot from a tiny document and keep data ownership in the host app or in components

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
import { buildStaticRoutes } from "van-stack/ssg";

const routes = await loadRoutes({ root: "src/routes" });
const pages = await buildStaticRoutes({ routes });
```

Routes that participate in SSG should provide `entries.ts` so dynamic params can expand into concrete paths.

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
  - `Runtime Gallery`: live `ssg`, `ssr`, `hydrated`, `islands`, `shell`, and `custom` comparisons against one Northstar Journal blog app
  - `Guided Walkthrough`: annotated evaluator pages that explain those same six modes and link back to the live routes
  - `Adaptive Navigation`: a separate `stack` presentation track over the same blog graph
- `demo/csr`: focused reference for `hydrated`, `shell`, and `custom` client boot patterns
- `demo/ssr-blog`: focused reference for SSR blog routes, slug loaders, and bootstrap handoff
- `demo/ssg-site`: focused reference for static generation from route entries
- `demo/adaptive-nav`: focused reference for `replace` vs `stack` presentation

## Docs

- [Getting Started](./docs/getting-started.md)
- [Route Conventions](./docs/route-conventions.md)
- [Loaders And Actions](./docs/loaders-and-actions.md)
- [Hydration Modes](./docs/hydration-modes.md)
- [Shared Components](./docs/shared-components.md)
- [Adaptive Navigation](./docs/adaptive-navigation.md)
- [Optional Vite Integration](./docs/vite.md)
- [Demos](./docs/demos.md)
