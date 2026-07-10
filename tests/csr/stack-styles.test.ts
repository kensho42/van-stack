import { describe, expect, test, vi } from "vitest";

import { ensureStackStyles } from "../../packages/csr/src/stack/styles";

describe("stack presentation styles", () => {
  test("iOS slide transitions both pages during forward pushes", () => {
    const headNodes: Array<{ textContent: string }> = [];

    vi.stubGlobal("document", {
      createElement() {
        return {
          setAttribute: vi.fn(),
          textContent: "",
        };
      },
      head: {
        appendChild(node: { textContent: string }) {
          headNodes.push(node);
        },
      },
      querySelector: vi.fn(() => null),
    });

    try {
      ensureStackStyles();
    } finally {
      vi.unstubAllGlobals();
    }

    expect(headNodes).toHaveLength(1);
    expect(headNodes[0]?.textContent).toContain(
      ".van-stack-transition-ios-slide-forward .van-stack-page-previous",
    );
    expect(headNodes[0]?.textContent).toContain(
      ".van-stack-transition-ios-slide-backward .van-stack-page-next",
    );
  });

  test("keeps the popped page above the returning page during Back", () => {
    const headNodes: Array<{ textContent: string }> = [];

    vi.stubGlobal("document", {
      createElement() {
        return {
          setAttribute: vi.fn(),
          textContent: "",
        };
      },
      head: {
        appendChild(node: { textContent: string }) {
          headNodes.push(node);
        },
      },
      querySelector: vi.fn(() => null),
    });

    try {
      ensureStackStyles();
    } finally {
      vi.unstubAllGlobals();
    }

    const css = headNodes[0]?.textContent ?? "";
    expect(css).toContain(
      ".van-stack-transition-backward .van-stack-page-current {\n  z-index: 1;",
    );
    expect(css).toContain(
      ".van-stack-transition-backward .van-stack-page-next {\n  z-index: 2;",
    );
  });

  test("uses a subtle edge-attached iOS swipe shadow instead of a dark slab", () => {
    const headNodes: Array<{ textContent: string }> = [];

    vi.stubGlobal("document", {
      createElement() {
        return {
          setAttribute: vi.fn(),
          textContent: "",
        };
      },
      head: {
        appendChild(node: { textContent: string }) {
          headNodes.push(node);
        },
      },
      querySelector: vi.fn(() => null),
    });

    try {
      ensureStackStyles();
    } finally {
      vi.unstubAllGlobals();
    }

    const css = headNodes[0]?.textContent ?? "";
    expect(css).toContain("left: -10px;");
    expect(css).toContain("width: 10px;");
    expect(css).toContain("linear-gradient(");
    expect(css).toContain("rgb(0 0 0 / 0%) 0%");
    expect(css).toContain("rgb(0 0 0 / 0%) 45%");
    expect(css).toContain("rgb(0 0 0 / 1%) 75%");
    expect(css).toContain("rgb(0 0 0 / 6%) 100%");
    expect(css).not.toContain("rgb(0 0 0 / 20%) 100%");
    expect(css).not.toContain(
      "background: linear-gradient(to right, rgb(0 0 0 / 18%), transparent);",
    );
  });
});
