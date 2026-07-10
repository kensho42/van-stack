# van-stack

`van-stack` is a router-first framework for VanJS with one shared route model across CSR, SSR, and SSG. The default path is filesystem routing from `src/routes`, route components written against official Van packages, and the same route graph flowing into the runtime you need.

## Install

```bash
bun add van-stack
```

## Start Here

1. Create route modules under `src/routes`.
2. Load them with `loadRoutes({ root: "src/routes" })` in Node/build/server code, or `virtual:van-stack/routes` in Vite browser CSR.
3. Write route components with official Van imports such as `vanjs-core` and optional `vanjs-ext`.
4. Pass those routes into `van-stack/csr`, `van-stack/ssr`, or `van-stack/ssg`.

If you want one place to evaluate the full framework before wiring your own app, start with `demo/showcase` and run:

```bash
bun run start
```

## Happy-Path Quick Start

The normal filesystem-routing path looks like this:

```text
src/routes/
  (public)/
    layout.ts
    login/
      page.ts
  (private)/
    layout.ts
    dashboard/
      page.ts
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

Parenthesized directories such as `(public)` and `(private)` are pathless route groups. Their names stay in route IDs, their `layout.ts` files wrap descendants, and they do not appear in public URLs. For example, `src/routes/(public)/login/page.ts` matches `/login`. Route groups separate route concerns; they do not add authorization by themselves. VanStack rejects duplicate public route patterns, so `(public)/login` and `(private)/login` cannot both claim `/login`.

`@slot` directories are pathless route branches that attach to the nearest owning `layout.ts`. The default branch is still exposed as `children`; named branches are exposed as `slots[name]`, and their resolved data is exposed as `slotData[name]`.

Load the route tree in memory from Node, build, SSR, SSG, or custom tooling:

```ts
import { loadRoutes } from "van-stack/compiler";

const routes = await loadRoutes({ root: "src/routes" });
```

Write route components against the official Van package so the same `page.ts` can run in CSR, SSR, and SSG:

```ts
// src/routes/posts/[slug]/page.ts
import van from "vanjs-core";

const { article, h1, p } = van.tags;

export default function page(input: {
  data: {
    post: { title: string; excerpt: string };
  };
  params: { slug: string };
  query: URLSearchParams;
  path: string;
  pathname: string;
}) {
  const view = input.query.get("view") ?? "summary";

  return article(
    h1(input.data.post.title),
    p(input.data.post.excerpt),
    p(`Route ${input.params.slug} is showing ${view}.`),
  );
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

For a Vite browser CSR entry, let `van-stack/vite` run the compiler during dev/build and import the browser-safe route module:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { vanStackVite } from "van-stack/vite";

export default defineConfig({
  plugins: [vanStackVite({ routes: { root: "src/routes" } })],
});
```

```ts
/// <reference types="van-stack/vite/client" />
import routes from "virtual:van-stack/routes";
import { startClientApp } from "van-stack/csr";

const app = startClientApp({
  mode: "custom",
  routes,
  history: window.history,
});

await app.ready;
```

`startClientApp(...)` and `hydrateApp(...)` manage browser scroll on client navigations by default:

```ts
scroll: {
  onNavigate: "top",
  onPopState: "preserve",
  behavior: "auto",
}
```

Stack presentation applies that policy as part of the transition handoff. A
pushed route is rendered at its target scroll position from the first frame,
and popping restores the retained route's saved scroll position before the
backward transition begins.

Managed CSR apps also expose history-aware back navigation on `app.router`. Use
`await app.router.back({ fallback: "/posts" })` for app back links: VanStack calls
browser history when there is an in-app entry to pop, otherwise it navigates to
the fallback path. `app.router.canGoBack()` reports whether an in-app history
entry is currently available.

Apps can observe router position with `app.router.getNavigationState()` and
`app.router.subscribeNavigationState(listener)`. The subscription calls the
listener immediately and then reports final route state for base routers:

```ts
const unsubscribe = app.router.subscribeNavigationState((state) => {
  state.canGoBack;
  state.current;
  state.previous;
  state.stackDepth;
  state.transition.phase;
  state.progress;
});
```

Idle state uses `phase: "idle"`, `direction: "none"`, `progress: 1`, and matching
`from`/`to` snapshots. Stack presentation reports richer stack state, including
`previous`, stack depth, and live `phase: "gesture"` progress during edge
swipe-back. Push/pop CSS transitions may report only start and final state.

Choose the runtime handoff you want:

```ts
// CSR shell boot
import { createRouter } from "van-stack/csr/router";

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

`createRouter(...)` stays runtime-agnostic. Apps that wire links and `popstate` manually also own their scroll behavior.
Direct routers expose the same `router.back({ fallback })` and `router.canGoBack()` surface, but fallback navigation is still only route loading plus history updates. Use `van-stack/csr` for managed CSR app startup. Use `van-stack/csr/router` only when your app owns navigation wiring and rendering and needs the lower-level router APIs directly.

```ts
// SSR request rendering
import { renderRequest } from "van-stack/ssr";

const response = await renderRequest({
  request,
  routes,
});
```

```ts
// SSR server wiring
import { createServer } from "node:http";
import { renderRequest } from "van-stack/ssr";

const port = Number(process.env.PORT ?? "3000");

createServer(async (req, res) => {
  const request = new Request(`http://${req.headers.host}${req.url ?? "/"}`, {
    method: req.method,
    headers: req.headers as Record<string, string>,
  });
  const response = await renderRequest({ request, routes });

  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(port);
