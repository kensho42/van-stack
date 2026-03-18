import {
  type BootstrapPayload,
  createInternalDataPath,
  type HistoryLike,
  matchPath,
  type Navigation,
  type Resolve,
  type RouteMeta,
  type Router,
  type RouterEntry,
  type RouterListener,
  type RuntimeRouteDefinition,
  type Transport,
} from "../../core/src/index";

type HeadElementLike = {
  getAttribute?: (name: string) => string | null;
  remove?: () => void;
  setAttribute: (name: string, value: string) => void;
  textContent: string;
};

export type HeadDocumentLike = {
  createElement: (tagName: string) => HeadElementLike;
  head: {
    appendChild: (node: HeadElementLike) => unknown;
  };
  querySelector: (selector: string) => HeadElementLike | null;
  title: string;
};

export type ClientRouteDefinition = RuntimeRouteDefinition;

type CreateHydratedRouterOptions = {
  bootstrap: BootstrapPayload;
  document?: HeadDocumentLike;
  history: HistoryLike;
  mode: "hydrated";
  routes: ClientRouteDefinition[];
  transport?: Transport;
};

type CreateShellRouterOptions = {
  document?: HeadDocumentLike;
  history: HistoryLike;
  mode: "shell";
  routes: ClientRouteDefinition[];
  transport?: Transport;
};

type CreateCustomRouterOptions = {
  document?: HeadDocumentLike;
  history: HistoryLike;
  mode: "custom";
  resolve?: Resolve;
  routes: ClientRouteDefinition[];
};

type CreateRouterOptions =
  | CreateHydratedRouterOptions
  | CreateShellRouterOptions
  | CreateCustomRouterOptions;

export type ApplyRouteHeadOptions = {
  data: unknown;
  document?: HeadDocumentLike;
  path: string;
  routes: ClientRouteDefinition[];
};

function parsePath(path: string) {
  const url = new URL(path, "https://van-stack.local");

  return {
    path: `${url.pathname}${url.search}`,
    pathname: url.pathname,
    query: new URLSearchParams(url.searchParams),
  };
}

function getDocument(document: HeadDocumentLike | undefined) {
  if (document) {
    return document;
  }
  if (typeof globalThis.document !== "undefined") {
    return globalThis.document as unknown as HeadDocumentLike;
  }

  throw new Error(
    "No document was provided and global document is unavailable.",
  );
}

function createDefaultTransport(): Transport {
  return {
    async load(match) {
      if (typeof fetch !== "function") {
        throw new Error(
          "No transport was provided and global fetch is unavailable.",
        );
      }

      const dataPath = createInternalDataPath(match.pathname);
      const response = await fetch(
        match.query.size > 0
          ? `${dataPath}?${match.query.toString()}`
          : dataPath,
      );

      return response.json();
    },
  };
}

function createNavigation(
  pathname: string,
  query: URLSearchParams,
  signal: AbortSignal,
): Navigation {
  return {
    pathname,
    query,
    signal,
  };
}

function findMatchedRoute(routes: ClientRouteDefinition[], path: string) {
  const { pathname, query } = parsePath(path);

  for (const route of routes) {
    const match = matchPath(route.path, pathname);
    if (!match) {
      continue;
    }

    return {
      pathname,
      params: match.params,
      query,
      route,
    };
  }

  throw new Error(`No route matched path: ${path}`);
}

function getTransport(options: CreateRouterOptions): Transport {
  if (options.mode === "custom") {
    throw new Error("Custom mode does not use a transport.");
  }

  return options.transport ?? createDefaultTransport();
}

function getResolve(options: CreateRouterOptions): Resolve {
  if (options.mode === "custom") {
    return options.resolve ?? (async () => undefined);
  }

  const transport = getTransport(options);

  return (match, navigation) => transport.load(match, navigation);
}

async function resolveMetaModule(route: ClientRouteDefinition) {
  if (route.meta) {
    return route.meta;
  }
  if (!route.files?.meta) {
    return undefined;
  }

  const module = await route.files.meta();
  return module.default;
}

