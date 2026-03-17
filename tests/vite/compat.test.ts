import { describe, expect, test } from "vitest";

import { bindRenderEnv } from "../../packages/core/src/render";

describe("van-stack/vite compatibility integration", () => {
  test("exports a shared alias map for vanjs-core and vanjs-ext", async () => {
    const viteModule = await import("van-stack/vite");

    expect(viteModule.getVanStackCompatAliases).toBeTypeOf("function");
    expect(viteModule.vanStackVite).toBeTypeOf("function");
  });

  test("lets Vitest resolve third-party vanjs-core and vanjs-ext imports through the shared alias map", async () => {
    bindRenderEnv({
      van: {
        tags: {},
        state(value: number) {
          return { val: value, compat: "van" };
        },
        derive(fn: () => unknown) {
          return fn();
        },
        add(..._args: unknown[]) {},
        hydrate<T>(dom: T, fn: (dom: T) => T) {
          return fn(dom);
        },
      },
      vanX: {
        calc(fn: () => unknown) {
          return fn();
        },
        reactive<T extends object>(value: T) {
          return {
            ...value,
            compat: "vanX",
          };
        },
        noreactive<T>(value: T) {
          return value;
        },
        stateFields<T>(value: T) {
          return value;
        },
        raw<T>(value: T) {
          return value;
        },
        list(..._args: unknown[]) {
          return [];
        },
        replace<T>(_value: T, replacement: T) {
          return replacement;
        },
        compact<T>(value: T) {
          return value;
        },
      },
    });

    const fixtureModule = await import("third-party-lib");
    const snapshot = fixtureModule.readThirdPartyCompatSnapshot();

    expect(snapshot.state).toEqual({
      val: 2,
      compat: "van",
    });
    expect(snapshot.reactive).toEqual({
      title: "Compat Fixture",
      compat: "vanX",
    });
  });
});
