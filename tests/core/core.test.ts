import { describe, expect, test } from "vitest";

import {
  createInternalDataPath,
  createRouteId,
  csrModes,
  defaultHydrationPolicy,
  defaultPresentationMode,
  internalDataBasePath,
} from "../../packages/core/src/index";
import {
  bindRenderEnv,
  getRenderEnv,
  van,
} from "../../packages/core/src/render";
import { bindClientRenderEnv } from "../../packages/csr/src/index";
import { bindStaticRenderEnv } from "../../packages/ssg/src/index";
import { bindServerRenderEnv } from "../../packages/ssr/src/index";

describe("core primitives", () => {
  test("derives a stable route id from a filesystem route directory", () => {
    expect(createRouteId(["posts", "[slug]"])).toBe("posts/[slug]");
  });

  test("builds the reserved internal data path from a canonical pathname", () => {
    expect(createInternalDataPath("/posts/github-down")).toBe(
      "/_van-stack/data/posts/github-down",
    );
  });

  test("exposes the default runtime policies", () => {
    expect(defaultHydrationPolicy).toBe("app");
    expect(defaultPresentationMode).toBe("replace");
  });

  test("exposes the supported CSR runtime modes", () => {
    expect(csrModes).toEqual(["hydrated", "shell", "custom"]);
    expect(internalDataBasePath).toBe("/_van-stack/data");
  });

  test("throws if the render facade is used before a runtime binds it", () => {
    bindRenderEnv(null);

    expect(() => van.state(0)).toThrowError(
      "van-stack/render has not been bound to a Van runtime yet.",
    );
  });

  test("forwards the shared Van API after binding", () => {
    const hydrate = (
      dom: { id: string },
      fn: (dom: { id: string }) => string,
    ) => fn(dom);
    const fakeVan = {
      tags: {
        div: (...children: unknown[]) => ({
          tag: "div",
          children,
        }),
      },
      state(value: number) {
        return { val: value };
      },
      derive(fn: () => string) {
        return fn();
      },
      add(..._args: unknown[]) {},
      hydrate,
    };

    bindRenderEnv(fakeVan);

    expect(getRenderEnv()).toBe(fakeVan);
    expect(van.tags.div("hello")).toEqual({
      tag: "div",
      children: ["hello"],
    });
    expect(van.state(2)).toEqual({ val: 2 });
    expect(van.derive(() => "ready")).toBe("ready");
    expect(van.hydrate({ id: "root" }, (dom: { id: string }) => dom.id)).toBe(
      "root",
    );
  });

  test("allows CSR and SSR runtimes to bind concrete Van implementations", () => {
    bindRenderEnv(null);

    const clientVan = bindClientRenderEnv();
    expect(getRenderEnv()).toBe(clientVan);
    expect(typeof clientVan.tags.div).toBe("function");
    expect(typeof clientVan.state).toBe("function");
    expect(typeof clientVan.hydrate).toBe("function");

    const serverVan = bindServerRenderEnv();
    expect(getRenderEnv()).toBe(serverVan);
    expect(typeof serverVan.tags.div).toBe("function");
    expect(typeof serverVan.state).toBe("function");
    expect(typeof serverVan.hydrate).toBe("function");

    const staticVan = bindStaticRenderEnv();
    expect(staticVan).toBe(serverVan);
    expect(getRenderEnv()).toBe(serverVan);
  });
});
