import { describe, expect, test } from "vitest";

import {
  bindCompatVan,
  getCompatVan,
} from "../../packages/core/src/compat/van-env";
import {
  createInternalDataPath,
  createRouteId,
  csrModes,
  defaultHydrationPolicy,
  defaultPresentationMode,
  internalDataBasePath,
} from "../../packages/core/src/index";
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

  test("allows SSR and SSG runtimes to bind the server/static Van compat implementation", () => {
    bindCompatVan(null);

    const serverVan = bindServerRenderEnv();
    expect(getCompatVan()).toBe(serverVan);
    expect(typeof serverVan.tags.div).toBe("function");
    expect(typeof serverVan.state).toBe("function");
    expect(typeof serverVan.hydrate).toBe("function");

    const staticVan = bindStaticRenderEnv();
    expect(staticVan).toBe(serverVan);
    expect(getCompatVan()).toBe(serverVan);
  });
});
