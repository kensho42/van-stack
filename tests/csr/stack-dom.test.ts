import { describe, expect, test, vi } from "vitest";

import {
  removeAttribute,
  removeInlineStyle,
  replaceRootChildren,
  setAttribute,
  setInlineStyle,
} from "../../packages/csr/src/stack/dom";

describe("stack DOM helpers", () => {
  test("setAttribute and removeAttribute support real DOM-style attributes", () => {
    const setAttributeSpy = vi.fn();
    const removeAttributeSpy = vi.fn();
    const root = {
      attributes: {},
      removeAttribute: removeAttributeSpy,
      setAttribute: setAttributeSpy,
    };

    expect(() =>
      setAttribute(root as never, "data-van-stack-view", ""),
    ).not.toThrow();
    expect(() => removeAttribute(root as never, "aria-hidden")).not.toThrow();
    expect(setAttributeSpy).toHaveBeenCalledWith("data-van-stack-view", "");
    expect(removeAttributeSpy).toHaveBeenCalledWith("aria-hidden");
  });

  test("replaceRootChildren preserves existing child nodes in the same order", () => {
    const first = {};
    const second = {};
    const replaceChildren = vi.fn();
    const root = {
      children: [first, second],
      replaceChildren,
    };

    replaceRootChildren(root as never, [first, second] as never);
    expect(replaceChildren).not.toHaveBeenCalled();

    replaceRootChildren(root as never, [second, first] as never);
    expect(replaceChildren).toHaveBeenCalledWith(second, first);
  });

  test("setInlineStyle writes CSS custom properties on real DOM style objects", () => {
    const setProperty = vi.fn();
    const removeProperty = vi.fn();
    const root = {
      style: {
        removeProperty,
        setProperty,
      },
    };

    setInlineStyle(root as never, "--van-stack-transition-duration", "320ms");
    removeInlineStyle(root as never, "--van-stack-transition-duration");

    expect(setProperty).toHaveBeenCalledWith(
      "--van-stack-transition-duration",
      "320ms",
    );
    expect(removeProperty).toHaveBeenCalledWith(
      "--van-stack-transition-duration",
    );
  });
});
