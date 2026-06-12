import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { type Alias, build, createServer } from "vite";
import { afterEach, describe, expect, test } from "vitest";

import { vanStackVite } from "../../packages/vite/src/index";

const repoRoot = realpathSync(fileURLToPath(new URL("../..", import.meta.url)));
const require = createRequire(import.meta.url);
const tempDirs: string[] = [];

type GlobalKey =
  | "document"
  | "Event"
  | "fetch"
  | "history"
  | "MutationObserver"
  | "Text"
  | "window";

type TextLike = {
  isConnected: boolean;
  nodeType: number;
  parentNode: ElementLike | null;
  remove: () => void;
  textContent: string;
};

type ElementLike = {
  addEventListener: () => void;
  append: (...children: unknown[]) => void;
  appendChild: (child: unknown) => unknown;
  attributes: Map<string, string>;
  childNodes: Array<ElementLike | TextLike>;
  children: Array<ElementLike | TextLike>;
  firstChild: ElementLike | TextLike | null;
  getAttribute: (name: string) => string | null;
  innerHTML: string;
  insertBefore: (child: ElementLike | TextLike, before: unknown) => unknown;
  isConnected: boolean;
  lastChild: ElementLike | TextLike | null;
  nodeType: number;
  parentNode: ElementLike | null;
  querySelector: (selector: string) => ElementLike | null;
  relList: { supports: () => boolean };
  remove: () => void;
  removeChild: (child: ElementLike | TextLike) => void;
  removeEventListener: () => void;
  replaceChildren: (...children: unknown[]) => void;
  replaceWith: (child: ElementLike | TextLike | null) => void;
  setAttribute: (name: string, value: string) => void;
  tagName: string;
  textContent: string;
};

function createTempApp() {
  const appRoot = mkdtempSync(
    join(realpathSync(tmpdir()), "van-stack-vite-routes-"),
  );
  tempDirs.push(appRoot);

  return {
    appRoot,
    write(relativePath: string, contents: string) {
      const filePath = join(appRoot, relativePath);
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, contents);
      return filePath;
    },
  };
}

function getSourceAliases(): Alias[] {
  return [
    {
      find: "van-stack/render",
      replacement: join(repoRoot, "packages/core/src/render.ts"),
    },
    {
      find: "van-stack/csr",
      replacement: join(repoRoot, "packages/csr/src/index.ts"),
    },
    {
      find: "van-stack",
      replacement: join(repoRoot, "packages/core/src/index.ts"),
    },
    {
      find: "third-party-lib",
      replacement: join(repoRoot, "packages/third-party-lib/src/index.ts"),
    },
  ];
}

function createTextNode(value: unknown): TextLike {
  const node: TextLike = {
    nodeType: 3,
    textContent: String(value),
    parentNode: null,
    isConnected: true,
    remove() {
      node.parentNode?.removeChild(node);
    },
  };

  Object.setPrototypeOf(node, null);

  return node;
}

function isElementLike(value: unknown): value is ElementLike {
  return Boolean(value && typeof value === "object" && "tagName" in value);
}

function renderElement(node: ElementLike): string {
  const attributes = [...node.attributes.entries()]
    .map(([name, value]) => ` ${name}="${value}"`)
    .join("");

  return `<${node.tagName.toLowerCase()}${attributes}>${node.textContent}</${node.tagName.toLowerCase()}>`;
}

