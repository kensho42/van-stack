import { describe, expect, test } from "vitest";

import { bindRenderEnv } from "../../packages/core/src/render";
import { bindServerRenderEnv } from "../../packages/ssr/src/index";

describe("compatibility shims", () => {
  test("exports vanjs-core and vanjs-ext compatibility modules through the root package", async () => {
    bindRenderEnv(null);

    const vanCompatModule = await import("van-stack/compat/vanjs-core");
    const vanExtCompatModule = await import("van-stack/compat/vanjs-ext");

    expect(vanCompatModule.default).toBeDefined();
    expect(vanExtCompatModule.reactive).toBeDefined();
  });

  test("forwards the bound render environment through the compatibility modules", async () => {
    const fakeVan = {
      tags: {
        div: (...children: unknown[]) => ({ tag: "div", children }),
      },
      state(value: number) {
        return { val: value };
      },
      derive(fn: () => string) {
        return fn();
      },
      add(..._args: unknown[]) {},
      hydrate<T>(dom: T, fn: (dom: T) => T) {
        return fn(dom);
      },
    };
    const fakeVanX = {
      calc(fn: () => string) {
        return fn();
      },
      reactive<T>(value: T) {
        return value;
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
    };
    bindRenderEnv({
      van: fakeVan,
      vanX: fakeVanX,
    });

    const vanCompatModule = await import("van-stack/compat/vanjs-core");
    const vanExtCompatModule = await import("van-stack/compat/vanjs-ext");

    expect(vanCompatModule.default.tags.div("child")).toEqual({
      tag: "div",
      children: ["child"],
    });
    expect(vanCompatModule.default.state(3)).toEqual({ val: 3 });
    expect(vanExtCompatModule.reactive({ likes: 1 })).toEqual({ likes: 1 });
    expect(vanExtCompatModule.calc(() => "ok")).toBe("ok");
  });

  test("keeps the existing unbound render-env failure through the compatibility modules", async () => {
    bindRenderEnv(null);

    const vanCompatModule = await import("van-stack/compat/vanjs-core");
    const vanExtCompatModule = await import("van-stack/compat/vanjs-ext");

    expect(() => vanCompatModule.default.state(0)).toThrowError(
      "van-stack/render has not been bound to a Van runtime yet.",
    );
    expect(() => vanExtCompatModule.stateFields({ count: 0 })).toThrowError(
      "van-stack/render has not been bound to a Van runtime yet.",
    );
  });

  test("keeps server-side hydrate unavailable through the vanjs-core compatibility module", async () => {
    bindServerRenderEnv();

    const vanCompatModule = await import("van-stack/compat/vanjs-core");

    expect(() =>
      vanCompatModule.default.hydrate({ id: "root" }, (dom: { id: string }) => {
        return dom;
      }),
    ).toThrowError("van.hydrate is unavailable in the current runtime.");
  });
});
