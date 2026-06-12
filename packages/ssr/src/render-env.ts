import { dummyVanX, registerEnv } from "mini-van-plate/shared";
import vanPlate from "mini-van-plate/van-plate";

import { bindCompatVan, type VanLike } from "../../core/src/compat/van-env";
import { bindCompatVanX } from "../../core/src/compat/vanx-env";

let serverVan: VanLike | null = null;
let serverGlobalsInstallCount = 0;
let previousDocument: unknown;
let previousText: unknown;
let hadPreviousDocument = false;
let hadPreviousText = false;

type ServerGlobal = {
  Text?: unknown;
  document?: unknown;
};

const noChildTags = new Set([
  "area",
  "base",
  "br",
  "col",
  "command",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const noEscapeTags = new Set(["script", "style"]);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

function renderServerChild(child: unknown, parentTag: string): string {
  if (child === null || child === undefined) {
    return "";
  }

  if (child instanceof ServerText) {
    return child.render(parentTag);
  }

  if (child instanceof ServerElement) {
    return child.render();
  }

  if (
    child &&
    typeof child === "object" &&
    "render" in child &&
    typeof (child as { render: () => string }).render === "function"
  ) {
    return (child as { render: () => string }).render();
  }

  const text = String(child);
  return noEscapeTags.has(parentTag) ? text : escapeHtml(text);
}

class ServerText {
  isConnected = true;
  nodeType = 3;

  constructor(public data: unknown) {}

  render(parentTag = "") {
    const text = String(this.data ?? "");
    return noEscapeTags.has(parentTag) ? text : escapeHtml(text);
  }

  remove() {}

  replaceWith() {}

  toString() {
    return this.render();
  }
}

class ServerElement {
  attributes = new Map<string, string>();
  children: unknown[] = [];
  isConnected = true;
  nodeType = 1;

  constructor(public tagName: string) {}

  addEventListener() {}

  append(...children: unknown[]) {
    this.children.push(...children.flat(Infinity));
  }

  get outerHTML() {
    return this.render();
  }

  remove() {}

  removeEventListener() {}

  replaceWith() {}

  setAttribute(name: string, value: unknown) {
    this.attributes.set(name, String(value));
  }

  get textContent() {
    return this.children
      .map((child) => (child instanceof ServerText ? child.data : child))
      .join("");
  }

  set textContent(value: unknown) {
    this.children = [new ServerText(value)];
  }

  render() {
    const tagName = this.tagName.toLowerCase();
    const attributes = [...this.attributes.entries()]
      .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
      .join("");

    if (noChildTags.has(tagName)) {
      return `<${tagName}${attributes}>`;
    }

    return `<${tagName}${attributes}>${this.children
      .map((child) => renderServerChild(child, tagName))
      .join("")}</${tagName}>`;
  }

  toString() {
    return this.render();
  }
}

const serverDocument = {
  nodeType: 9,
  createElement(tagName: string) {
    return new ServerElement(tagName);
  },
  createElementNS(_namespace: string, tagName: string) {
    return new ServerElement(tagName);
  },
};

function createServerVan(): VanLike {
  return {
    ...vanPlate,
    hydrate() {
      throw new Error("van.hydrate is unavailable in the current runtime.");
    },
  };
}

export function installServerRenderGlobals() {
  const serverGlobal = globalThis as unknown as ServerGlobal;

  if (serverGlobalsInstallCount === 0) {
    hadPreviousDocument = "document" in serverGlobal;
    hadPreviousText = "Text" in serverGlobal;
    previousDocument = serverGlobal.document;
    previousText = serverGlobal.Text;

    if (!serverGlobal.document) {
      serverGlobal.document = serverDocument;
    }
    if (!serverGlobal.Text) {
      serverGlobal.Text = ServerText;
    }
  }

  serverGlobalsInstallCount += 1;

  return () => {
    serverGlobalsInstallCount -= 1;
    if (serverGlobalsInstallCount > 0) {
      return;
    }

    if (hadPreviousDocument) {
      serverGlobal.document = previousDocument;
    } else {
      delete serverGlobal.document;
    }

    if (hadPreviousText) {
      serverGlobal.Text = previousText;
    } else {
      delete serverGlobal.Text;
    }
  };
}

export function bindServerRenderEnv() {
  registerEnv({ van: vanPlate, vanX: dummyVanX });
  if (!serverVan) {
    serverVan = createServerVan();
  }
  const van = serverVan;
  bindCompatVan(van);
  bindCompatVanX(dummyVanX);
  return van;
}

export async function withServerRenderEnv<T>(fn: () => T | Promise<T>) {
  bindServerRenderEnv();
  const restoreServerGlobals = installServerRenderGlobals();
  try {
    return await fn();
  } finally {
    restoreServerGlobals();
  }
}
