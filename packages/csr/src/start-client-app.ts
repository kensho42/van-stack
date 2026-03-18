import {
  type HistoryLike,
  matchPath,
  type Resolve,
  type RouteModuleLoader,
  type RoutePageModule,
  type Router,
  type RouterEntry,
  type RuntimeRouteDefinition,
  type Transport,
} from "../../core/src/index";
import { van } from "../../core/src/render";
import { hydrateApp } from "./hydrate-app";
import { createRouter, type HeadDocumentLike } from "./router";

type AnchorLike = {
  href: string;
  target?: string | null;
  download?: string | null;
  getAttribute?: (name: string) => string | null;
};

type EventTargetLike = {
  closest?: (selector: string) => AnchorLike | null;
};

type ClickEventLike = {
  altKey?: boolean;
  button?: number;
  ctrlKey?: boolean;
  defaultPrevented?: boolean;
  metaKey?: boolean;
  preventDefault: () => void;
  shiftKey?: boolean;
  target?: EventTargetLike | null;
};

type AppRootLike = {
  innerHTML?: string;
  replaceChildren?: (...children: unknown[]) => void;
};

type ClientDocumentLike = HeadDocumentLike & {
  addEventListener: (
    type: "click",
    handler: (event: ClickEventLike) => unknown,
  ) => void;
  querySelector: (selector: string) => unknown;
  removeEventListener: (
    type: "click",
    handler: (event: ClickEventLike) => unknown,
  ) => void;
};

type WindowLike = {
  location: {
    origin: string;
    pathname: string;
    search: string;
  };
  addEventListener: (type: "popstate", handler: () => unknown) => void;
  removeEventListener: (type: "popstate", handler: () => unknown) => void;
};

type BaseStartClientAppOptions = {
  document?: ClientDocumentLike;
  history?: HistoryLike;
  rootSelector?: string;
  routes: RuntimeRouteDefinition[];
  window?: WindowLike;
};

type StartHydratedClientAppOptions = BaseStartClientAppOptions & {
  bootstrapSelector?: string;
  mode: "hydrated";
  transport?: Transport;
};

type StartShellClientAppOptions = BaseStartClientAppOptions & {
  mode: "shell";
  transport?: Transport;
};

type StartCustomClientAppOptions = BaseStartClientAppOptions & {
  mode: "custom";
  resolve?: Resolve;
};

export type StartClientAppOptions =
  | StartHydratedClientAppOptions
  | StartShellClientAppOptions
  | StartCustomClientAppOptions;

export type StartedClientApp = {
  dispose: () => void;
  ready: Promise<void>;
  router: Router;
};

const defaultRootSelector = "[data-van-stack-app-root]";

function getDocument(document: ClientDocumentLike | undefined) {
  if (document) {
    return document;
  }
  if (typeof globalThis.document !== "undefined") {
    return globalThis.document as unknown as ClientDocumentLike;
  }

  throw new Error(
    "No document was provided and global document is unavailable.",
  );
}

function getWindow(window: WindowLike | undefined) {
  if (window) {
    return window;
  }
  if (typeof globalThis.window !== "undefined") {
    return globalThis.window as unknown as WindowLike;
  }

  throw new Error("No window was provided and global window is unavailable.");
}

function getHistory(history: HistoryLike | undefined) {
  if (history) {
    return history;
  }
  if (typeof globalThis.history !== "undefined") {
    return globalThis.history;
  }

  throw new Error("No history was provided and global history is unavailable.");
}

function normalizePath(path: string) {
  const url = new URL(path, "https://van-stack.local");

  return `${url.pathname}${url.search}`;
}

function getCurrentPath(window: WindowLike) {
  return `${window.location.pathname}${window.location.search}`;
}

function getAppRoot(
  document: ClientDocumentLike,
  selector = defaultRootSelector,
) {
  const root = document.querySelector(selector);

  if (!root) {
    throw new Error(`No app root matched selector "${selector}".`);
  }

  return root as AppRootLike;
}

function getAnchor(event: ClickEventLike) {
  return event.target?.closest?.("a[href]") ?? null;
}

function hasMatchingRoute(routes: RuntimeRouteDefinition[], path: string) {
  const pathname = new URL(path, "https://van-stack.local").pathname;

  return routes.some((route) => Boolean(matchPath(route.path, pathname)));
}

function shouldInterceptNavigation(
  event: ClickEventLike,
  anchor: AnchorLike,
  window: WindowLike,
  routes: RuntimeRouteDefinition[],
) {
  if (event.defaultPrevented) return false;
  if ((event.button ?? 0) !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.download) return false;
  if ((anchor.getAttribute?.("data-van-stack-ignore") ?? null) !== null) {
    return false;
  }

  const url = new URL(anchor.href, window.location.origin);
  if (url.origin !== window.location.origin) return false;

  return hasMatchingRoute(routes, `${url.pathname}${url.search}`);
}

function findMatchedRoute(routes: RuntimeRouteDefinition[], path: string) {
  const pathname = new URL(path, "https://van-stack.local").pathname;

  for (const route of routes) {
    const match = matchPath(route.path, pathname);
    if (!match) {
      continue;
    }

    return {
      params: match.params,
      route,
    };
  }

  throw new Error(`No route matched path: ${path}`);
}

async function resolveRouteModule<T>(
  directValue: T | undefined,
  factory: RouteModuleLoader<T> | undefined,
) {
  if (directValue) return directValue;
  if (!factory) return undefined;

  const module = await factory();
  return module.default;
}