```

```ts
// SSR with Cloudflare Workers
import { loadRoutes } from "van-stack/compiler";
import { renderRequest } from "van-stack/ssr";

const routes = await loadRoutes({ root: "src/routes" });

export default {
  async fetch(request: Request): Promise<Response> {
    return renderRequest({
      request,
      routes,
    });
  },
};
```

```ts
// SSR with Express
import express from "express";
import { renderRequest } from "van-stack/ssr";

const app = express();
const port = Number(process.env.PORT ?? "3000");

app.use(async (req, res) => {
  const request = new Request(`${req.protocol}://${req.get("host")}${req.originalUrl}`, {
    method: req.method,
    headers: req.headers as Record<string, string>,
  });
  const response = await renderRequest({ request, routes });

  res.status(response.status);
  response.headers.forEach((value, name) => {
    res.setHeader(name, value);
  });
  res.send(Buffer.from(await response.arrayBuffer()));
});

app.listen(port);
```

`van-stack/ssr` renders a `Request` into a `Response`, but it does not create a server or choose a listen port. The app-owned server entrypoint is responsible for calling `listen(...)`, usually from `process.env.PORT`.

```ts
// SSG export
import { exportStaticSite } from "van-stack/ssg";

await exportStaticSite({
  routes,
  outDir: "dist",
  assets: [{ from: "public" }],
});
```

That is the core flow: route files in `src/routes`, shared UI via official Van imports, route loading through the compiler or Vite virtual module, then CSR, SSR, or SSG on top of the same route graph.

## Why van-stack?

- filesystem routing with reserved route-module filenames
- one route model across CSR, SSR, and SSG
- official `vanjs-core` and optional `vanjs-ext` imports for route components
- three CSR runtime modes: `hydrated`, `shell`, and `custom`
- explicit hydration policies: `document-only`, `islands`, and `app`
- adaptive navigation with `replace` and `stack`
- optional Vite integration instead of Vite-coupled architecture

## Package Surface

- `van-stack`: core route model, matching, types, defaults
- `van-stack/compiler`: filesystem route discovery, in-memory route loading, optional manifest writing
- `van-stack/csr`: client router for `hydrated`, `shell`, and `custom`
- `van-stack/ssr`: request-to-HTML rendering with bootstrap payloads
- `van-stack/ssg`: static generation from the same route graph
- `van-stack/vite`: optional browser CSR route adapter for `virtual:van-stack/routes`
- `van-stack/compat/vanjs-core`: SSR/SSG compatibility module for packages that import `vanjs-core`
- `van-stack/compat/vanjs-ext`: SSR/SSG compatibility module for packages that import `vanjs-ext`
- `van-stack/compat/bun-tsconfig.json`: Bun SSR/SSG resolver override for third-party Van packages
- `van-stack/compat/bun-preload`: explicit Bun preload guard for unsupported runtime-plugin usage
- `van-stack/compat/node-register`: Node SSR/SSG resolver hook that maps `vanjs-core` and `vanjs-ext` to server/static-safe compat modules

## How It Fits Together

1. Author route modules under `src/routes`.
2. Use `van-stack/compiler` to load those routes in Node/build/server code with `loadRoutes({ root: "src/routes" })`, or use `vanStackVite({ routes: { root: "src/routes" } })` plus `virtual:van-stack/routes` in Vite browser CSR.
3. Write route components against `vanjs-core`, and import `vanjs-ext` directly when VanX helpers are needed.
4. Pass the loaded routes into `van-stack/csr`, `van-stack/ssr`, or `van-stack/ssg`.
5. Add `van-stack/vite` only if you want route-aware browser CSR DX on top of the compiler layer.

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
  scroll: {
    onNavigate: "top",
    onPopState: "preserve",
    behavior: "auto",
  },
});

await app.ready;
```

