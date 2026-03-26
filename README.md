# van-stack

`van-stack` is a router-first framework for VanJS with one shared route model across CSR, SSR, and SSG. The default path is filesystem routing from `src/routes`, shared route components through `van-stack/render`, and the same route graph flowing into the runtime you need.

## Install

```bash
bun add van-stack
```

## Start Here

1. Create route modules under `src/routes`.
2. Load them with `loadRoutes({ root: "src/routes" })`.
3. Write shared route components against `van-stack/render`.
4. Pass those routes into `van-stack/csr`, `van-stack/ssr`, or `van-stack/ssg`.

If you want one place to evaluate the full framework before wiring your own app, start with `demo/showcase` and run:

```bash
bun run start
```

## Happy-Path Quick Start

The normal filesystem-routing path looks like this:

```text
src/routes/
  app/
    layout.ts
    @sidebar/
      page.ts
    posts/
      [slug]/
        page.ts
        loader.ts
        meta.ts
```

`@slot` directories are pathless route branches that attach to the nearest owning `layout.ts`. The default branch is still exposed as `children`; named branches are exposed as `slots[name]`, and their resolved data is exposed as `slotData[name]`.

Load the route tree in memory:

```ts
import { loadRoutes } from "van-stack/compiler";

const routes = await loadRoutes({ root: "src/routes" });
```

Write route components against the framework-owned render facade:

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

Add route data and metadata with the reserved route-module files:

```ts
// loader.ts
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

```ts
// meta.ts
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

Choose the runtime handoff you want:

```ts
// CSR shell boot
import { createRouter } from "van-stack/csr";

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
```

```ts
// SSR request rendering
import { renderRequest } from "van-stack/ssr";

const response = await renderRequest({
  request,
  routes,
});
```

```ts
// SSG export
import { exportStaticSite } from "van-stack/ssg";

await exportStaticSite({
  routes,
  outDir: "dist",
  assets: [{ from: "public" }],
});
```

That is the core flow: route files in `src/routes`, `loadRoutes({ root: "src/routes" })`, shared UI via `van-stack/render`, then CSR, SSR, or SSG on top of the same route graph.

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
- `van-stack/compat/vanjs-core`: compatibility facade for code that imports `vanjs-core`
- `van-stack/compat/vanjs-ext`: compatibility facade for code that imports `vanjs-ext`
- `van-stack/compat/bun-preload`: explicit Bun preload guard for unsupported runtime-plugin usage
- `van-stack/compat/node-register`: Node resolver hook that maps `vanjs-core` and `vanjs-ext` through the bound render env

## How It Fits Together

1. Author route modules under `src/routes`.
2. Use `van-stack/compiler` to load those routes into memory with `loadRoutes({ root: "src/routes" })`.
3. Write shared route components against `van-stack/render`.
4. Pass the loaded routes into `van-stack/csr`, `van-stack/ssr`, or `van-stack/ssg`.
5. Add `van-stack/vite` only if you want route-aware DX on top of the compiler layer.

Filesystem routing is the default path, but it is not mandatory. Manual route arrays still work when an app intentionally wants to bypass the compiler.

If a custom build pipeline needs a persisted artifact, the compiler can still write `.van-stack/routes.generated.ts` explicitly:

```ts
import { writeRouteManifest } from "van-stack/compiler";

await writeRouteManifest({ root: "src/routes" });
```

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

The generated manifest is the opt-in chunking path. Apps that bundle everything eagerly can keep using `loadRoutes({ root: "src/routes" })`, while apps that want template-wide chunking can pass `chunkedRoutes` into `buildRouteManifest({ root, chunkedRoutes })` or `writeRouteManifest({ root, chunkedRoutes })`.

## Runtime Model

### CSR Modes

- `hydrated`: web browser starts from SSR HTML, then continues as a client app
- `shell`: app starts from a tiny HTML shell and uses VanStack-owned route loading
- `custom`: app starts from a tiny HTML shell and owns its data loading strategy

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

