import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const requiredDocs = [
  "README.md",
  "docs/bun.md",
  "docs/demos.md",
  "demo/showcase/README.md",
  "demo/csr/README.md",
  "demo/chunked-csr/README.md",
  "demo/ssr-blog/README.md",
  "demo/ssg-site/README.md",
  "demo/adaptive-nav/README.md",
  "demo/third-party-compat/README.md",
] as const;

const requiredShowcaseFiles = [
  "demo/showcase/src/runtime/app.ts",
  "demo/showcase/src/routes/index/page.ts",
  "demo/showcase/src/routes/gallery/index/page.ts",
  "demo/showcase/src/routes/walkthrough/index/page.ts",
] as const;

const requiredCompatDemoFiles = [
  "demo/third-party-compat/src/routes/csr/page.ts",
  "demo/third-party-compat/src/routes/ssr/page.ts",
  "demo/third-party-compat/src/routes/ssg/page.ts",
  "demo/third-party-compat/tsconfig.bun.json.example",
] as const;

const requiredSsgDemoFiles = ["demo/ssg-site/build.ts"] as const;

describe("docs and demos", () => {
  test("ships the showcase docs and entry files", () => {
    for (const file of [
      ...requiredDocs,
      ...requiredShowcaseFiles,
      ...requiredCompatDemoFiles,
      ...requiredSsgDemoFiles,
    ]) {
      expect(existsSync(file)).toBe(true);
    }
  });

  test("exposes a root start script for the runnable showcase", () => {
    const rootPackage = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(rootPackage.scripts?.start).toBeTruthy();
  });

  test("positions the showcase as the main evaluator demo from the root readme", () => {
    const readme = readFileSync("README.md", "utf8");

    expect(readme).toContain("demo/showcase");
    expect(readme).toContain("demo/third-party-compat");
    expect(readme).toContain("bun run start");
    expect(readme).toContain("van-stack/vite");
    expect(readme).toContain("compat/bun-tsconfig.json");
    expect(readme).toContain("tsconfig.bun.json");
    expect(readme).toContain("bunfig.toml");
    expect(readme).toContain("docs/bun.md");
    expect(readme).toContain("van-stack/compat/node-register");
    expect(readme).toContain("exportStaticSite");
    expect(readme).toContain("generic web servers");
    expect(readme).toContain("bind the render env before module evaluation");
    expect(readme).toContain("ssg");
    expect(readme).toContain("ssr");
    expect(readme).toContain("hydrated");
    expect(readme).toContain("islands");
    expect(readme).toContain("shell");
    expect(readme).toContain("custom");
    expect(readme).toContain("demo/adaptive-nav");
    expect(readme).not.toMatch(/demo\/showcase[\s\S]{0,160}adaptive/i);
  });

  test("describes the showcase as a blog app with gallery, walkthrough, and adaptive tracks", () => {
    const showcaseReadme = readFileSync("demo/showcase/README.md", "utf8");

    expect(showcaseReadme).toContain("bun run start");
    expect(showcaseReadme).toContain("Runtime Gallery");
    expect(showcaseReadme).toContain("Guided Walkthrough");
    expect(showcaseReadme).toContain("Adaptive Navigation");
    expect(showcaseReadme).toContain("ssg");
    expect(showcaseReadme).toContain("ssr");
    expect(showcaseReadme).toContain("hydrated");
    expect(showcaseReadme).toContain("islands");
    expect(showcaseReadme).toContain("shell");
    expect(showcaseReadme).toContain("custom");
    expect(showcaseReadme).toContain("chunked");
  });

  test("keeps adaptive navigation documented as a separate focused demo", () => {
    const demos = readFileSync("docs/demos.md", "utf8");
    const bunDoc = readFileSync("docs/bun.md", "utf8");
    const gettingStarted = readFileSync("docs/getting-started.md", "utf8");
    const ssgReadme = readFileSync("demo/ssg-site/README.md", "utf8");
    const chunkedCsrReadme = readFileSync("demo/chunked-csr/README.md", "utf8");
    const adaptiveNavReadme = readFileSync(
      "demo/adaptive-nav/README.md",
      "utf8",
    );
    const compatReadme = readFileSync(
      "demo/third-party-compat/README.md",
      "utf8",
    );
    const csrPage = readFileSync(
      "demo/third-party-compat/src/routes/csr/page.ts",
      "utf8",
    );
    const ssrPage = readFileSync(
      "demo/third-party-compat/src/routes/ssr/page.ts",
      "utf8",
    );
    const ssgPage = readFileSync(
      "demo/third-party-compat/src/routes/ssg/page.ts",
      "utf8",
    );

    expect(demos).toContain("demo/showcase");
    expect(demos).toContain("demo/adaptive-nav");
    expect(demos).toContain("demo/chunked-csr");
    expect(demos).toContain("demo/third-party-compat");
    expect(demos).toContain("third-party");
    expect(demos).toContain("chunked");
    expect(demos).toContain("ssg");
    expect(demos).toContain("ssr");
    expect(demos).toContain("hydrated");
    expect(demos).toContain("islands");
    expect(demos).toContain("shell");
    expect(demos).toContain("custom");
    expect(demos).toContain("chunked");
    expect(demos).not.toMatch(/demo\/showcase[\s\S]{0,160}adaptive/i);
    expect(bunDoc).toContain("tsconfig.bun.json");
    expect(bunDoc).toContain("compat/bun-tsconfig.json");
    expect(bunDoc).toContain("bunfig.toml");
    expect(bunDoc).toContain("van-stack/compiler");
    expect(bunDoc).toContain("van-stack/ssr");
    expect(bunDoc).toContain("van-stack/ssg");
    expect(bunDoc).toContain("van-stack/vite");
    expect(bunDoc).toContain("exportStaticSite");
    expect(bunDoc).toContain("any web server");
    expect(gettingStarted).toContain("exportStaticSite");
    expect(gettingStarted).toContain("route.ts");
    expect(gettingStarted).toContain("startClientApp");
    expect(gettingStarted).toContain(".van-stack/routes.generated.ts");
    expect(chunkedCsrReadme).toContain(".van-stack/routes.generated.ts");
    expect(chunkedCsrReadme).toContain("startClientApp");
    expect(ssgReadme).toContain("exportStaticSite");
    expect(ssgReadme).toContain("route.ts");
    expect(ssgReadme).toContain("generic web server");
    expect(ssgReadme).toContain("bun ./demo/ssg-site/build.ts");
    expect(ssgReadme).toContain("dist/");
    expect(adaptiveNavReadme).toContain("adaptive");
    expect(compatReadme).toContain("third-party");
    expect(compatReadme).toContain("vanjs-core");
    expect(compatReadme).toContain("vanjs-ext");
    expect(compatReadme).toContain("van-stack/vite");
    expect(compatReadme).toContain("compat/bun-tsconfig.json");
    expect(compatReadme).toContain("tsconfig.bun.json");
    expect(compatReadme).toContain("bunfig.toml");
    expect(compatReadme).toContain("van-stack/compat/node-register");
    expect(csrPage).toContain('from "third-party-lib"');
    expect(csrPage).not.toContain("van-stack/render");
    expect(ssrPage).toContain('from "third-party-lib"');
    expect(ssrPage).not.toContain("van-stack/render");
    expect(ssgPage).toContain('from "third-party-lib"');
    expect(ssgPage).not.toContain("van-stack/render");
  });
});
