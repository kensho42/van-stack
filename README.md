# van-stack

`van-stack` is a router-first framework for VanJS with support for CSR, SSR, SSG, and adaptive navigation.

## Install

```bash
bun add van-stack
```

## Why van-stack?

- filesystem routing with simple reserved filenames
- explicit hydration policies: `document-only`, `islands`, `app`
- three CSR runtime modes: `hydrated`, `shell`, `custom`
- SSR and SSG built on the same route model
- adaptive presentation for `replace` and `stack`

## Package overview

- `van-stack`: core route model, matching, hydration policies, and shared render contracts
- `van-stack/render`: framework-owned Van facade for shared route components
- `van-stack/csr`: browser runtime for `hydrated`, `shell`, and `custom` client apps
- `van-stack/ssr`: request-to-HTML rendering with bootstrap payloads
- `van-stack/ssg`: static generation from route entries
- `van-stack/vite`: optional filesystem-route DX adapter

## Runtime modes

- `CSR`: client-driven routing after boot
- `SSR`: request-time HTML rendering
- `SSG`: static HTML generation from route entries

## CSR runtime modes

- `hydrated`: start from SSR HTML and continue with client navigation
- `shell`: boot from a tiny HTML shell and keep using VanStack route modules
- `custom`: boot from a tiny HTML shell and let the host app own data resolution or fetch at component level

## Hydration policies

- `document-only`
- `islands`
- `app`

## Filesystem route example

```text
src/routes/
  posts/
    layout.ts
    [slug]/
      page.ts
      loader.ts
      meta.ts
      error.ts
```

By default, filesystem apps should discover those files from `src/routes` and load runtime routes directly in memory. If you need a persisted artifact for custom build tooling, the compiler can still emit `.van-stack/routes.generated.ts`.

```ts
import { loadRoutes } from "@van-stack/compiler";

const routes = await loadRoutes({ root: "src/routes" });
```

For an explicit generated file:

```ts
import { writeRouteManifest } from "@van-stack/compiler";

await writeRouteManifest({ root: "src/routes" });
```

`loader.ts`

```ts
export default async function loader(input: { params: { slug: string } }) {
  return {
    post: {
      slug: input.params.slug,
      title: `Post: ${input.params.slug}`
    }
  };
}
```

`page.ts`

```ts
import { van } from "van-stack/render";

const { article, h1 } = van.tags;

export default function page(input: {
  data: { post: { title: string; slug: string } };
}) {
  return article(h1(input.data.post.title));
}
```

`meta.ts`

```ts
export default function meta(input: {
  params: { slug: string };
  data: { post: { title: string } };
}) {
  return {
    title: input.data.post.title,
    description: `Read ${input.data.post.title}`,
    canonical: `/posts/${input.params.slug}`,
  };
}
```

## CSR example

`van-stack/csr` now supports three explicit client boot modes.

```ts
import { createRouter } from "van-stack/csr";

const routes = [{ id: "posts/[slug]", path: "/posts/:slug" }];

const shellRouter = createRouter({
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

await shellRouter.load("/posts/agentic-coding-is-the-future");
await shellRouter.navigate("/posts/github-down");
```

In `shell` mode the app boots from a minimal document, then both the first route and later navigations use the transport adapter.

For a host-owned backend such as GraphQL, use `custom` mode instead:

```ts
const customRouter = createRouter({
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

If the app already fetches through component-level hooks or view-local logic, `resolve` is optional in `custom` mode:

```ts
const customRouter = createRouter({
  mode: "custom",
  routes,
  history: window.history,
});
```

In that shape, VanStack owns matching, params, history, and navigation, while the rendered components own their own data fetching.

`hydrated` mode is for SSR handoff. It consumes bootstrap data from `van-stack/ssr`, then uses the same transport pattern for later navigations.

In a filesystem-routing app, `routes` would usually come from `await loadRoutes({ root: "src/routes" })` instead of being handwritten. Persisting `.van-stack/routes.generated.ts` is optional.

Shared route modules should import their Van API from `van-stack/render`:

```ts
import { van } from "van-stack/render";

const { article, h1, p } = van.tags;

export default function page() {
  const taps = van.state(0);

  return article(
    h1("Custom CSR"),
    p(() => `Resolver taps: ${taps.val}`),
  );
}
```

## SSR example

```ts
import { renderRequest } from "van-stack/ssr";

const response = await renderRequest({
  pathname: "/posts/github-down",
  routes: [
    {
      id: "posts/[slug]",
      path: "/posts/:slug",
      hydrationPolicy: "app",
      async loader({ params }) {
        return { post: { slug: params.slug, title: "GitHub Down" } };
      },
      page({ data }) {
        const typedData = data as { post: { title: string } };
        return article(h1(typedData.post.title));
      }
    }
  ]
});
```

`renderRequest` returns HTML with an embedded bootstrap payload so the browser can resume according to the selected hydration policy.

## Hydration modes in practice

- `document-only`: render HTML and stop
- `islands`: render HTML and hydrate only explicit client-activated components
- `app`: render HTML, then hand off to the CSR router for later navigations

Only `app` mode turns canonical links into internal data fetches after the initial load.

Hydration policy and CSR runtime mode are different decisions:

- hydration policy controls how SSR HTML becomes interactive
- CSR runtime mode controls how a client router boots and where route data comes from

## Demos

- `demo/csr`: `hydrated`, `shell`, and `custom` CSR boot patterns
- `demo/ssr-blog`: hydrated SSR blog route with slug loader
- `demo/ssg-site`: static generation example
- `demo/adaptive-nav`: replace-vs-stack presentation example

## Docs

- [Getting Started](./docs/getting-started.md)
- [Route Conventions](./docs/route-conventions.md)
- [Loaders And Actions](./docs/loaders-and-actions.md)
- [Hydration Modes](./docs/hydration-modes.md)
- [Shared Components](./docs/shared-components.md)
- [Adaptive Navigation](./docs/adaptive-navigation.md)
- [Optional Vite Integration](./docs/vite.md)
- [Demos](./docs/demos.md)
