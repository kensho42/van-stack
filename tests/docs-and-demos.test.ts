import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const requiredDocs = [
  "docs/getting-started.md",
  "docs/loaders-and-actions.md",
  "docs/hydration-modes.md",
  "docs/shared-components.md",
  "docs/adaptive-navigation.md",
  "docs/vite.md",
  "docs/route-conventions.md",
  "docs/demos.md",
];

const requiredDemos = [
  "demo/csr/hydrated/src/routes/index/page.ts",
  "demo/csr/shell/src/routes/index/page.ts",
  "demo/csr/custom/src/routes/index/page.ts",
  "demo/ssr-blog/src/routes/posts/[slug]/page.ts",
  "demo/ssr-blog/src/routes/posts/[slug]/loader.ts",
  "demo/ssg-site/src/routes/index/page.ts",
  "demo/adaptive-nav/src/routes/index/layout.ts",
];

describe("docs and demos", () => {
  test("ships the planned docs", () => {
    for (const file of requiredDocs) {
      expect(existsSync(file)).toBe(true);
    }
  });

  test("ships the focused demo entry files", () => {
    for (const file of requiredDemos) {
      expect(existsSync(file)).toBe(true);
    }
  });

  test("explains the package layout in the root readme", () => {
    const readme = readFileSync("README.md", "utf8");

    expect(readme).toContain("van-stack");
    expect(readme).toContain("CSR");
    expect(readme).toContain("SSR");
    expect(readme).toContain("SSG");
    expect(readme).toContain("hydrated");
    expect(readme).toContain("shell");
    expect(readme).toContain("custom");
    expect(readme).toContain("src/routes");
    expect(readme).toContain("loadRoutes");
    expect(readme).toContain(".van-stack/routes.generated.ts");
    expect(readme).toContain("van-stack/render");
  });

  test("distinguishes hydration policy from CSR runtime mode", () => {
    const gettingStarted = readFileSync("docs/getting-started.md", "utf8");
    const hydrationModes = readFileSync("docs/hydration-modes.md", "utf8");

    expect(gettingStarted).toContain("hydrated");
    expect(gettingStarted).toContain("shell");
    expect(gettingStarted).toContain("custom");
    expect(hydrationModes).toContain("Hydration policy");
    expect(hydrationModes).toContain("CSR runtime mode");
  });

  test("documents the updated demos for SSR, shell-first CSR, and custom CSR", () => {
    const demos = readFileSync("docs/demos.md", "utf8");
    const csrDemo = readFileSync("demo/csr/README.md", "utf8");
    const ssrDemo = readFileSync("demo/ssr-blog/README.md", "utf8");

    expect(demos).toContain("hydrated");
    expect(demos).toContain("shell");
    expect(demos).toContain("custom");
    expect(csrDemo).toContain("hydrated");
    expect(csrDemo).toContain("shell");
    expect(csrDemo).toContain("custom");
    expect(ssrDemo).toContain("hydrated");
  });

  test("documents route autoloading and keeps Vite optional", () => {
    const gettingStarted = readFileSync("docs/getting-started.md", "utf8");
    const routeConventions = readFileSync("docs/route-conventions.md", "utf8");
    const vite = readFileSync("docs/vite.md", "utf8");
    const csrDemo = readFileSync("demo/csr/README.md", "utf8");

    expect(gettingStarted).toContain("loadRoutes");
    expect(gettingStarted).toContain(".van-stack/routes.generated.ts");
    expect(routeConventions).toContain("src/routes");
    expect(routeConventions).toContain(".van-stack/routes.generated.ts");
    expect(vite).toContain("optional");
    expect(vite).toContain("route discovery");
    expect(csrDemo).toContain(".van-stack/routes.generated.ts");
  });

  test("documents the framework-owned render facade", () => {
    const readme = readFileSync("README.md", "utf8");
    const sharedComponents = readFileSync("docs/shared-components.md", "utf8");
    const demos = readFileSync("docs/demos.md", "utf8");

    expect(readme).toContain("van-stack/render");
    expect(sharedComponents).toContain("van-stack/render");
    expect(sharedComponents).toContain("bindRenderEnv");
    expect(demos).toContain("hydrated");
    expect(demos).toContain("van-stack/render");
  });

  test("uses the shared render facade in demo route files", () => {
    const demoFiles = [
      "demo/csr/hydrated/src/routes/index/page.ts",
      "demo/csr/shell/src/routes/index/page.ts",
      "demo/csr/custom/src/routes/index/page.ts",
      "demo/ssr-blog/src/routes/posts/[slug]/page.ts",
      "demo/ssg-site/src/routes/index/page.ts",
      "demo/adaptive-nav/src/routes/index/layout.ts",
    ];

    for (const file of demoFiles) {
      const source = readFileSync(file, "utf8");

      expect(source).toContain('from "van-stack/render"');
      expect(source).toContain("van.tags");
      expect(source).not.toContain('return "<');
      expect(source).not.toContain("return `<");
    }
  });
});
