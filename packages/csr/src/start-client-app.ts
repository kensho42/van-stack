import {
  type HistoryLike,
  matchPath,
  type Resolve,
  type Router,
  type RouterBackOptions,
  type RouterBackResult,
  type RouterEntry,
  type RuntimeRouteDefinition,
  type Transport,
} from "../../core/src/index";
import { hydrateApp } from "./hydrate-app";
import {
  createNavigationHistory,
  type NavigationHistoryPopState,
} from "./navigation-history";
import {
  applyNavigationScroll,
  type NavigationScrollOptions,
  type NavigationScrollWindowLike,
  resolveNavigationScrollOptions,
} from "./navigation-scroll";
import type {
  ClientNavigationAction,
  ClientNavigationIntent,
  ClientPresentation,
} from "./presentation";
import {
  type AppRootLike,
  createRenderQueue,
  enhanceRenderedEntry,
} from "./route-render";
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
  addEventListener: (
    type: "popstate",
    handler: (event?: NavigationHistoryPopState) => unknown,
  ) => void;
  removeEventListener: (
    type: "popstate",
    handler: (event?: NavigationHistoryPopState) => unknown,
  ) => void;
} & NavigationScrollWindowLike;

type BaseStartClientAppOptions = {
  document?: ClientDocumentLike;
  history?: HistoryLike;
  rootSelector?: string;
  routes: readonly RuntimeRouteDefinition[];
  scroll?: NavigationScrollOptions;
  window?: WindowLike;
};

type StartHydratedClientAppOptions = BaseStartClientAppOptions & {
  bootstrapSelector?: string;
  mode: "hydrated";
  presentation?: never;
  transport?: Transport;
};

type StartShellClientAppOptions = BaseStartClientAppOptions & {
  mode: "shell";
  presentation?: ClientPresentation;
  transport?: Transport;
};

