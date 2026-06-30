import type { AppRootLike } from "../route-render";

export type StackViewRoot = AppRootLike & {
  addEventListener?: (
    type: string,
    listener: (event: StackPointerEventLike) => unknown,
    options?: unknown,
  ) => void;
  appendChild?: (child: unknown) => unknown;
  attributes?: Map<string, string>;
  children?: unknown[];
  classList?: {
    add: (...names: string[]) => void;
    remove: (...names: string[]) => void;
  };
  getBoundingClientRect?: () => { left?: number; width?: number };
  innerHTML?: string;
  remove?: () => void;
  removeAttribute?: (name: string) => void;
  removeEventListener?: (
    type: string,
    listener: (event: StackPointerEventLike) => unknown,
    options?: unknown,
  ) => void;
  render?: () => string;
  setAttribute?: (name: string, value: string) => void;
  style?: Record<string, string | number | undefined> & {
    removeProperty?: (name: string) => void;
  };
  tagName?: string;
};

export type StackPointerEventLike = {
  clientX?: number;
  clientY?: number;
  pageX?: number;
  pageY?: number;
  pointerId?: number;
  preventDefault?: () => void;
  target?: unknown;
  targetTouches?: ArrayLike<{ pageX: number; pageY: number }>;
  timeStamp?: number;
  type?: string;
};

function escapeAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function renderChildToHtml(child: unknown): string {
  if (typeof child === "string") {
    return child;
  }

  if (
    child &&
    typeof child === "object" &&
    "render" in child &&
    typeof (child as { render: () => string }).render === "function"
  ) {
    return (child as { render: () => string }).render();
  }

  if (
    child &&
    typeof child === "object" &&
    "tagName" in child &&
    "innerHTML" in child
  ) {
    const node = child as StackViewRoot;
    const attributes = node.attributes
      ? [...node.attributes.entries()]
          .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
          .join("")
      : "";

    return `<${node.tagName}${attributes}>${node.innerHTML ?? ""}</${node.tagName}>`;
  }

  return String(child ?? "");
}

function matchesAttributeSelector(node: StackViewRoot, selector: string) {
  const attributeMatch = /^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(selector);
  if (!attributeMatch) {
    return false;
  }

  if (typeof attributeMatch[2] === "undefined") {
    return node.attributes?.has(attributeMatch[1]) ?? false;
  }

  return node.attributes?.get(attributeMatch[1]) === attributeMatch[2];
}

function createSyntheticClassList(node: StackViewRoot) {
  return {
    add(...names: string[]) {
      const classes = new Set(
        (node.attributes?.get("class") ?? "").split(/\s+/).filter(Boolean),
      );
      for (const name of names) {
        classes.add(name);
      }
      node.attributes?.set("class", [...classes].join(" "));
    },
    remove(...names: string[]) {
      const classes = new Set(
        (node.attributes?.get("class") ?? "").split(/\s+/).filter(Boolean),
      );
      for (const name of names) {
        classes.delete(name);
      }
      if (classes.size) {
        node.attributes?.set("class", [...classes].join(" "));
      } else {
        node.attributes?.delete("class");
      }
    },
  };
}

function createSyntheticViewRoot(): StackViewRoot {
  const node: StackViewRoot = {
    tagName: "div",
    attributes: new Map(),
    children: [],
    innerHTML: "",
    style: {},
    append(...children: unknown[]) {
      node.replaceChildren?.(...(node.children ?? []), ...children);
    },
    appendChild(child: unknown) {
      node.append?.(child);
      return child;
    },
    querySelector(selector: string) {
      for (const child of node.children ?? []) {
        if (!child || typeof child !== "object" || !("tagName" in child)) {
          continue;
        }

        const childNode = child as StackViewRoot;
        if (matchesAttributeSelector(childNode, selector)) {
          return childNode;
        }

        const nested = childNode.querySelector?.(selector);
        if (nested) {
          return nested;
        }
      }

      return null;
    },
    removeAttribute(name: string) {
      node.attributes?.delete(name);
    },
    replaceChildren(...children: unknown[]) {
      node.children = children;
      node.innerHTML = children
        .map((child) => renderChildToHtml(child))
        .join("");
    },
    setAttribute(name: string, value: string) {
      node.attributes?.set(name, value);
    },
  };

  node.classList = createSyntheticClassList(node);
  node.render = () => renderChildToHtml(node);
  return node;
}

export function createViewRoot(): StackViewRoot {
  if (
    typeof globalThis.document !== "undefined" &&
    typeof globalThis.document.createElement === "function"
  ) {
    return globalThis.document.createElement("div") as unknown as StackViewRoot;
  }

  return createSyntheticViewRoot();
}

export function setAttribute(root: StackViewRoot, name: string, value: string) {
  root.setAttribute?.(name, value);
  root.attributes?.set(name, value);
}

export function removeAttribute(root: StackViewRoot, name: string) {
  root.removeAttribute?.(name);
  root.attributes?.delete(name);
}

export function addClass(root: StackViewRoot, ...names: string[]) {
  root.classList?.add(...names);
  if (!root.classList && root.attributes) {
    createSyntheticClassList(root).add(...names);
  }
}

export function removeClass(root: StackViewRoot, ...names: string[]) {
  root.classList?.remove(...names);
  if (!root.classList && root.attributes) {
    createSyntheticClassList(root).remove(...names);
  }
}

export function setInlineStyle(
  root: StackViewRoot,
  property: string,
  value: string,
) {
  if (root.style) {
    root.style[property] = value;
    return;
  }

  if (!root.attributes) return;

  const existing = root.attributes.get("style") ?? "";
  const declarations = new Map(
    existing
      .split(";")
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const [name, ...rest] = declaration.split(":");
        return [name.trim(), rest.join(":").trim()] as const;
      }),
  );
  declarations.set(property, value);
  root.attributes.set(
    "style",
    [...declarations.entries()]
      .map(([name, declarationValue]) => `${name}: ${declarationValue}`)
      .join("; "),
  );
}

export function removeInlineStyle(root: StackViewRoot, property: string) {
  if (root.style) {
    root.style.removeProperty?.(property);
    delete root.style[property];
    return;
  }

  if (!root.attributes) return;

  const existing = root.attributes.get("style") ?? "";
  const next = existing
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .filter((declaration) => declaration.split(":")[0]?.trim() !== property);
  if (next.length) {
    root.attributes.set("style", next.join("; "));
  } else {
    root.attributes.delete("style");
  }
}

export function getElementLeft(root: StackViewRoot) {
  return root.getBoundingClientRect?.().left ?? 0;
}

export function getElementWidth(root: StackViewRoot) {
  return root.getBoundingClientRect?.().width ?? 0;
}

export function replaceRootChildren(
  root: StackViewRoot,
  children: StackViewRoot[],
) {
  if (typeof root.replaceChildren === "function") {
    root.replaceChildren(...children);
    return;
  }

  if ("innerHTML" in root) {
    root.innerHTML = children.map((child) => renderChildToHtml(child)).join("");
  }
}
