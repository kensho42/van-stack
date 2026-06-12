import { expectTypeOf, test } from "vitest";

import type { RuntimeRouteDefinition } from "../../packages/core/src/index";
import type { StartClientAppOptions } from "../../packages/csr/src/index";

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
