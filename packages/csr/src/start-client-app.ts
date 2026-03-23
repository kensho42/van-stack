import {
  type HistoryLike,
  matchPath,
  type Resolve,
  type RouteLayoutModule,
  type RouteModuleLoader,
  type RoutePageModule,
  type Router,
  type RouterEntry,
  type RuntimeRouteDefinition,
  type RuntimeSlotDefinition,
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
  querySelector?: (selector: string) => unknown;
  replaceChildren?: (...children: unknown[]) => void;
};

type ActiveSlotState = {
  data: unknown;
  key: string;
  params: Record<string, string>;
  route: RuntimeSlotDefinition;
};

type MountedSlotState = {
  defaultKey: string;
  defaultRoot: AppRootLike;
  ownerId: string;
  ownerIndex: number;
  slotKeys: Record<string, string>;
  slotNames: string[];
  slotRoots: Record<string, AppRootLike>;
};

type RenderEntry = ((entry: RouterEntry) => Promise<void>) & {
  prime: (entry: RouterEntry | null) => void;
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

function tryFindMatchedRoute(routes: RuntimeRouteDefinition[], path: string) {
  try {
    return findMatchedRoute(routes, path);
  } catch {
    return null;
  }
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

function serializeBranchValue(value: unknown) {
  try {
    return JSON.stringify(value) ?? "null";
  } catch {
    return String(value ?? "");
  }
}

function buildBranchKey(
  routeId: string,
  params: Record<string, string>,
  data: unknown,
) {
  return `${routeId}|${serializeBranchValue(params)}|${serializeBranchValue(data)}`;
}

function escapeAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function matchSlotRoute(
  slotRoutes: readonly RuntimeSlotDefinition[],
  path: string,
) {
  const pathname = new URL(path, "https://van-stack.local").pathname;
  let fallback: {
    params: Record<string, string>;
    route: RuntimeSlotDefinition;
  } | null = null;

  for (const route of slotRoutes) {
    const match = matchPath(route.path, pathname);
    if (match) {
      return {
        params: match.params,
        route,
      };
    }

    if (!fallback || route.path.length < fallback.route.path.length) {
      fallback = {
        params: {},
        route,
      };
    }
  }

  return fallback;
}

function resolveActiveSlots(
  route: RuntimeRouteDefinition,
  path: string,
  slotData: Record<string, unknown> | undefined,
) {
  const activeSlots: Record<string, ActiveSlotState> = {};

  for (const [slot, slotRoutes] of Object.entries(route.slots ?? {})) {
    const matched = matchSlotRoute(slotRoutes, path);
    if (!matched) {
      continue;
    }

    const data = slotData?.[slot];
    activeSlots[slot] = {
      route: matched.route,
      params: matched.params,
      data,
      key: buildBranchKey(matched.route.id, matched.params, data),
    };
  }

  return activeSlots;
}

async function applyLayouts(
  body: unknown,
  layoutChain: readonly RouteModuleLoader<RouteLayoutModule>[] | undefined,
  data: unknown,
  params: Record<string, string>,
  path: string,
  slots: Record<string, unknown> = {},
  slotData: Record<string, unknown> = {},
) {
  let output = body;

  for (const layoutLoader of [...(layoutChain ?? [])].reverse()) {
    const module = await layoutLoader();
    output = await module.default({
      children: output,
      data,
      slots,
      slotData,
      params,
      path,
    });
  }

  return output;
}

function renderOutputToHtml(output: { render: () => string }) {
  return output.render();
}

function createSlotWrapper(slot: string, output: unknown) {
  const wrapper = van.tags.div as ((...args: unknown[]) => unknown) | undefined;

  if (typeof wrapper === "function") {
    return wrapper({ "data-van-stack-slot-root": slot }, output);
  }

  const body =
    output &&
    typeof output === "object" &&
    "render" in output &&
    typeof output.render === "function"
      ? renderOutputToHtml(output as { render: () => string })
      : String(output ?? "");

  return {
    render: () =>
      `<div data-van-stack-slot-root="${escapeAttribute(slot)}">${body}</div>`,
    toString: () =>
      `<div data-van-stack-slot-root="${escapeAttribute(slot)}">${body}</div>`,
  };
}

function isMountTarget(value: unknown): value is AppRootLike {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    typeof (value as AppRootLike).replaceChildren === "function" ||
    "innerHTML" in (value as AppRootLike)
  );
}

function getMountedSlotRoot(
  appRoot: AppRootLike,
  slot: string,
  candidate: unknown,
) {
  if (isMountTarget(candidate)) {
    return candidate;
  }

  return (
    (appRoot.querySelector?.(
      `[data-van-stack-slot-root="${slot}"]`,
    ) as AppRootLike | null) ?? null
  );
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

async function renderDefaultBody(
  route: RuntimeRouteDefinition,
  page: RoutePageModule,
  data: unknown,
  params: Record<string, string>,
  path: string,
) {
  const pageOutput = await page({ data });
  const ownerIndex = route.slotOwnerLayoutIndex;

  if (ownerIndex === undefined) {
    return applyLayouts(pageOutput, route.layoutChain, data, params, path);
  }

  return applyLayouts(
    pageOutput,
    route.layoutChain?.slice(ownerIndex + 1),
    data,
    params,
    path,
  );
}

async function renderSlotBody(state: ActiveSlotState, path: string) {
  const page = await resolveRouteModule<RoutePageModule>(
    state.route.page,
    state.route.files?.page,
  );

  if (!page) {
    throw new Error(
      `Named slot route "${state.route.id}" is missing a page module.`,
    );
  }

  const pageOutput = await page({ data: state.data });
  return applyLayouts(
    pageOutput,
    state.route.layoutChain,
    state.data,
    state.params,
    path,
  );
}

async function mountFreshRoute(
  root: AppRootLike,
  match: ReturnType<typeof findMatchedRoute>,
  entry: RouterEntry,
  page: RoutePageModule,
) {
  const ownerId = match.route.slotOwnerLayout;
  const ownerIndex = match.route.slotOwnerLayoutIndex;

  if (ownerId === undefined || ownerIndex === undefined) {
    const output = await renderDefaultBody(
      match.route,
      page,
      entry.data,
      match.params,
      entry.path,
    );
    mountRouteOutput(root, output);
    return null;
  }

  const activeSlots = resolveActiveSlots(
    match.route,
    entry.path,
    entry.slotData,
  );
  const defaultBody = await renderDefaultBody(
    match.route,
    page,
    entry.data,
    match.params,
    entry.path,
  );
  const defaultWrapper = createSlotWrapper("default", defaultBody);
  const slotData = entry.slotData ?? {};
  const slotOutputs: Record<string, unknown> = {};

  for (const [slot, state] of Object.entries(activeSlots)) {
    slotOutputs[slot] = createSlotWrapper(
      slot,
      await renderSlotBody(state, entry.path),
    );
  }

  let composed: unknown = defaultWrapper;
  const ownerLoader = match.route.layoutChain?.at(ownerIndex);
  if (ownerLoader) {
    const ownerModule = await ownerLoader();
    composed = await ownerModule.default({
      children: defaultWrapper,
      data: entry.data,
      slots: slotOutputs,
      slotData,
      params: match.params,
      path: entry.path,
    });
  }

  const output = await applyLayouts(
    composed,
    match.route.layoutChain?.slice(0, ownerIndex),
    entry.data,
    match.params,
    entry.path,
  );
  mountRouteOutput(root, output);

  const defaultRoot = getMountedSlotRoot(root, "default", defaultWrapper);
  if (!defaultRoot) {
    return null;
  }

  const slotNames = Object.keys(activeSlots).sort();
  const slotRoots = Object.fromEntries(
    slotNames.map((slot) => [
      slot,
      getMountedSlotRoot(root, slot, slotOutputs[slot]),
    ]),
  ) as Record<string, AppRootLike | null>;

  if (Object.values(slotRoots).some((slotRoot) => !slotRoot)) {
    return null;
  }

  return {
    ownerId,
    ownerIndex,
    defaultRoot,
    defaultKey: buildBranchKey(match.route.id, match.params, entry.data),
    slotNames,
    slotKeys: Object.fromEntries(
      Object.entries(activeSlots).map(([slot, state]) => [slot, state.key]),
    ),
    slotRoots: slotRoots as Record<string, AppRootLike>,
  } satisfies MountedSlotState;
}

function captureMountedSlotState(
  root: AppRootLike,
  route: RuntimeRouteDefinition,
  params: Record<string, string>,
  entry: RouterEntry,
) {
  const ownerId = route.slotOwnerLayout;
  const ownerIndex = route.slotOwnerLayoutIndex;

  if (ownerId === undefined || ownerIndex === undefined) {
    return null;
  }

  const activeSlots = resolveActiveSlots(route, entry.path, entry.slotData);
  const defaultRoot = getMountedSlotRoot(root, "default", null);
  if (!defaultRoot) {
    return null;
  }

  const slotNames = Object.keys(activeSlots).sort();
  const slotRoots = Object.fromEntries(
    slotNames.map((slot) => [slot, getMountedSlotRoot(root, slot, null)]),
  ) as Record<string, AppRootLike | null>;

  if (Object.values(slotRoots).some((slotRoot) => !slotRoot)) {
    return null;
  }

  return {
    ownerId,
    ownerIndex,
    defaultRoot,
    defaultKey: buildBranchKey(route.id, params, entry.data),
    slotNames,
    slotKeys: Object.fromEntries(
      Object.entries(activeSlots).map(([slot, state]) => [slot, state.key]),
    ),
    slotRoots: slotRoots as Record<string, AppRootLike>,
  } satisfies MountedSlotState;
}

async function renderEntryToRoot(
  routes: RuntimeRouteDefinition[],
  root: AppRootLike,
  entry: RouterEntry,
  mountedSlots: MountedSlotState | null,
) {
  const match = findMatchedRoute(routes, entry.path);
  const page = await resolveRouteModule<RoutePageModule>(
    match.route.page,
    match.route.files?.page,
  );

  if (!page) {
    throw new Error(`Route "${match.route.id}" is missing a page module.`);
  }

  const ownerId = match.route.slotOwnerLayout;
  const ownerIndex = match.route.slotOwnerLayoutIndex;
  if (!mountedSlots && ownerId !== undefined && ownerIndex !== undefined) {
    mountedSlots = captureMountedSlotState(
      root,
      match.route,
      match.params,
      entry,
    );
  }

  if (
    !mountedSlots ||
    ownerId === undefined ||
    ownerIndex === undefined ||
    mountedSlots.ownerId !== ownerId ||
    mountedSlots.ownerIndex !== ownerIndex
  ) {
    return mountFreshRoute(root, match, entry, page);
  }

  const activeSlots = resolveActiveSlots(
    match.route,
    entry.path,
    entry.slotData,
  );
  const slotNames = Object.keys(activeSlots).sort();
  if (
    slotNames.length !== mountedSlots.slotNames.length ||
    slotNames.some((slot, index) => slot !== mountedSlots.slotNames[index])
  ) {
    return mountFreshRoute(root, match, entry, page);
  }

  const nextDefaultKey = buildBranchKey(
    match.route.id,
    match.params,
    entry.data,
  );
  if (mountedSlots.defaultKey !== nextDefaultKey) {
    const defaultBody = await renderDefaultBody(
      match.route,
      page,
      entry.data,
      match.params,
      entry.path,
    );
    mountRouteOutput(mountedSlots.defaultRoot, defaultBody);
    mountedSlots.defaultKey = nextDefaultKey;
  }

  for (const [slot, state] of Object.entries(activeSlots)) {
    if (mountedSlots.slotKeys[slot] === state.key) {
      continue;
    }

    const slotRoot = mountedSlots.slotRoots[slot];
    if (!slotRoot) {
      return mountFreshRoute(root, match, entry, page);
    }

    mountRouteOutput(slotRoot, await renderSlotBody(state, entry.path));
    mountedSlots.slotKeys[slot] = state.key;
  }

  return mountedSlots;
}

function createRenderQueue(
  routes: RuntimeRouteDefinition[],
  root: AppRootLike,
) {
  let activeRender = Promise.resolve();
  let mountedSlots: MountedSlotState | null = null;

  const render = (entry: RouterEntry) => {
    const render = activeRender
      .catch(() => undefined)
      .then(async () => {
        mountedSlots = await renderEntryToRoot(
          routes,
          root,
          entry,
          mountedSlots,
        );
      });

    activeRender = render.catch(() => undefined);
    return render;
  };

  return Object.assign(render, {
    prime(entry: RouterEntry | null) {
      if (!entry) {
        mountedSlots = null;
        return;
      }

      const match = tryFindMatchedRoute(routes, entry.path);
      if (!match) {
        mountedSlots = null;
        return;
      }

      mountedSlots = captureMountedSlotState(
        root,
        match.route,
        match.params,
        entry,
      );
    },
  }) satisfies RenderEntry;
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
    renderEntry.prime(hydrated.router.getCurrent());

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