function createElementNode(tagName: string): ElementLike {
  const node: ElementLike = {
    nodeType: 1,
    tagName: tagName.toUpperCase(),
    attributes: new Map<string, string>(),
    children: [],
    childNodes: [],
    parentNode: null,
    isConnected: true,
    relList: {
      supports() {
        return false;
      },
    },
    get firstChild() {
      return node.children[0] ?? null;
    },
    get lastChild() {
      return node.children.at(-1) ?? null;
    },
    get textContent() {
      return node.children
        .map((child) =>
          isElementLike(child) ? child.textContent : child.textContent,
        )
        .join("");
    },
    set textContent(value: string) {
      node.replaceChildren(String(value));
    },
    get innerHTML() {
      return node.children
        .map((child) =>
          isElementLike(child) ? renderElement(child) : child.textContent,
        )
        .join("");
    },
    set innerHTML(value: string) {
      node.replaceChildren(String(value));
    },
    append(...children: unknown[]) {
      for (const child of children.flat(Number.POSITIVE_INFINITY)) {
        if (child === null || child === undefined) {
          continue;
        }

        const childNode =
          isElementLike(child) ||
          (typeof child === "object" && "nodeType" in child)
            ? (child as ElementLike | TextLike)
            : createTextNode(child);
        childNode.parentNode = node;
        node.children.push(childNode);
      }
      node.childNodes = node.children;
    },
    appendChild(child: unknown) {
      node.append(child);
      return child;
    },
    replaceChildren(...children: unknown[]) {
      node.children = [];
      node.childNodes = node.children;
      node.append(...children);
    },
    setAttribute(name: string, value: string) {
      node.attributes.set(name, value);
    },
    getAttribute(name: string) {
      return node.attributes.get(name) ?? null;
    },
    querySelector(selector: string) {
      if (selector === "title" && node.tagName === "TITLE") {
        return node;
      }

      for (const child of node.children) {
        if (!isElementLike(child)) {
          continue;
        }

        const match = child.querySelector(selector);
        if (match) {
          return match;
        }
      }

      return null;
    },
    insertBefore(child: ElementLike | TextLike, before: unknown) {
      const index = node.children.indexOf(before as ElementLike | TextLike);
      child.parentNode = node;
      if (index >= 0) {
        node.children.splice(index, 0, child);
      } else {
        node.children.push(child);
      }
      node.childNodes = node.children;
      return child;
    },
    removeChild(child: ElementLike | TextLike) {
      const index = node.children.indexOf(child);
      if (index >= 0) {
        node.children.splice(index, 1);
      }
      child.parentNode = null;
      node.childNodes = node.children;
    },
    remove() {
      node.parentNode?.removeChild(node);
    },
    replaceWith(child: ElementLike | TextLike | null) {
      if (!node.parentNode) {
        return;
      }
      if (!child) {
        node.remove();
        return;
      }
      const index = node.parentNode.children.indexOf(node);
      if (index >= 0) {
        child.parentNode = node.parentNode;
        node.parentNode.children[index] = child;
      }
      node.parentNode = null;
    },
    addEventListener() {},
    removeEventListener() {},
  };

  return node;
}

