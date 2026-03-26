import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import {
  buildRouteManifest,
  compileRoutesFromPaths,
  discoverRoutes,
  loadRoutes,
  writeRouteManifest,
} from "../../packages/compiler/src/index";

const tempDirs: string[] = [];

function createTempApp() {
  const appRoot = mkdtempSync(join(tmpdir(), "van-stack-routes-"));
  const routesRoot = join(appRoot, "src", "routes");
  tempDirs.push(appRoot);

  return {
    appRoot,
    routesRoot,
    write(relativePath: string, contents = "export default null;\n") {
      const filePath = join(appRoot, relativePath);
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, contents);
      return filePath;
    },
  };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("filesystem route compiler", () => {
  test("compiles reserved route files into normalized routes", () => {
    const routes = compileRoutesFromPaths([
      "/src/routes/posts/layout.ts",
      "/src/routes/posts/[slug]/page.ts",
      "/src/routes/posts/[slug]/hydrate.ts",
      "/src/routes/posts/[slug]/loader.ts",
      "/src/routes/posts/[slug]/route.ts",
      "/src/routes/posts/[slug]/meta.ts",
      "/src/routes/posts/[slug]/error.ts",
    ]);

    expect(routes).toEqual([
      {
        id: "posts/[slug]",
        path: "/posts/:slug",
        directorySegments: ["posts", "[slug]"],
        files: {
          page: "/src/routes/posts/[slug]/page.ts",
          hydrate: "/src/routes/posts/[slug]/hydrate.ts",
          loader: "/src/routes/posts/[slug]/loader.ts",
          route: "/src/routes/posts/[slug]/route.ts",
          meta: "/src/routes/posts/[slug]/meta.ts",
          error: "/src/routes/posts/[slug]/error.ts",
        },
        layoutChain: ["posts"],
        params: ["slug"],
      },
    ]);
  });

  test("ignores non-reserved helpers and drops route groups from the URL", () => {
    const routes = compileRoutesFromPaths([
      "/src/routes/(marketing)/about/page.ts",
      "/src/routes/posts/layout.ts",
      "/src/routes/(marketing)/about/_components/card.ts",
      "/src/routes/posts/_components/button.ts",
      "/src/routes/posts/index/page.ts",
    ]);

    expect(routes).toEqual([
      {
        id: "(marketing)/about",
        path: "/about",
        directorySegments: ["(marketing)", "about"],
        files: {
          page: "/src/routes/(marketing)/about/page.ts",
        },
        layoutChain: [],
        params: [],
      },
      {
        id: "posts/index",
        path: "/posts",
        directorySegments: ["posts", "index"],
        files: {
          page: "/src/routes/posts/index/page.ts",
        },
        layoutChain: ["posts"],
        params: [],
      },
    ]);
  });

  test("discovers reserved route files under src/routes", async () => {
    const app = createTempApp();

    const layoutPath = app.write("src/routes/posts/layout.ts");
    const pagePath = app.write("src/routes/posts/[slug]/page.ts");
    const hydratePath = app.write("src/routes/posts/[slug]/hydrate.ts");
    const loaderPath = app.write("src/routes/posts/[slug]/loader.ts");
    const routePath = app.write("src/routes/posts/[slug]/route.ts");
    const metaPath = app.write("src/routes/posts/[slug]/meta.ts");
    app.write("src/routes/posts/[slug]/notes.md", "# helper");
    app.write(
      "src/routes/posts/[slug]/_components/card.ts",
      "export const x = 1;",
    );

    const discovered = await discoverRoutes({ root: app.routesRoot });

    expect(discovered).toEqual([
      layoutPath,
      hydratePath,
      loaderPath,
      metaPath,
      pagePath,
      routePath,
    ]);

    expect(
      compileRoutesFromPaths(discovered, { root: app.routesRoot }),
    ).toEqual([
      {
        id: "posts/[slug]",
        path: "/posts/:slug",
        directorySegments: ["posts", "[slug]"],
        files: {
          page: pagePath,
          hydrate: hydratePath,
          loader: loaderPath,
          route: routePath,
          meta: metaPath,
        },
        layoutChain: ["posts"],
        params: ["slug"],
      },
    ]);
  });

  test("builds a JS route manifest with lazy route-module imports", async () => {
    const app = createTempApp();

    app.write("src/routes/posts/layout.ts");
    app.write("src/routes/posts/[slug]/page.ts");
    app.write("src/routes/posts/[slug]/hydrate.ts");
    app.write("src/routes/posts/[slug]/loader.ts");
    app.write("src/routes/posts/[slug]/route.ts");
    app.write("src/routes/posts/[slug]/meta.ts");

    const manifest = await buildRouteManifest({ root: app.routesRoot });

    expect(manifest.routes).toHaveLength(1);
    expect(manifest.code).toContain("export const routes = [");
    expect(manifest.code).toContain('id: "posts/[slug]"');
    expect(manifest.code).toContain(
      'page: () => import("../src/routes/posts/[slug]/page.js")',
    );
    expect(manifest.code).toContain(
      'hydrate: () => import("../src/routes/posts/[slug]/hydrate.js")',
    );
    expect(manifest.code).toContain(
      'loader: () => import("../src/routes/posts/[slug]/loader.js")',
    );
    expect(manifest.code).toContain(
      'route: () => import("../src/routes/posts/[slug]/route.js")',
    );
    expect(manifest.code).toContain(
      'meta: () => import("../src/routes/posts/[slug]/meta.js")',
    );
    expect(manifest.code).toContain(
      'layoutChain: [() => import("../src/routes/posts/layout.js")]',
    );
  });

  test("marks manifest routes as chunked by default and excludes explicit route ids", async () => {
    const app = createTempApp();

    app.write("src/routes/gallery/layout.ts");
    app.write("src/routes/gallery/hydrated/posts/[slug]/page.ts");
    app.write("src/routes/gallery/custom/posts/[slug]/page.ts");

    const manifest = await buildRouteManifest({
      root: app.routesRoot,
      chunkedRoutes: {
        excludeRouteIds: ["gallery/custom/posts/[slug]"],
      },
    });

    expect(
      manifest.routes.find(
        (route) => route.id === "gallery/hydrated/posts/[slug]",
      ),
    ).toMatchObject({
      id: "gallery/hydrated/posts/[slug]",
      chunked: true,
    });
    expect(
      manifest.routes.find(
        (route) => route.id === "gallery/custom/posts/[slug]",
      ),
    ).toMatchObject({
      id: "gallery/custom/posts/[slug]",
      chunked: false,
    });
  });

  test("emits chunked metadata into generated manifest code", async () => {
    const app = createTempApp();

    app.write("src/routes/app/layout.ts");
    app.write("src/routes/app/page.ts");
    app.write("src/routes/app/users/[id]/page.ts");

    const manifest = await buildRouteManifest({
      root: app.routesRoot,
      chunkedRoutes: true,
    });

    expect(manifest.routes).toHaveLength(2);
    expect(manifest.routes.every((route) => route.chunked === true)).toBe(true);
    expect(manifest.code).toContain("chunked: true,");
  });

  test("marks slot branches as chunked or excluded independently", async () => {
    const app = createTempApp();

    app.write("src/routes/app/layout.ts");
    app.write("src/routes/app/page.ts");
    app.write("src/routes/app/@sidebar/page.ts");
    app.write("src/routes/app/@sidebar/users/[id]/page.ts");

    const manifest = await buildRouteManifest({
      root: app.routesRoot,
      chunkedRoutes: {
        excludeRouteIds: ["app::sidebar/users/[id]"],
      },
    });

    expect(manifest.routes[0]?.slots?.sidebar?.[0]).toMatchObject({
      id: "app::sidebar",
      chunked: true,
    });
    expect(manifest.routes[0]?.slots?.sidebar?.[1]).toMatchObject({
      id: "app::sidebar/users/[id]",
      chunked: false,
    });
    expect(manifest.code).toContain('id: "app::sidebar/users/[id]"');
    expect(manifest.code).toContain("chunked: false,");
  });

  test("writes a generated manifest file to .van-stack/routes.generated.ts", async () => {
    const app = createTempApp();

    app.write("src/routes/posts/layout.ts");
    app.write("src/routes/posts/[slug]/page.ts");

    const outFile = await writeRouteManifest({ root: app.routesRoot });

    expect(outFile).toBe(
      join(app.appRoot, ".van-stack", "routes.generated.ts"),
    );
    expect(existsSync(outFile)).toBe(true);
    expect(readFileSync(outFile, "utf8")).toContain('id: "posts/[slug]"');
  });

  test("loads routes in memory without writing a generated manifest file", async () => {
    const app = createTempApp();

    app.write("src/routes/posts/layout.ts");
    app.write(
      "src/routes/posts/[slug]/page.ts",
      "export default function page() { return 'page'; }\n",
    );
    app.write(
      "src/routes/posts/[slug]/hydrate.ts",
      "export default function hydrate() { return null; }\n",
    );
    app.write(
      "src/routes/posts/[slug]/loader.ts",
      "export default async function loader() { return { ok: true }; }\n",
    );

    const routes = await loadRoutes({ root: app.routesRoot });

    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      id: "posts/[slug]",
      path: "/posts/:slug",
    });
    expect(typeof routes[0]?.files?.page).toBe("function");
    expect(typeof routes[0]?.files?.hydrate).toBe("function");
    expect(typeof routes[0]?.files?.loader).toBe("function");
    expect(routes[0]?.layoutChain).toHaveLength(1);
    expect(
      existsSync(join(app.appRoot, ".van-stack", "routes.generated.ts")),
    ).toBe(false);
  });

  test("groups pathless @slot branches under the owning layout route", () => {
    const routes = compileRoutesFromPaths([
      "/src/routes/app/layout.ts",
      "/src/routes/app/page.ts",
      "/src/routes/app/users/[id]/page.ts",
      "/src/routes/app/@sidebar/page.ts",
      "/src/routes/app/@sidebar/users/[id]/page.ts",
      "/src/routes/app/@sidebar/users/[id]/loader.ts",
    ]);

    expect(routes).toEqual([
      {
        id: "app",
        path: "/app",
        directorySegments: ["app"],
        files: {
          page: "/src/routes/app/page.ts",
        },
        layoutChain: ["app"],
        params: [],
        slotOwnerLayout: "app",
        slots: {
          sidebar: [
            {
              id: "app::sidebar",
              slot: "sidebar",
              path: "/app",
              directorySegments: ["app", "@sidebar"],
              files: {
                page: "/src/routes/app/@sidebar/page.ts",
              },
              layoutChain: [],
              params: [],
            },
            {
              id: "app::sidebar/users/[id]",
              slot: "sidebar",
              path: "/app/users/:id",
              directorySegments: ["app", "@sidebar", "users", "[id]"],
              files: {
                page: "/src/routes/app/@sidebar/users/[id]/page.ts",
                loader: "/src/routes/app/@sidebar/users/[id]/loader.ts",
              },
              layoutChain: [],
              params: ["id"],
            },
          ],
        },
      },
      {
        id: "app/users/[id]",
        path: "/app/users/:id",
        directorySegments: ["app", "users", "[id]"],
        files: {
          page: "/src/routes/app/users/[id]/page.ts",
        },
        layoutChain: ["app"],
        params: ["id"],
        slotOwnerLayout: "app",
        slots: {
          sidebar: [
            {
              id: "app::sidebar",
              slot: "sidebar",
              path: "/app",
              directorySegments: ["app", "@sidebar"],
              files: {
                page: "/src/routes/app/@sidebar/page.ts",
              },
              layoutChain: [],
              params: [],
            },
            {
              id: "app::sidebar/users/[id]",
              slot: "sidebar",
              path: "/app/users/:id",
              directorySegments: ["app", "@sidebar", "users", "[id]"],
              files: {
                page: "/src/routes/app/@sidebar/users/[id]/page.ts",
                loader: "/src/routes/app/@sidebar/users/[id]/loader.ts",
              },
              layoutChain: [],
              params: ["id"],
            },
          ],
        },
      },
    ]);
  });

  test("rejects @slot branches without an owning layout", () => {
    expect(() =>
      compileRoutesFromPaths([
        "/src/routes/app/page.ts",
        "/src/routes/app/@sidebar/page.ts",
      ]),
    ).toThrow('Slot directory "@sidebar" requires an owning layout.ts.');
  });

  test("rejects unsupported module kinds inside named slots", () => {
    expect(() =>
      compileRoutesFromPaths([
        "/src/routes/app/layout.ts",
        "/src/routes/app/page.ts",
        "/src/routes/app/@sidebar/meta.ts",
      ]),
    ).toThrow('Named slot "sidebar" cannot define "meta.ts".');
  });

  test("rejects nested slot sets", () => {
    expect(() =>
      compileRoutesFromPaths([
        "/src/routes/app/layout.ts",
        "/src/routes/app/page.ts",
        "/src/routes/app/@sidebar/page.ts",
        "/src/routes/app/@sidebar/users/layout.ts",
        "/src/routes/app/@sidebar/users/@details/page.ts",
      ]),
    ).toThrow('Nested slot directory "@details" is not supported.');
  });

  test("loads slot-aware routes in memory and emits slot loaders in the manifest", async () => {
    const app = createTempApp();

    app.write("src/routes/app/layout.ts");
    app.write("src/routes/app/page.ts");
    app.write("src/routes/app/users/[id]/page.ts");
    app.write("src/routes/app/@sidebar/page.ts");
    app.write("src/routes/app/@sidebar/users/[id]/page.ts");
    app.write("src/routes/app/@sidebar/users/[id]/loader.ts");

    const routes = await loadRoutes({ root: app.routesRoot });
    const manifest = await buildRouteManifest({ root: app.routesRoot });

    expect(routes).toHaveLength(2);
    expect(routes[0]).toMatchObject({
      id: "app",
      path: "/app",
      slotOwnerLayout: "app",
      slotOwnerLayoutIndex: 0,
    });
    expect(routes[0]?.slots?.sidebar).toHaveLength(2);
    expect(typeof routes[0]?.slots?.sidebar?.[0]?.files?.page).toBe("function");
    expect(typeof routes[0]?.slots?.sidebar?.[1]?.files?.loader).toBe(
      "function",
    );
    expect(manifest.code).toContain('slotOwnerLayout: "app"');
    expect(manifest.code).toContain("slotOwnerLayoutIndex: 0");
    expect(manifest.code).toContain("slots: {");
    expect(manifest.code).toContain("sidebar: [");
    expect(manifest.code).toContain('id: "app::sidebar"');
    expect(manifest.code).toContain(
      'page: () => import("../src/routes/app/@sidebar/page.js")',
    );
    expect(manifest.code).toContain("loader: () =>");
    expect(manifest.code).toContain(
      'import("../src/routes/app/@sidebar/users/[id]/loader.js")',
    );
  });
});
