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

  test("does not keep the settled current page on a forced GPU layer", () => {
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
    const baseViewRule = css.match(/\[data-van-stack-view\] \{([^}]*)\}/)?.[1];
    expect(baseViewRule).not.toContain("backface-visibility: hidden;");
    expect(css).toContain(
      ".van-stack-page-current {\n  position: relative;\n  z-index: 2;\n  pointer-events: auto;\n  transform: none;",
    );
    expect(css).toContain(
      ".van-stack-transition [data-van-stack-view],\n.van-stack-swipe-active [data-van-stack-view] {\n  backface-visibility: hidden;",
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

  test("suppresses horizontal viewport overscroll when native edges are captured", () => {
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
      "[data-van-stack-native-edge-capture] {\n  overscroll-behavior-x: none;",
    );
  });
});