function installBrowserGlobals(root: ElementLike) {
  const globals = globalThis as Record<GlobalKey, unknown>;
  const previous = new Map<GlobalKey, unknown>();
  for (const key of [
    "document",
    "Event",
    "fetch",
    "history",
    "MutationObserver",
    "Text",
    "window",
  ] as const) {
    previous.set(key, globals[key]);
  }

  const head = createElementNode("head");
  const history = {
    pushState() {},
  };
  const document = {
    title: "",
    head,
    createElement(tagName: string) {
      return createElementNode(tagName);
    },
    createElementNS(_namespace: string, tagName: string) {
      return createElementNode(tagName);
    },
    querySelector(selector: string) {
      if (selector === "[data-van-stack-app-root]") {
        return root;
      }
      return null;
    },
    querySelectorAll() {
      return [];
    },
    getElementsByTagName() {
      return [];
    },
    addEventListener() {},
    removeEventListener() {},
  };
  const window = {
    location: {
      origin: "http://localhost",
      pathname: "/",
      search: "",
    },
    history,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return true;
    },
  };

  globals.document = document;
  globals.window = window;
  globals.history = history;
  globals.Text = class TextNode {
    nodeType = 3;
    textContent: string;
    parentNode: ElementLike | null = null;
    isConnected = true;
    constructor(value: unknown) {
      this.textContent = String(value);
    }
    remove() {
      this.parentNode?.removeChild(this as unknown as TextLike);
    }
  };
  globals.MutationObserver = class MutationObserver {
    observe() {}
  };
  globals.Event = class Event {
    cancelable: boolean | undefined;
    defaultPrevented = false;
    payload: unknown;
    type: string;
    constructor(type: string, init?: { cancelable?: boolean }) {
      this.type = type;
      this.cancelable = init?.cancelable;
    }
  };
  globals.fetch = async () => ({});

  return () => {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete globals[key];
      } else {
        globals[key] = value;
      }
    }
  };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("van-stack/vite virtual routes", () => {
  test("builds and runs a browser-safe CSR app from the official virtual route module", async () => {
    const app = createTempApp();
    app.write("package.json", JSON.stringify({ type: "module" }));
    app.write(
      "index.html",
      '<div data-van-stack-app-root></div><script type="module" src="/src/main.ts"></script>',
    );
    app.write(
      "src/main.ts",
      [
        'import routes from "virtual:van-stack/routes";',
        'import { startClientApp } from "van-stack/csr";',
        "",
        "const app = startClientApp({",
        '  mode: "custom",',
        "  routes,",
        "  history: window.history,",
        "});",
        "",
        "await app.ready;",
      ].join("\n"),
    );
    app.write(
      "src/routes/page.ts",
      [
        'import { van } from "van-stack/render";',
        'import { readThirdPartyCompatSnapshot } from "third-party-lib";',
        "",
        "const { main } = van.tags;",
        "",
        "export default function page() {",
        "  const snapshot = readThirdPartyCompatSnapshot();",
        '  return main("Vite CSR root route. Third-party " + snapshot.state.val + ": " + snapshot.reactive.title);',
        "}",
      ].join("\n"),
    );
    app.write(
      "src/routes/loader.ts",
      'import { resolve } from "node:path";\nexport default () => resolve(".");\n',
    );
    app.write(
      "src/routes/route.ts",
      'import { resolve } from "node:path";\nexport default () => new Response(resolve("."));\n',
    );
    app.write(
      "src/routes/action.ts",
      'import { resolve } from "node:path";\nexport default () => resolve(".");\n',
    );
    app.write(
      "src/routes/entries.ts",
      'import { resolve } from "node:path";\nexport default () => [{ path: resolve(".") }];\n',
    );

    await build({
      root: app.appRoot,
      configFile: false,
      logLevel: "silent",
      plugins: [vanStackVite({ routes: { root: "src/routes" } })],
      resolve: {
        alias: getSourceAliases(),
      },
      build: {
        outDir: join(app.appRoot, "dist"),
        emptyOutDir: true,
        minify: false,
      },
    });

    const assetsDir = join(app.appRoot, "dist", "assets");
    const bundleCode = readdirSync(assetsDir)
      .filter((file) => file.endsWith(".js"))
      .map((file) => readFileSync(join(assetsDir, file), "utf8"))
      .join("\n");

    expect(bundleCode).not.toContain(".van-stack/routes.generated.ts");
    expect(bundleCode).not.toContain("van-stack/compiler");
    expect(bundleCode).not.toContain("node:path");
    expect(bundleCode).not.toContain("as const");

    const html = readFileSync(join(app.appRoot, "dist", "index.html"), "utf8");
    const entryMatch = /src="\/([^"]+\.js)"/.exec(html);
    expect(entryMatch?.[1]).toBeTruthy();

    const root = createElementNode("div");
    const restoreGlobals = installBrowserGlobals(root);
    try {
      await import(
        `${pathToFileURL(join(app.appRoot, "dist", entryMatch?.[1] ?? "")).href}?test=${Date.now()}`
      );
    } finally {
      restoreGlobals();
    }

    expect(root.textContent).toContain("Vite CSR root route");
    expect(root.textContent).toContain("Third-party 2: Compat Fixture");
  });

  test("does not use broad aliases for VanStack runtime dependencies", async () => {
    const app = createTempApp();
    const server = await createServer({
      root: app.appRoot,
      configFile: false,
      logLevel: "silent",
      plugins: [vanStackVite()],
    });

    try {
      const broadAliases = server.config.resolve.alias.filter(
        (alias) =>
          typeof alias.find === "string" &&
          (alias.find === "vanjs-core" || alias.find === "vanjs-ext"),
      );
      expect(broadAliases).toEqual([]);

      const actualVanXImporter = require.resolve("actual-vanjs-ext");
      const actualVanCore = await server.pluginContainer.resolveId(
        "vanjs-core",
        actualVanXImporter,
      );
      expect(actualVanCore?.id).not.toContain(
        "packages/core/src/compat/vanjs-core",
      );

      const thirdPartyVanCore = await server.pluginContainer.resolveId(
        "vanjs-core",
        join(repoRoot, "packages/third-party-lib/src/index.ts"),
      );
      expect(thirdPartyVanCore?.id).toContain(
        "packages/core/src/compat/vanjs-core",
      );
    } finally {
      await server.close();
    }
  });

  test("throws a configuration error when the virtual route module is imported without route options", async () => {
    const app = createTempApp();
    const server = await createServer({
      root: app.appRoot,
      configFile: false,
      logLevel: "silent",
      plugins: [vanStackVite()],
    });

    try {
      await expect(
        server.ssrLoadModule("virtual:van-stack/routes"),
      ).rejects.toThrow('vanStackVite({ routes: { root: "src/routes" } })');
    } finally {
      await server.close();
    }
  });
});
