import {
  type CreateRouterOptions,
  createInternalDataPath,
  matchPath,
  type Navigation,
  type Resolve,
  type RouteDefinition,
  type RouteMatch,
  type Transport,
} from "../../core/src/index";

type CurrentEntry = {
  path: string;
  data: unknown;
};

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
    return options.resolve;
  }

  const transport = getTransport(options);

  return (match, navigation) => transport.load(match, navigation);
}

export function createRouter(options: CreateRouterOptions) {
  let current: CurrentEntry | null = null;
  let activeController: AbortController | null = null;
  const resolve = getResolve(options);

  if (options.mode === "hydrated") {
    const bootstrapMatch = createRouteMatch(
      options.routes,
      options.bootstrap.pathname,
    );

    current = {
      path: bootstrapMatch.pathname,
      data: options.bootstrap.data,
    };
  }

  async function resolvePath(path: string): Promise<CurrentEntry> {
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
  };
}
