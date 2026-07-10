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

  test("replaceRootChildren does not reattach retained nodes when siblings change", () => {
    const first = {};
    const second = {};
    const children = [first];
    const replaceChildren = vi.fn();
    const insertBefore = vi.fn((child: object, reference: object | null) => {
      const existingIndex = children.indexOf(child);
      if (existingIndex >= 0) children.splice(existingIndex, 1);
      const referenceIndex = reference ? children.indexOf(reference) : -1;
      if (referenceIndex >= 0) {
        children.splice(referenceIndex, 0, child);
      } else {
        children.push(child);
      }
    });
    const removeChild = vi.fn((child: object) => {
      const index = children.indexOf(child);
      if (index >= 0) children.splice(index, 1);
    });
    const root = {
      children,
      insertBefore,
      removeChild,
      replaceChildren,
    };

    replaceRootChildren(root as never, [first, second] as never);

    expect(insertBefore).toHaveBeenCalledWith(second, null);
    expect(removeChild).not.toHaveBeenCalled();
    expect(replaceChildren).not.toHaveBeenCalled();
    expect(children).toEqual([first, second]);

    insertBefore.mockClear();
    replaceRootChildren(root as never, [first] as never);

    expect(removeChild).toHaveBeenCalledWith(second);
    expect(insertBefore).not.toHaveBeenCalled();
    expect(replaceChildren).not.toHaveBeenCalled();
    expect(children).toEqual([first]);
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