async function applyLayouts(
  body: unknown,
  route: RuntimeRouteDefinition,
  data: unknown,
  params: Record<string, string>,
  path: string,
) {
  let output = body;

  for (const layoutLoader of [...(route.layoutChain ?? [])].reverse()) {
    const module = await layoutLoader();
    output = await module.default({
      children: output,
      data,
      params,
      path,
    });
  }

  return output;
}

function renderOutputToHtml(output: { render: () => string }) {
  return output.render();
}

function mountRouteOutput(root: AppRootLike, output: unknown) {
  if (
    output &&
    typeof output === "object" &&
    "render" in output &&
    typeof output.render === "function"
  ) {
    root.innerHTML = renderOutputToHtml(output as { render: () => string });
    return;
  }

  if (typeof output === "string") {
    root.innerHTML = output;
    return;
  }

  root.replaceChildren?.();
  van.add(root as never, output as never);
}

async function renderEntryToRoot(
  routes: RuntimeRouteDefinition[],
  root: AppRootLike,
  entry: RouterEntry,
) {
  const match = findMatchedRoute(routes, entry.path);
  const page = await resolveRouteModule<RoutePageModule>(
    match.route.page,
    match.route.files?.page,
  );

  if (!page) {
    throw new Error(`Route "${match.route.id}" is missing a page module.`);
  }

  const pageOutput = await page({ data: entry.data });
  const output = await applyLayouts(
    pageOutput,
    match.route,
    entry.data,
    match.params,
    entry.path,
  );

  mountRouteOutput(root, output);
}

function createRenderQueue(
  routes: RuntimeRouteDefinition[],
  root: AppRootLike,
) {
  let activeRender = Promise.resolve();

  return (entry: RouterEntry) => {
    const render = activeRender
      .catch(() => undefined)
      .then(() => renderEntryToRoot(routes, root, entry));

    activeRender = render.catch(() => undefined);
    return render;
  };
}

function createRouterProxy(
  router: Router,
  renderEntry: (entry: RouterEntry) => Promise<void>,
) {
  return {
    getCurrent() {
      return router.getCurrent();
    },
    getInternalDataPath(path: string) {
      return router.getInternalDataPath(path);
    },
    async load(path: string) {
      const entry = await router.load(path);
      await renderEntry(entry);
      return entry;
    },
    async navigate(path: string) {
      const entry = await router.navigate(path);
      await renderEntry(entry);
      return entry;
    },
    subscribe(listener) {
      return router.subscribe(listener);
    },
  } satisfies Router;
}

export function startClientApp(
  options: StartClientAppOptions,
): StartedClientApp {
  const document = getDocument(options.document);
  const window = getWindow(options.window);
  const history = getHistory(options.history);
  const root = getAppRoot(
    document,
    options.rootSelector ?? defaultRootSelector,
  );
  const renderEntry = createRenderQueue(options.routes, root);

  if (options.mode === "hydrated") {
    const hydrated = hydrateApp({
      bootstrapSelector: options.bootstrapSelector,
      document: document as never,
      history,
      rootSelector: options.rootSelector,
      routes: options.routes,
      transport: options.transport,
      window: window as never,
    });

    let booting = true;
    const suppressedPaths = new Set<string>();
    const unsubscribe = hydrated.router.subscribe((entry) => {
      if (booting) {
        return;
      }
      if (suppressedPaths.delete(normalizePath(entry.path))) {
        return;
      }

      void renderEntry(entry);
    });

    const ready = hydrated.ready.then(() => {
      booting = false;
    });
    const router = {
      getCurrent() {
        return hydrated.router.getCurrent();
      },
      getInternalDataPath(path: string) {
        return hydrated.router.getInternalDataPath(path);
      },
      async load(path: string) {
        const normalizedPath = normalizePath(path);
        suppressedPaths.add(normalizedPath);

        try {
          const entry = await hydrated.router.load(path);
          if (!booting) {
            await renderEntry(entry);
          }
          return entry;
        } catch (error) {
          suppressedPaths.delete(normalizedPath);
          throw error;
        }
      },
      async navigate(path: string) {
        const normalizedPath = normalizePath(path);
        suppressedPaths.add(normalizedPath);

        try {
          const entry = await hydrated.router.navigate(path);
          if (!booting) {
            await renderEntry(entry);
          }
          return entry;
        } catch (error) {
          suppressedPaths.delete(normalizedPath);
          throw error;
        }
      },
      subscribe(listener) {
        return hydrated.router.subscribe(listener);
      },
    } satisfies Router;

    return {
      ready,
      router,
      dispose() {
        unsubscribe();
        hydrated.dispose();
      },
    };
  }

  const baseRouter = createRouter({
    document: document as never,
    history,
    mode: options.mode,
    resolve: options.mode === "custom" ? options.resolve : undefined,
    routes: options.routes,
    transport: options.mode === "custom" ? undefined : options.transport,
  });
  const router = createRouterProxy(baseRouter, renderEntry);

  const clickHandler = async (event: ClickEventLike) => {
    const anchor = getAnchor(event);
    if (
      !anchor ||
      !shouldInterceptNavigation(event, anchor, window, options.routes)
    ) {
      return;
    }

    event.preventDefault();

    const url = new URL(anchor.href, window.location.origin);
    await router.navigate(`${url.pathname}${url.search}`);
  };

  const popstateHandler = async () => {
    await router.load(getCurrentPath(window));
  };

  document.addEventListener("click", clickHandler);
  window.addEventListener("popstate", popstateHandler);

  return {
    ready: router.load(normalizePath(getCurrentPath(window))).then(() => {}),
    router,
    dispose() {
      document.removeEventListener("click", clickHandler);
      window.removeEventListener("popstate", popstateHandler);
    },
  };
}
