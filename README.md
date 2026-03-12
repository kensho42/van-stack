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

Route modules should import Van through the framework facade, not from concrete client or server packages:

```ts
import { van } from "van-stack/render";

const { button, div, p } = van.tags;

export default function page() {
  const count = van.state(0);

  return div(
    button(
      {
        onclick: () => {
          count.val += 1;
        },
      },
      "Increment",
    ),
    p(() => `Count: ${count.val}`),
  );
}
```

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

### `van-stack/ssr`

SSR consumes the same route graph and returns HTML plus bootstrap state:

```ts
import { loadRoutes } from "van-stack/compiler";
import { renderRequest } from "van-stack/ssr";

const routes = await loadRoutes({ root: "src/routes" });

const response = await renderRequest({
  pathname: "/posts/github-down",
  routes,
});

console.log(response.status);
console.log(response.html);
```

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

Hydration policy is about how SSR output becomes interactive. CSR mode is about how a client router boots and where data comes from.

### Presentation Modes

- `replace`: browser-style view replacement
- `stack`: mobile-style pushed views

Presentation is separate from route matching and data loading. The same route tree can present as `replace` on desktop and `stack` on mobile or Tauri shells.

## Demos

- `demo/csr`: `hydrated`, `shell`, and `custom` client boot patterns
- `demo/ssr-blog`: SSR blog route with slug loader and bootstrap handoff
- `demo/ssg-site`: static generation from route entries
- `demo/adaptive-nav`: `replace` vs `stack` presentation

## Docs

- [Getting Started](./docs/getting-started.md)
- [Route Conventions](./docs/route-conventions.md)
- [Loaders And Actions](./docs/loaders-and-actions.md)
- [Hydration Modes](./docs/hydration-modes.md)
- [Shared Components](./docs/shared-components.md)
- [Adaptive Navigation](./docs/adaptive-navigation.md)
- [Optional Vite Integration](./docs/vite.md)
- [Demos](./docs/demos.md)
