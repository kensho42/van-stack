import { expectTypeOf, test } from "vitest";

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
