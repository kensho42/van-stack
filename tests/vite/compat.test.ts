import { describe, expect, test } from "vitest";

describe("van-stack/vite compatibility integration", () => {
  test("does not expose CSR Van compatibility helpers", async () => {
    const viteModule = await import("../../packages/vite/src/index");

    expect("getVanStackCompatAliases" in viteModule).toBe(false);
    expect(viteModule.vanStackVite).toBeTypeOf("function");
  });
});
