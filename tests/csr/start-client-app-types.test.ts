import { expectTypeOf, test } from "vitest";

import type {
  RouteDataContext,
  RuntimeRouteDefinition,
} from "../../packages/core/src/index";
import type {
  HydrateAppOptions,
  NavigationScrollOptions,
  StartClientAppOptions,
} from "../../packages/csr/src/index";

test("startClientApp accepts eager and lazy route records", () => {
  const eagerOptions: StartClientAppOptions = {
    mode: "shell",
    history: {
      pushState() {},
    },
    routes: [
      {
        id: "eager",
        path: "/eager",
        page() {
          return "eager";
        },
      },
    ],
  };
  const lazyOptions: StartClientAppOptions = {
    mode: "shell",
    history: {
      pushState() {},
    },
    routes: [
      {
        id: "lazy",
        path: "/lazy",
        files: {
          async page() {
            return {
              default() {
                return "lazy";
              },
            };
          },
        },
      },
    ],
  };

  expectTypeOf(eagerOptions.routes[0]).toMatchTypeOf<
    StartClientAppOptions["routes"][number]
  >();
  expectTypeOf(lazyOptions.routes[0]).toMatchTypeOf<
    StartClientAppOptions["routes"][number]
  >();
});

test("startClientApp accepts readonly generated route arrays", () => {
  const generatedRoutes = [
    {
      id: "generated",
      path: "/generated",
      files: {
        async page() {
          return {
            default() {
              return "generated";
            },
          };
        },
      },
      layoutChain: [],
    },
  ] as const;

  const options: StartClientAppOptions = {
    mode: "custom",
    history: {
      pushState() {},
    },
    routes: generatedRoutes,
  };

  expectTypeOf(generatedRoutes).toMatchTypeOf<
    readonly RuntimeRouteDefinition[]
  >();
  expectTypeOf(options.routes).toMatchTypeOf<
    readonly RuntimeRouteDefinition[]
  >();
});

test("startClientApp accepts navigation scroll options", () => {
  const scroll: NavigationScrollOptions = {
    onNavigate: "top",
    onPopState: "preserve",
    behavior: "instant",
  };
  const options: StartClientAppOptions = {
    mode: "shell",
    history: {
      pushState() {},
    },
    routes: [
      {
        id: "home",
        path: "/",
        page() {
          return "home";
        },
      },
    ],
    scroll,
  };

  expectTypeOf(options.scroll).toMatchTypeOf<
    NavigationScrollOptions | undefined
  >();
});

test("hydrateApp accepts navigation scroll options", () => {
  const options: HydrateAppOptions = {
    routes: [
      {
        id: "home",
        path: "/",
      },
    ],
    scroll: {
      onNavigate: "preserve",
      onPopState: "top",
      behavior: "smooth",
    },
  };

  expectTypeOf(options.scroll).toMatchTypeOf<
    NavigationScrollOptions | undefined
  >();
});

test("route pages can read matched URL context", () => {
  const route = {
    id: "new-esim/[iccid]",
    path: "/new-esim/:iccid",
    page(input) {
      expectTypeOf(input).toMatchTypeOf<RouteDataContext>();

      return [
        input.params.iccid,
        input.query.get("step"),
        input.path,
        input.pathname,
        input.data,
      ].join(":");
    },
  } satisfies RuntimeRouteDefinition;

  expectTypeOf(route).toMatchTypeOf<RuntimeRouteDefinition>();
});