### Hydration Policies

- `document-only`: SSR HTML only
- `islands`: SSR HTML plus targeted client activation
- `app`: SSR HTML followed by full client-router handoff

For SSR branches using `hydrationPolicy: "app"`, the recommended browser entry is the managed `hydrated` client mode:

```ts
import { loadRoutes } from "van-stack/compiler";
import { startClientApp } from "van-stack/csr";

const routes = await loadRoutes({ root: "src/routes" });

const app = startClientApp({
  mode: "hydrated",
  routes,
  history: window.history,
});

await app.ready;
```

`startClientApp({ mode: "hydrated" })` uses `hydrateApp(...)` as the initial SSR handoff orchestrator. `hydrateApp(...)` reads the bootstrap payload, finds the app root, and then applies the default `app` strategy:

- if the matched route or named slot ships `hydrate.ts`, run that low-level enhance hook against the existing SSR DOM
- otherwise resolve the matched `page.ts` and remounts that branch by default before continuing with router takeover

For SSR branches using `hydrationPolicy: "islands"`, you can hydrate focused route islands without creating a client router:

```ts
import { loadRoutes } from "van-stack/compiler";
import { hydrateIslands } from "van-stack/csr";

const routes = await loadRoutes({ root: "src/routes" });

const hydration = hydrateIslands({ routes });
await hydration.ready;
```

Hydration policy is about how SSR output becomes interactive. CSR mode is about how a client router boots and where data comes from.

### Presentation Modes

- `replace`: browser-style view replacement
- `stack`: mobile-style pushed views

Presentation is separate from route matching and data loading. The same route tree can present as `replace` on desktop and `stack` on mobile or Tauri shells.

## Compatibility And Tooling Notes

Route modules should import Van and VanX through `van-stack/render`, not from concrete client or server packages:

```ts
import { van, vanX } from "van-stack/render";
```

First-party route code should still use `van-stack/render`. Compatibility shims exist for imported packages that hard-import `vanjs-core` or `vanjs-ext` directly:

```ts
import { vanStackVite, getVanStackCompatAliases } from "van-stack/vite";
```

Use `vanStackVite()` for Vite apps, or reuse `getVanStackCompatAliases()` in Vitest and custom Vite configs so those packages resolve through the bound `van-stack/render` environment. For direct Node SSR and SSG entrypoints, start the process with `van-stack/compat/node-register`.

For Bun SSR and SSG entrypoints, run Bun with the shipped compat override:

```bash
bun run --tsconfig-override ./node_modules/van-stack/compat/bun-tsconfig.json ./src/server.ts
```

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

`bunfig.toml` does not currently expose a `tsconfig` override setting, so the supported Bun DX path is a checked-in `tsconfig.bun.json` plus package script aliases. `van-stack/compat/bun-preload` is intentionally unsupported. Bun runtime plugins do not intercept bare package imports during `bun run`, so Bun needs the `tsconfig` override path instead.

Compatibility only works when the resolver hook runs before those third-party modules are evaluated. In practice that means you must bind the render env before module evaluation reaches any imported library that reads `van` or `vanX` eagerly.

## Demos And Docs

- `demo/showcase`: main evaluator demo covering gallery, guided walkthroughs, `ssr`, `ssg`, `hydrated`, `islands`, `shell`, `custom`, and chunked flows
- `demo/chunked-csr`: chunked browser CSR demo using `.van-stack/routes.generated.ts`
- `demo/third-party-compat`: compatibility demo for packages that import `vanjs-core` or `vanjs-ext`
- `docs/getting-started.md`: focused setup and recommended defaults
- `docs/demos.md`: demo index
- `docs/bun.md`: Bun-specific compatibility and workflow guidance
- `demo/adaptive-nav`: focused adaptive navigation demo

For deployable static output, `exportStaticSite(...)` writes HTML pages, raw `route.ts` outputs, and copied asset files/directories into a static tree that generic web servers can serve directly.
