import type {
  BootstrapPayload,
  HistoryLike,
  RouteHydrateModule,
  Router,
  RouterBackOptions,
  RouterBackResult,
  RouterEntry,
  Transport,
} from "../../core/src/index";
import { matchPath as matchCanonicalPath } from "../../core/src/index";
import {
  createNavigationHistory,
  type NavigationHistoryPopState,
} from "./navigation-history";
import {
  applyNavigationScroll,
  type NavigationScrollOptions,
  type NavigationScrollTransition,
  type NavigationScrollWindowLike,
  resolveNavigationScrollOptions,
} from "./navigation-scroll";
import { type AppRootLike, applyInitialRouteStrategy } from "./route-render";
import {
  applyRouteHead,
  type ClientRouteDefinition,
  createRouter,
} from "./router";

type BootstrapElementLike = {
  textContent: string | null;
};

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

type DocumentLike = {
  querySelector: (selector: string) => BootstrapElementLike | null;
  addEventListener: (
    type: "click",
    handler: (event: ClickEventLike) => unknown,
  ) => void;
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

export type HydrateAppOptions = {
  bootstrapSelector?: string;
  document?: DocumentLike;
  history?: HistoryLike;
  rootSelector?: string;
  routes: readonly HydratableRoute[];
  scroll?: NavigationScrollOptions;
  transport?: Transport;
  window?: WindowLike;
};

export type HydratedApp = {
  bootstrap: BootstrapPayload;
  dispose: () => void;
  ready: Promise<void>;
  router: Router;
};

export type HydrateIslandsOptions = {
  bootstrapSelector?: string;
  document?: DocumentLike;
  routes: readonly HydratableRoute[];
};

export type HydratedIslands = {
  bootstrap: BootstrapPayload;
  ready: Promise<void>;
};

const defaultBootstrapSelector = "script[data-van-stack-bootstrap]";
const defaultAppRootSelector = "[data-van-stack-app-root]";

export type RouteHydrateInput = {
  root: AppRootLike;
  data: unknown;
  params: Record<string, string>;
  path: string;
  pathname: string;
  query: URLSearchParams;
};

export type { RouteHydrateModule } from "../../core/src/index";
export type { AppRootLike } from "./route-render";

export type HydratableRoute = ClientRouteDefinition & {
  hydrate?: RouteHydrateModule;
  files?: ClientRouteDefinition["files"];
};

type NavigationCompleteSource = NavigationScrollTransition | "load";

type HydrateAppInternalOptions = HydrateAppOptions & {
  onNavigationComplete?: (
    entry: RouterEntry,
    source: NavigationCompleteSource,
  ) => Promise<void> | void;
};

function getDocument(document: DocumentLike | undefined) {
  if (document) return document;
  if (typeof globalThis.document !== "undefined") {
    return globalThis.document as unknown as DocumentLike;
  }

  throw new Error(
    "No document was provided and global document is unavailable.",
  );
}

function getWindow(window: WindowLike | undefined) {
  if (window) return window;
  if (typeof globalThis.window !== "undefined") {
    return globalThis.window as unknown as WindowLike;
  }

  throw new Error("No window was provided and global window is unavailable.");
}

function getHistory(history: HistoryLike | undefined) {
  if (history) return history;
  if (typeof globalThis.history !== "undefined") {
    return globalThis.history;
  }

  throw new Error("No history was provided and global history is unavailable.");
}

function readBootstrapPayload(
  document: DocumentLike,
  selector: string,
): BootstrapPayload {
  const element = document.querySelector(selector);

  if (!element?.textContent) {
    throw new Error(
      "No van-stack bootstrap payload was found in the document.",
    );
  }

  return JSON.parse(element.textContent) as BootstrapPayload;
}

function getCurrentPath(window: WindowLike) {
  return `${window.location.pathname}${window.location.search}`;
}

function parseRoutePath(path: string) {
  const url = new URL(path, "https://van-stack.local");

  return {
    path: `${url.pathname}${url.search}`,
    pathname: url.pathname,
    query: new URLSearchParams(url.searchParams),
  };
}

function getAppRoot(document: DocumentLike, selector = defaultAppRootSelector) {
  const root = document.querySelector(selector);

  if (!root) {
    throw new Error("No van-stack app root was found in the document.");
  }

  return root as AppRootLike;
}

function getMatchedRoute(
  routes: readonly HydratableRoute[],
  bootstrap: BootstrapPayload,
) {
  if (bootstrap.routeId) {
    const matchedById = routes.find((route) => route.id === bootstrap.routeId);
    if (matchedById) {
      return {
        route: matchedById,
        params:
          bootstrap.params ??
          matchCanonicalPath(matchedById.path, bootstrap.pathname)?.params ??
          {},
      };
    }
  }

  const pathname = bootstrap.pathname;
  for (const route of routes) {
    const match = matchCanonicalPath(route.path, pathname);
    if (match) {
      return {
        route,
        params: bootstrap.params ?? match.params,
      };
    }
  }

  throw new Error(`No route matched bootstrap path: ${bootstrap.pathname}`);
}

function hasMatchingRoute(routes: readonly HydratableRoute[], path: string) {
  const pathname = new URL(path, "https://van-stack.local").pathname;

  return routes.some((route) =>
    Boolean(matchCanonicalPath(route.path, pathname)),
  );
}

async function hydrateRouteRoot(
  route: {
    files?: Pick<NonNullable<HydratableRoute["files"]>, "hydrate">;
    hydrate?: RouteHydrateModule;
  },
  input: RouteHydrateInput,
  root: AppRootLike,
) {
  const hydrateFactory = route.files?.hydrate;
  const hydrate =
    route.hydrate ??
    (hydrateFactory ? (await hydrateFactory()).default : undefined);
  if (!hydrate) return;

  await hydrate({ ...input, root });
}

function getAnchor(event: ClickEventLike) {
  return event.target?.closest?.("a[href]") ?? null;
}

function shouldInterceptNavigation(
  event: ClickEventLike,
  anchor: AnchorLike,
  window: WindowLike,
  routes: readonly HydratableRoute[],
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

export function hydrateApp(options: HydrateAppOptions): HydratedApp {
  const internalOptions = options as HydrateAppInternalOptions;
  const document = getDocument(options.document);
  const window = getWindow(options.window);
  const navigationHistory = createNavigationHistory(
    getHistory(options.history),
  );
  const history = navigationHistory.history;
  const navigationScroll = resolveNavigationScrollOptions(options.scroll);
  const bootstrap = readBootstrapPayload(
    document,
    options.bootstrapSelector ?? defaultBootstrapSelector,
  );

  if (bootstrap.hydrationPolicy !== "app") {
    throw new Error(
      'Cannot hydrate a bootstrap payload unless hydrationPolicy is "app".',
    );
  }

  const baseRouter = createRouter({
    mode: "hydrated",
    routes: options.routes,
    history,
    navigationHistory,
    bootstrap,
    transport: options.transport,
    document: document as never,
  });

  async function completeNavigation(
    entry: RouterEntry,
    source: NavigationCompleteSource,
  ) {
    await internalOptions.onNavigationComplete?.(entry, source);
  }

  async function completeScrolledNavigation(
    entry: RouterEntry,
    source: NavigationScrollTransition,
  ) {
    await completeNavigation(entry, source);
    applyNavigationScroll(window, navigationScroll, source);
  }

  const router = {
    async back(options?: RouterBackOptions): Promise<RouterBackResult> {
      if (baseRouter.canGoBack()) {
        return baseRouter.back();
      }

      if (options?.fallback) {
        const entry = await baseRouter.navigate(options.fallback);
        await completeScrolledNavigation(entry, "navigate");
        return "fallback";
      }

      return "none";
    },
    canGoBack() {
      return baseRouter.canGoBack();
    },
    getCurrent() {
      return baseRouter.getCurrent();
    },
    getInternalDataPath(path: string) {
      return baseRouter.getInternalDataPath(path);
    },
    getNavigationState() {
      return baseRouter.getNavigationState();
    },
    async load(path: string) {
      const entry = await baseRouter.load(path);
      await completeNavigation(entry, "load");
      return entry;
    },
    async navigate(path: string) {
      const entry = await baseRouter.navigate(path);
      await completeScrolledNavigation(entry, "navigate");
      return entry;
    },
    subscribe(listener) {
      return baseRouter.subscribe(listener);
    },
    subscribeNavigationState(listener) {
      return baseRouter.subscribeNavigationState(listener);
    },
  } satisfies Router;
  const root = getAppRoot(document, options.rootSelector);
  const matchedRoute = getMatchedRoute(options.routes, bootstrap);
  const bootstrapPath = parseRoutePath(bootstrap.path ?? bootstrap.pathname);
  const ready = Promise.all([
    applyInitialRouteStrategy(
      matchedRoute.route,
      {
        path: bootstrapPath.path,
        pathname: bootstrapPath.pathname,
        params: matchedRoute.params,
        query: bootstrapPath.query,
        data: bootstrap.data,
        slotData: bootstrap.slotData,
      },
      matchedRoute.params,
      root,
    ),
    applyRouteHead({
      routes: options.routes,
      path: bootstrapPath.path,
      data: bootstrap.data,
      document: document as never,
    }),
  ]).then(() => {});

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

    const entry = await baseRouter.load(getCurrentPath(window));
    await completeScrolledNavigation(entry, "popstate");
  };

  document.addEventListener("click", clickHandler);
  window.addEventListener("popstate", popstateHandler);

  return {
    bootstrap,
    ready,
    router,
    dispose() {
      document.removeEventListener("click", clickHandler);
      window.removeEventListener("popstate", popstateHandler);
    },
  };
}

export function hydrateIslands(
  options: HydrateIslandsOptions,
): HydratedIslands {
  const document = getDocument(options.document);
  const bootstrap = readBootstrapPayload(
    document,
    options.bootstrapSelector ?? defaultBootstrapSelector,
  );

  if (bootstrap.hydrationPolicy !== "islands") {
    throw new Error(
      'Cannot hydrate islands unless hydrationPolicy is "islands".',
    );
  }

  const matchedRoute = getMatchedRoute(options.routes, bootstrap);
  const bootstrapPath = parseRoutePath(bootstrap.path ?? bootstrap.pathname);
  const ready = hydrateRouteRoot(
    matchedRoute.route,
    {
      root: document as unknown as AppRootLike,
      data: bootstrap.data,
      params: matchedRoute.params,
      path: bootstrapPath.path,
      pathname: bootstrapPath.pathname,
      query: bootstrapPath.query,
    },
    document as unknown as AppRootLike,
  ).then(() => {});

  return {
    bootstrap,
    ready,
  };
}