The generated manifest is the opt-in artifact and chunking path. Node, SSR, SSG, and build tooling can keep using `loadRoutes({ root: "src/routes" })`; Vite browser CSR apps should use `virtual:van-stack/routes`; apps that want template-wide emitted chunk metadata can pass `chunkedRoutes` into `buildRouteManifest({ root, chunkedRoutes })` or `writeRouteManifest({ root, chunkedRoutes })`.

## Runtime Model

### CSR Modes

- `hydrated`: web browser starts from SSR HTML, then continues as a client app
- `shell`: app starts from a tiny HTML shell and uses VanStack-owned route loading
- `custom`: app starts from a tiny HTML shell and owns its data loading strategy

Resolver-driven `custom` mode:

```ts
import { createRouter } from "van-stack/csr/router";

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

In `custom` mode without a resolver, route components still receive the matched route context:

```ts
// src/routes/new-esim/[iccid]/page.ts
import van from "vanjs-core";

const { article, h1, p } = van.tags;

export default function page(input: {
  params: { iccid: string };
  query: URLSearchParams;
  path: string;
  pathname: string;
  data: unknown;
}) {
  const step = input.query.get("step") ?? "start";

  return article(
    h1(`eSIM ${input.params.iccid}`),
    p(`Current step: ${step}`),
    p(`Matched path: ${input.pathname}`),
  );
}
```

### Hydration Policies

- `document-only`: SSR HTML only
- `islands`: SSR HTML plus targeted client activation
- `app`: SSR HTML followed by full client-router handoff

For SSR branches using `hydrationPolicy: "app"`, the recommended browser entry is the managed `hydrated` client mode:

```ts
/// <reference types="van-stack/vite/client" />
import routes from "virtual:van-stack/routes";
import { startClientApp } from "van-stack/csr";

const app = startClientApp({
  mode: "hydrated",
  routes,
  history: window.history,
});

await app.ready;
```

The managed CSR entrypoints scroll new client navigations to the top and preserve browser back/forward scroll by default. Override `scroll` when an app shell needs a different policy, for example `scroll: { onNavigate: "preserve" }` for a persistent workspace.

`startClientApp({ mode: "hydrated" })` uses `hydrateApp(...)` as the initial SSR handoff orchestrator. `hydrateApp(...)` reads the bootstrap payload, finds the app root, and then applies the default `app` strategy:

- if the matched route or named slot ships `hydrate.ts`, run that low-level enhance hook against the existing SSR DOM
- otherwise resolve the matched `page.ts` and remounts that branch by default before continuing with router takeover

For SSR branches using `hydrationPolicy: "islands"`, you can hydrate focused route islands without creating a client router:

```ts
/// <reference types="van-stack/vite/client" />
import routes from "virtual:van-stack/routes";
import { hydrateIslands } from "van-stack/csr";

const hydration = hydrateIslands({ routes });
await hydration.ready;
```

Hydration policy is about how SSR output becomes interactive. CSR mode is about how a client router boots and where data comes from.

### Presentation Modes

- `replace`: browser-style view replacement
- `stack`: mobile-style pushed views

Presentation is separate from route matching and data loading. The same route tree can present as `replace` on desktop and `stack` on mobile or Tauri shells.

Stack presentation is opt-in so replace-only apps do not import the stack engine:

```ts
import { startClientApp } from "van-stack/csr";
import { stackPresentation } from "van-stack/csr/stack";

