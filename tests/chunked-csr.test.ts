import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import {
  handleChunkedCsrRequest,
  warmChunkedCsrAssets,
} from "../demo/chunked-csr/src/runtime/app";

const demoRoot = "demo/chunked-csr";
const manifestPath = join(demoRoot, ".van-stack", "routes.generated.ts");

async function requestChunkedCsr(path: string) {
  const response = await handleChunkedCsrRequest(
    new Request(`https://example.com${path}`),
  );

  return {
    response,
    html: await response.text(),
  };
}

describe("chunked csr demo", () => {
  test("writes the generated manifest before building client assets", async () => {
    rmSync(manifestPath, { force: true });
    expect(existsSync(manifestPath)).toBe(false);

    const assets = await warmChunkedCsrAssets();

    expect(existsSync(manifestPath)).toBe(true);
    expect(readFileSync(manifestPath, "utf8")).toContain(
      "export const routes = [",
    );
    expect(readFileSync(manifestPath, "utf8")).toContain("chunked: true,");
    expect(readFileSync(manifestPath, "utf8")).toMatch(
      /id: "shell-workbench::sidebar"[\s\S]*?chunked: true,/,
    );
    expect(assets.has("/assets/chunked-csr-hydrated.js")).toBe(true);
    expect(assets.has("/assets/chunked-csr-shell.js")).toBe(true);
    expect(assets.has("/assets/chunked-csr-custom.js")).toBe(true);
  });

  test("serves the emitted shared chunk file", async () => {
    const assets = await warmChunkedCsrAssets();
    const chunkPath = [...assets.keys()].find((path) =>
      path.includes("chunk-"),
    );

    expect(chunkPath).toBeTypeOf("string");
    if (!chunkPath) {
      throw new Error("Chunked CSR build did not emit a shared chunk.");
    }

    const response = await handleChunkedCsrRequest(
      new Request(`https://example.com${chunkPath}`),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("javascript");

    const emittedChunk = assets.get(chunkPath);
    expect(emittedChunk).toBeTypeOf("string");
    expect(await response.text()).toBe(emittedChunk);
  });

  test("renders hydrated, shell, and custom detail pages with matching assets", async () => {
    const hydrated = await requestChunkedCsr("/hydrated/chunked-route");
    const shell = await requestChunkedCsr("/shell/chunked-route");
    const custom = await requestChunkedCsr("/custom/chunked-route");

    expect(hydrated.response.status).toBe(200);
    expect(shell.response.status).toBe(200);
    expect(custom.response.status).toBe(200);

    expect(hydrated.html).toContain("Chunked hydrated detail");
    expect(shell.html).toContain("Chunked shell detail");
    expect(custom.html).toContain("Chunked custom detail");
    expect(hydrated.html).toContain('data-van-stack-app-root=""');
    expect(shell.html).toContain('data-van-stack-app-root=""');
    expect(custom.html).toContain('data-van-stack-app-root=""');
    expect(hydrated.html).toContain("data-van-stack-bootstrap");
    expect(shell.html).not.toContain("data-van-stack-bootstrap");
    expect(custom.html).not.toContain("data-van-stack-bootstrap");
    expect(hydrated.html).toContain("/assets/chunked-csr-hydrated.js");
    expect(shell.html).toContain("/assets/chunked-csr-shell.js");
    expect(custom.html).toContain("/assets/chunked-csr-custom.js");
    expect(hydrated.html).toContain("Shared detail copy");
    expect(shell.html).toContain("Shared detail copy");
    expect(custom.html).toContain("Shared detail copy");
    expect(hydrated.html).toContain("Increment remount counter");
    expect(hydrated.html).toContain("default remount");
    expect(hydrated.html).not.toContain("Hydration marker is active.");
  });

  test("renders the landing route without a client shell", async () => {
    const { response, html } = await requestChunkedCsr("/");

    expect(response.status).toBe(200);
    expect(html).toContain("Chunked CSR demo");
    expect(html).toContain("/hydrated/chunked-route");
    expect(html).toContain("/shell/chunked-route");
    expect(html).toContain("/custom/chunked-route");
    expect(html).not.toContain("data-van-stack-bootstrap");
    expect(html).not.toContain('data-van-stack-app-root=""');
    expect(html).not.toContain("/assets/chunked-csr-hydrated.js");
  });
});