type StartCustomClientAppOptions = BaseStartClientAppOptions & {
  mode: "custom";
  presentation?: ClientPresentation;
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

function hasMatchingRoute(
  routes: readonly RuntimeRouteDefinition[],
  path: string,
) {
  const pathname = new URL(path, "https://van-stack.local").pathname;

  return routes.some((route) => Boolean(matchPath(route.path, pathname)));
}

function shouldInterceptNavigation(
  event: ClickEventLike,
  anchor: AnchorLike,
  window: WindowLike,
  routes: readonly RuntimeRouteDefinition[],
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

function createRouterProxy(
  router: Router,
  renderEntry: (entry: RouterEntry) => Promise<unknown>,
  window: WindowLike,
  scroll: NavigationScrollOptions | undefined,
) {
  const navigationScroll = resolveNavigationScrollOptions(scroll);

  return {
    async back(options?: RouterBackOptions): Promise<RouterBackResult> {
      if (router.canGoBack()) {
        return router.back();
      }

      if (options?.fallback) {
        const entry = await router.navigate(options.fallback);
        await renderEntry(entry);
        applyNavigationScroll(window, navigationScroll, "navigate");
        return "fallback";
      }

      return "none";
    },
    canGoBack() {
      return router.canGoBack();
    },
    getCurrent() {
      return router.getCurrent();
    },
    getInternalDataPath(path: string) {
      return router.getInternalDataPath(path);
    },
    getNavigationState() {
      return router.getNavigationState();
    },
    async load(path: string) {
      const entry = await router.load(path);
      await renderEntry(entry);
      return entry;
    },
    async navigate(path: string) {
      const entry = await router.navigate(path);
      await renderEntry(entry);
      applyNavigationScroll(window, navigationScroll, "navigate");
      return entry;
    },
    subscribe(listener) {
      return router.subscribe(listener);
    },
    subscribeNavigationState(listener) {
      return router.subscribeNavigationState(listener);
    },
  } satisfies Router;
}

function createPresentedRouter(
  router: Router,
  presentation: ClientPresentation,
  context: {
    history: HistoryLike;
    root: AppRootLike;
    routes: readonly RuntimeRouteDefinition[];
    window: WindowLike;
  },
  scroll: NavigationScrollOptions | undefined,
) {
  const navigationScroll = resolveNavigationScrollOptions(scroll);
  let renderedEntry: RouterEntry | null = null;

  const loadWithPresentation = async (
    path: string,
    intent: ClientNavigationIntent,
    action?: ClientNavigationAction,
  ) => {
    const entry = await router.load(path);
    const from = renderedEntry;
    await presentation.render({
      action,
      entry,
      from,
      history: context.history,
      intent,
      navigate: navigateWithPresentation,
      root: context.root,
      routes: context.routes,
      window: context.window,
    });
    renderedEntry = entry;
    return entry;
  };

  const navigateWithPresentation = async (
    path: string,
    action?: ClientNavigationAction,
  ) => {
    const entry = await loadWithPresentation(path, "navigate", action);
    applyNavigationScroll(context.window, navigationScroll, "navigate");
    return entry;
  };

  return {
    loadWithPresentation,
    router: {
      async back(options?: RouterBackOptions): Promise<RouterBackResult> {
        if (presentation.back) {
          return presentation.back(options);
        }

        if (router.canGoBack()) {
          return router.back();
        }

        if (options?.fallback) {
          await navigateWithPresentation(options.fallback, "replace");
          return "fallback";
        }

        return "none";
      },
      canGoBack() {
        return presentation.canGoBack?.() ?? router.canGoBack();
      },
      getCurrent() {
        return router.getCurrent();
      },
      getInternalDataPath(path: string) {
        return router.getInternalDataPath(path);
      },
      getNavigationState() {
        return (
          presentation.getNavigationState?.() ?? router.getNavigationState()
        );
      },
      load(path: string) {
        return loadWithPresentation(path, "load");
      },
      navigate(path: string) {
        return navigateWithPresentation(path);
      },
      subscribe(listener) {
        return router.subscribe(listener);
      },
      subscribeNavigationState(listener) {
        return (
          presentation.subscribeNavigationState?.(listener) ??
          router.subscribeNavigationState(listener)
        );
      },
    } satisfies Router,
  };
}

export function startClientApp(
  options: StartClientAppOptions,
): StartedClientApp {
  const document = getDocument(options.document);
  const window = getWindow(options.window);
  const navigationHistory = createNavigationHistory(
    getHistory(options.history),
  );
  const history = navigationHistory.history;
  const root = getAppRoot(
    document,
    options.rootSelector ?? defaultRootSelector,
  );
  const renderEntry = createRenderQueue(
    options.routes,
    root,
    options.mode === "hydrated"
      ? async (entry, rendered) => {
          await enhanceRenderedEntry(root, entry, rendered);
        }
      : undefined,
  );

  if (options.mode === "hydrated") {
    if ("presentation" in options && options.presentation) {
      throw new Error(
        "Stack presentation is not supported for hydrated mode in this release.",
      );
    }

    let booting = true;
    const hydratedOptions = {
      bootstrapSelector: options.bootstrapSelector,
      document: document as never,
      history,
      rootSelector: options.rootSelector,
      routes: options.routes,
      scroll: options.scroll,
      transport: options.transport,
      window: window as never,
      async onNavigationComplete(entry: RouterEntry) {
        if (!booting) {
          await renderEntry(entry);
        }
      },
    };
    const hydrated = hydrateApp({
      ...hydratedOptions,
    });
    renderEntry.prime(hydrated.router.getCurrent());

    const ready = hydrated.ready.then(() => {
      booting = false;
    });

    return {
      ready,
      router: hydrated.router,
      dispose() {
        hydrated.dispose();
      },
    };
  }

  const baseRouter = createRouter({
    document: document as never,
    history,
    mode: options.mode,
    navigationHistory,
    resolve: options.mode === "custom" ? options.resolve : undefined,
    routes: options.routes,
    transport: options.mode === "custom" ? undefined : options.transport,
  });
  const presented =
    options.presentation &&
    createPresentedRouter(
      baseRouter,
      options.presentation,
      {
        history,
        root,
        routes: options.routes,
        window,
      },
      options.scroll,
    );
  const router =
    presented?.router ??
    createRouterProxy(baseRouter, renderEntry, window, options.scroll);
  const navigationScroll = resolveNavigationScrollOptions(options.scroll);

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

  const popstateHandler = async (event?: NavigationHistoryPopState) => {
    navigationHistory.notePopState(event);

    if (presented) {
      await presented.loadWithPresentation(getCurrentPath(window), "popstate");
    } else {
      await router.load(getCurrentPath(window));
    }
    applyNavigationScroll(window, navigationScroll, "popstate");
  };

  document.addEventListener("click", clickHandler);
  window.addEventListener("popstate", popstateHandler);

  return {
    ready: (presented
      ? presented.loadWithPresentation(
          normalizePath(getCurrentPath(window)),
          "load",
        )
      : router.load(normalizePath(getCurrentPath(window)))
    ).then(() => {}),
    router,
    dispose() {
      document.removeEventListener("click", clickHandler);
      window.removeEventListener("popstate", popstateHandler);
      options.presentation?.dispose?.();
    },
  };
}
