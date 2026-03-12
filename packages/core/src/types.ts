export type HydrationPolicy = "document-only" | "islands" | "app";

export type PresentationMode = "replace" | "stack";

export type CsrMode = "hydrated" | "shell" | "custom";

export type RouteFileKind =
  | "page"
  | "hydrate"
  | "route"
  | "layout"
  | "loader"
  | "action"
  | "entries"
  | "meta"
  | "error";

export type RouteMeta = {
  title?: string;
  description?: string;
  canonical?: string;
  openGraph?: {
    title?: string;
    description?: string;
  };
};

export type NormalizedRoute = {
  id: string;
  path: string;
  directorySegments: string[];
  files: Partial<Record<RouteFileKind, string>>;
  layoutChain: string[];
  params: string[];
};

export type RouteDefinition = {
  id: string;
  path: string;
};

export type HistoryLike = {
  pushState: (state: unknown, unused: string, url?: string) => void;
};

export type RouteMatch = {
  route: RouteDefinition;
  pathname: string;
  params: Record<string, string>;
  query: URLSearchParams;
};

export type Navigation = {
  pathname: string;
  query: URLSearchParams;
  signal: AbortSignal;
};

export type Transport = {
  load: (match: RouteMatch, navigation: Navigation) => Promise<unknown>;
};

export type Resolve = (
  match: RouteMatch,
  navigation: Navigation,
) => Promise<unknown>;

export type RouterEntry = {
  path: string;
  data: unknown;
};

export type RouterListener = (entry: RouterEntry) => void;

export type BootstrapPayload = {
  routeId?: string;
  path?: string;
  pathname: string;
  params?: Record<string, string>;
  hydrationPolicy?: HydrationPolicy;
  data: unknown;
};

export type CreateHydratedRouterOptions = {
  mode: "hydrated";
  routes: RouteDefinition[];
  history: HistoryLike;
  bootstrap: BootstrapPayload;
  transport?: Transport;
};

export type CreateShellRouterOptions = {
  mode: "shell";
  routes: RouteDefinition[];
  history: HistoryLike;
  transport?: Transport;
};

export type CreateCustomRouterOptions = {
  mode: "custom";
  routes: RouteDefinition[];
  history: HistoryLike;
  resolve?: Resolve;
};

export type CreateRouterOptions =
  | CreateHydratedRouterOptions
  | CreateShellRouterOptions
  | CreateCustomRouterOptions;

export type Router = {
  getCurrent: () => RouterEntry | null;
  getInternalDataPath: (path: string) => string;
  load: (path: string) => Promise<RouterEntry>;
  navigate: (path: string) => Promise<RouterEntry>;
  subscribe: (listener: RouterListener) => () => void;
};
