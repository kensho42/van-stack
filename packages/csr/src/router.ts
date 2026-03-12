import {
  type CreateRouterOptions,
  createInternalDataPath,
  matchPath,
  type Navigation,
  type Resolve,
  type RouteDefinition,
  type RouteMatch,
  type Router,
  type RouterEntry,
  type RouterListener,
  type Transport,
} from "../../core/src/index";

function parsePath(path: string) {
  const url = new URL(path, "https://van-stack.local");

  return {
    path: `${url.pathname}${url.search}`,
    pathname: url.pathname,
    query: new URLSearchParams(url.searchParams),
  };
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

function createRouteMatch(routes: RouteDefinition[], path: string): RouteMatch {
  const { pathname, query } = parsePath(path);

  for (const route of routes) {
    const match = matchPath(route.path, pathname);
    if (!match) continue;

    return {
      route,
      pathname,
      params: match.params,
      query,
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
    createRouteMatch(
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

    const match = createRouteMatch(options.routes, path);
    const navigation = createNavigation(
      match.pathname,
      match.query,
      activeController.signal,
    );
    const data = await resolve(match, navigation);

    current = {
      path: parsePath(path).path,
      data,
    };
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