function setManagedTitle(
  document: HeadDocumentLike,
  title: string | undefined,
) {
  document.title = title ?? "";

  const existing = document.querySelector("title");
  if (existing) {
    existing.textContent = document.title;
    return;
  }

  const element = document.createElement("title");
  element.textContent = document.title;
  document.head.appendChild(element);
}

function syncHeadTag(
  document: HeadDocumentLike,
  selector: string,
  tagName: string,
  fixedAttributes: Record<string, string>,
  valueAttribute: string,
  value: string | undefined,
) {
  const existing = document.querySelector(selector);

  if (!value) {
    existing?.remove?.();
    return;
  }

  const element = existing ?? document.createElement(tagName);
  for (const [name, attributeValue] of Object.entries(fixedAttributes)) {
    element.setAttribute(name, attributeValue);
  }
  element.setAttribute(valueAttribute, value);

  if (!existing) {
    document.head.appendChild(element);
  }
}

function applyResolvedMeta(
  meta: RouteMeta | undefined,
  document: HeadDocumentLike,
) {
  setManagedTitle(document, meta?.title);
  syncHeadTag(
    document,
    'meta[name="description"]',
    "meta",
    { name: "description" },
    "content",
    meta?.description,
  );
  syncHeadTag(
    document,
    'link[rel="canonical"]',
    "link",
    { rel: "canonical" },
    "href",
    meta?.canonical,
  );
  syncHeadTag(
    document,
    'meta[property="og:title"]',
    "meta",
    { property: "og:title" },
    "content",
    meta?.openGraph?.title,
  );
  syncHeadTag(
    document,
    'meta[property="og:description"]',
    "meta",
    { property: "og:description" },
    "content",
    meta?.openGraph?.description,
  );
}

export async function applyRouteHead(options: ApplyRouteHeadOptions) {
  const document = getDocument(options.document);
  const match = findMatchedRoute(options.routes, options.path);
  const metaModule = await resolveMetaModule(match.route);
  const meta = metaModule
    ? await metaModule({
        data: options.data,
        params: match.params,
      })
    : undefined;

  applyResolvedMeta(meta, document);
}

export function createRouter(options: CreateRouterOptions) {
  let current: RouterEntry | null = null;
  let activeController: AbortController | null = null;
  const listeners = new Set<RouterListener>();
  const resolve = getResolve(options);

  function notify(entry: RouterEntry) {
    for (const listener of listeners) {
      listener(entry);
    }
  }

  if (options.mode === "hydrated") {
    findMatchedRoute(
      options.routes,
      options.bootstrap.path ?? options.bootstrap.pathname,
    );

    current = {
      path: parsePath(options.bootstrap.path ?? options.bootstrap.pathname)
        .path,
      data: options.bootstrap.data,
    };
  }

  async function resolvePath(path: string): Promise<RouterEntry> {
    activeController?.abort();
    activeController = new AbortController();

    const match = findMatchedRoute(options.routes, path);
    const navigation = createNavigation(
      match.pathname,
      match.query,
      activeController.signal,
    );
    const data = await resolve(
      {
        route: match.route,
        pathname: match.pathname,
        params: match.params,
        query: match.query,
      },
      navigation,
    );

    current = {
      path: parsePath(path).path,
      data,
    };

    if (options.document) {
      await applyRouteHead({
        routes: options.routes,
        path,
        data,
        document: options.document,
      });
    }

    notify(current);

    return current;
  }

  return {
    getCurrent() {
      return current;
    },
    getInternalDataPath(path: string) {
      return createInternalDataPath(parsePath(path).pathname);
    },
    async load(path: string) {
      if (current && current.path === parsePath(path).path) {
        return current;
      }

      return resolvePath(path);
    },
    async navigate(path: string) {
      const entry = await resolvePath(path);

      options.history.pushState({ path: entry.path }, "", entry.path);

      return entry;
    },
    subscribe(listener: RouterListener) {
      listeners.add(listener);

      if (current) {
        listener(current);
      }

      return () => {
        listeners.delete(listener);
      };
    },
  } satisfies Router;
}
