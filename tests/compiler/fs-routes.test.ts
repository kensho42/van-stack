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
      "/src/routes/posts/[slug]/loader.ts",
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
          loader: "/src/routes/posts/[slug]/loader.ts",
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
        layoutChain: [],
        params: [],
      },
    ]);
  });

  test("discovers reserved route files under src/routes", async () => {
    const app = createTempApp();

    const layoutPath = app.write("src/routes/posts/layout.ts");
    const pagePath = app.write("src/routes/posts/[slug]/page.ts");
    const loaderPath = app.write("src/routes/posts/[slug]/loader.ts");
    const metaPath = app.write("src/routes/posts/[slug]/meta.ts");
    app.write("src/routes/posts/[slug]/notes.md", "# helper");
    app.write(
      "src/routes/posts/[slug]/_components/card.ts",
      "export const x = 1;",
    );

    const discovered = await discoverRoutes({ root: app.routesRoot });

    expect(discovered).toEqual([layoutPath, loaderPath, metaPath, pagePath]);

    expect(
      compileRoutesFromPaths(discovered, { root: app.routesRoot }),
    ).toEqual([
      {
        id: "posts/[slug]",
        path: "/posts/:slug",
        directorySegments: ["posts", "[slug]"],
        files: {
          page: pagePath,
          loader: loaderPath,
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
    app.write("src/routes/posts/[slug]/loader.ts");
    app.write("src/routes/posts/[slug]/meta.ts");

    const manifest = await buildRouteManifest({ root: app.routesRoot });

    expect(manifest.routes).toHaveLength(1);
    expect(manifest.code).toContain("export const routes = [");
    expect(manifest.code).toContain('id: "posts/[slug]"');
    expect(manifest.code).toContain(
      'page: () => import("../src/routes/posts/[slug]/page.ts")',
    );
    expect(manifest.code).toContain(
      'loader: () => import("../src/routes/posts/[slug]/loader.ts")',
    );
    expect(manifest.code).toContain(
      'meta: () => import("../src/routes/posts/[slug]/meta.ts")',
    );
    expect(manifest.code).toContain(
      'layoutChain: [() => import("../src/routes/posts/layout.ts")]',
    );
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
      "src/routes/posts/[slug]/loader.ts",
      "export default async function loader() { return { ok: true }; }\n",
    );

    const routes = await loadRoutes({ root: app.routesRoot });

    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      id: "posts/[slug]",
      path: "/posts/:slug",
    });
    expect(typeof routes[0]?.files.page).toBe("function");
    expect(typeof routes[0]?.files.loader).toBe("function");
    expect(routes[0]?.layoutChain).toHaveLength(1);
    expect(
      existsSync(join(app.appRoot, ".van-stack", "routes.generated.ts")),
    ).toBe(false);
  });
});