const app = startClientApp({
  mode: "shell",
  routes,
  history: window.history,
  presentation: stackPresentation({
    platform: "auto",
    retention: "previous",
    swipeBack: { captureNativeEdges: true, enabled: "auto" },
    transition: "platform",
  }),
});
```

Route-level `navigation.ts` files can provide default stack behavior:

```ts
// src/routes/posts/[slug]/navigation.ts
export default {
  enter: "push",
  retention: "previous",
  swipeBack: true,
  transition: "ios-slide",
  up: "/posts",
};
```

Stack presentation keeps the full in-session route stack internally, while `retention` controls how many views stay mounted in the DOM. The default is `previous`, which keeps the current view plus the immediate previous view so Framework7-style transitions and edge swipe-back can reveal the page underneath. Use `retention: "current"` to prune inactive DOM aggressively, or `retention: "all"` when an app wants every pushed view to remain mounted.

Native-app shells can set `swipeBack.captureNativeEdges: true`. VanStack then listens on the document viewport instead of only the route root, so swipes beginning over persistent headers or tab bars join the same gesture. It also consumes both screen edges when no previous stack entry exists and applies `overscroll-behavior-x: none` as a supplementary browser guard. Edge controls keep normal tap behavior; VanStack defers cancellation for interactive targets until the touch moves horizontally beyond normal finger jitter. This is opt-in because browser-style sites may need to preserve the browser's own history gestures, and browser chrome can still override web-content cancellation on some iOS browsers.

The stack engine also owns managed scroll timing during transitions. It honors
the `startClientApp({ scroll })` policy while keeping outgoing and incoming
views visually stable at their independent scroll positions. While mounted, it
temporarily sets native history scroll restoration to `manual`; disposing the
presentation restores the browser's previous setting.

Direct visits such as `/posts/1` render the active route as a single leaf view. The stack is built from in-app navigation history, not inferred from route ancestry. In this release stack presentation is available for `shell` and `custom` CSR apps; hydrated stack handoff is intentionally left for a follow-up.

Stack apps can wire route-level back links through `await app.router.back({ fallback: "/posts" })`. It pops the browser and stack history when an in-session page exists, then uses the route's fallback path for direct visits.

## Compatibility And Tooling Notes

Route modules should import Van through the official Van packages:

```ts
// src/routes/index/page.ts
import van from "vanjs-core";
```

VanX helpers use the official extension package directly:

```ts
import * as vanX from "vanjs-ext";
```

Compatibility shims are SSR/SSG-only. They exist for server and static entrypoints that import first-party route modules or third-party packages which import `vanjs-core` or `vanjs-ext` directly, where the browser Van packages do not match the server/static runtime environment.

Browser CSR does not use VanStack compatibility aliases. It imports the real browser `vanjs-core`, and packages that need VanX should import `vanjs-ext` directly.

If shared code must branch on browser-only behavior, check for `window`, not `document`. SSR/SSG may provide a minimal server `document` so official Van tags can render safely.

For the default Node `loadRoutes({ root })` path, VanStack installs the Node resolver hook before route module factories are evaluated. For direct route imports or custom generated-manifest entrypoints, start the process with `van-stack/compat/node-register`.

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

Compatibility only works when the resolver hook runs before those third-party modules are evaluated. In practice that means SSR and SSG entrypoints must install the hook before module evaluation reaches any imported library that reads Van eagerly.

## Demos And Docs

- `demo/showcase`: main evaluator demo covering gallery, guided walkthroughs, `ssr`, `ssg`, `hydrated`, `islands`, `shell`, `custom`, and chunked flows
- `demo/chunked-csr`: chunked browser CSR demo using `.van-stack/routes.generated.ts`
- `demo/third-party-compat`: SSR/SSG compatibility demo for packages that import `vanjs-core` or `vanjs-ext`
- `docs/getting-started.md`: focused setup and recommended defaults
- `docs/demos.md`: demo index
- `docs/bun.md`: Bun-specific compatibility and workflow guidance
- `demo/adaptive-nav`: focused adaptive navigation demo

For deployable static output, `exportStaticSite(...)` writes HTML pages, raw `route.ts` outputs, and copied asset files/directories into a static tree that generic web servers can serve directly.
