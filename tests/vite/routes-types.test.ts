import type routes from "virtual:van-stack/routes";
import { expectTypeOf, test } from "vitest";

import type { RuntimeRouteDefinition } from "../../packages/core/src/index";
import type {} from "../../packages/vite/src/client";

test("virtual Vite routes are typed as readonly runtime route definitions", () => {
  expectTypeOf<typeof routes>().toMatchTypeOf<
    readonly RuntimeRouteDefinition[]
  >();
});
