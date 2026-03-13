import type {
  BootstrapPayload,
  HistoryLike,
  RouteDefinition,
  Router,
  Transport,
} from "../../core/src/index";
import { matchPath as matchCanonicalPath } from "../../core/src/index";
import { createRouter } from "./router";

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

export type AppRootLike = {
  querySelector?: (selector: string) => unknown;
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

export type HydrateAppOptions = {
  bootstrapSelector?: string;
  document?: DocumentLike;
  history?: HistoryLike;
  routes: HydratableRoute[];
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
  routes: HydratableRoute[];
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
};

export type RouteHydrateModule = (input: RouteHydrateInput) => unknown;

export type HydratableRoute = RouteDefinition & {
  files?: {
    hydrate?: () => Promise<{ default: RouteHydrateModule }>;
  };
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

function getAppRoot(document: DocumentLike) {
  const root = document.querySelector(defaultAppRootSelector);

  if (!root) {
    throw new Error("No van-stack app root was found in the document.");
  }

  return root as AppRootLike;
}

function getMatchedRoute(
  routes: HydratableRoute[],
  bootstrap: BootstrapPayload,
) {
  if (bootstrap.routeId) {
    const matchedById = routes.find((route) => route.id === bootstrap.routeId);
    if (matchedById) return matchedById;
  }

  const pathname = bootstrap.pathname;
  const matchedByPath = routes.find((route) =>
    Boolean(matchCanonicalPath(route.path, pathname)),
  );

  if (matchedByPath) return matchedByPath;

  throw new Error(`No route matched bootstrap path: ${bootstrap.pathname}`);
}

function hasMatchingRoute(routes: HydratableRoute[], path: string) {
  const pathname = new URL(path, "https://van-stack.local").pathname;

  return routes.some((route) =>
    Boolean(matchCanonicalPath(route.path, pathname)),
  );
}

async function hydrateRouteRoot(
  route: HydratableRoute,
  bootstrap: BootstrapPayload,
  root: AppRootLike,
) {
  const hydrateFactory = route.files?.hydrate;
  if (!hydrateFactory) return;

  const module = await hydrateFactory();
  await module.default({
    root,
    data: bootstrap.data,
    params: bootstrap.params ?? {},
    path: bootstrap.path ?? bootstrap.pathname,
  });
}

function getAnchor(event: ClickEventLike) {
  return event.target?.closest?.("a[href]") ?? null;
}

function shouldInterceptNavigation(
  event: ClickEventLike,
  anchor: AnchorLike,
  window: WindowLike,
  routes: HydratableRoute[],
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
  const document = getDocument(options.document);
  const window = getWindow(options.window);
  const history = getHistory(options.history);
  const bootstrap = readBootstrapPayload(
    document,
    options.bootstrapSelector ?? defaultBootstrapSelector,
  );

  if (bootstrap.hydrationPolicy !== "app") {
    throw new Error(
      'Cannot hydrate a bootstrap payload unless hydrationPolicy is "app".',
    );
  }

  const router = createRouter({
    mode: "hydrated",
    routes: options.routes,
    history,
    bootstrap,
    transport: options.transport,
  });
  const root = getAppRoot(document);
  const matchedRoute = getMatchedRoute(options.routes, bootstrap);
  const ready = hydrateRouteRoot(matchedRoute, bootstrap, root).then(() => {});

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
  const ready = hydrateRouteRoot(
    matchedRoute,
    bootstrap,
    document as unknown as AppRootLike,
  ).then(() => {});

  return {
    bootstrap,
    ready,
  };
}
