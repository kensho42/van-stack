import { describe, expect, test } from "vitest";

import { bindCompatVan } from "../../packages/core/src/compat/van-env";
import { bindCompatVanX } from "../../packages/core/src/compat/vanx-env";
import { bindServerRenderEnv } from "../../packages/ssr/src/index";

describe("compatibility shims", () => {
  test("exports vanjs-core and vanjs-ext compatibility modules through the root package", async () => {
    bindCompatVan(null);
    bindCompatVanX(null);

    const vanCompatModule = await import(
      "../../packages/core/src/compat/vanjs-core"
    );
    const vanExtCompatModule = await import(
      "../../packages/core/src/compat/vanjs-ext"
    );

    expect(vanCompatModule.default).toBeDefined();
    expect(vanExtCompatModule.reactive).toBeDefined();
  });

  test("forwards the bound server render environment through the compatibility modules", async () => {
    bindCompatVan(null);
    bindCompatVanX(null);
    bindServerRenderEnv();

    const vanCompatModule = await import(
      "../../packages/core/src/compat/vanjs-core"
    );
    const vanExtCompatModule = await import(
      "../../packages/core/src/compat/vanjs-ext"
    );

    expect(typeof vanCompatModule.default.tags.div).toBe("function");
    expect(vanCompatModule.default.state(3).val).toBe(3);
    expect(vanExtCompatModule.reactive({ likes: 1 })).toEqual({ likes: 1 });
    expect(vanExtCompatModule.calc(() => "ok")).toBe("ok");
  });

  test("keeps an explicit unbound compat-env failure through the compatibility modules", async () => {
    bindCompatVan(null);
    bindCompatVanX(null);

    const vanCompatModule = await import(
      "../../packages/core/src/compat/vanjs-core"
    );
    const vanExtCompatModule = await import(
      "../../packages/core/src/compat/vanjs-ext"
    );

    expect(() => vanCompatModule.default.state(0)).toThrowError(
      "van-stack/compat/vanjs-core has not been bound to a Van runtime yet.",
    );
    expect(() => vanExtCompatModule.stateFields({ count: 0 })).toThrowError(
      "van-stack/compat/vanjs-ext has not been bound to a VanX runtime yet.",
    );
  });

  test("keeps server-side hydrate unavailable through the vanjs-core compatibility module", async () => {
    bindServerRenderEnv();

    const vanCompatModule = await import(
      "../../packages/core/src/compat/vanjs-core"
    );

    expect(() =>
      vanCompatModule.default.hydrate({ id: "root" }, (dom: { id: string }) => {
        return dom;
      }),
    ).toThrowError("van.hydrate is unavailable in the current runtime.");
  });

  test("fails fast on the unsupported bun preload path", async () => {
    await expect(
      import("../../packages/core/src/compat/bun-preload"),
    ).rejects.toThrowError(
      "Use `bun run --tsconfig-override ./node_modules/van-stack/compat/bun-tsconfig.json <entry>` instead.",
    );
  });
});
