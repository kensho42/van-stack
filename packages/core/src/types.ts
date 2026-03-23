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

export type SlotRouteFileKind =
  | "page"
  | "hydrate"
  | "layout"
  | "loader"
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

export type Awaitable<T> = Promise<T> | T;

export type RouteModuleLoader<T = unknown> = () => Promise<{ default: T }>;

export type RouteHandlerModule = (input: {
  request: Request;
  params: Record<string, string>;
}) => Awaitable<Response>;

export type RouteLoaderModule = (input: {
  params: Record<string, string>;
  request: Request;
}) => Awaitable<unknown>;

export type RouteActionModule = (input: {
  params: Record<string, string>;
  request: Request;
}) => Awaitable<unknown>;

export type RouteEntriesModule = () => Awaitable<Record<string, string>[]>;

export type RouteMetaModule = (input: {
  data: unknown;
  params: Record<string, string>;
}) => Awaitable<RouteMeta | undefined>;

export type RoutePageModule = (input: { data: unknown }) => Awaitable<unknown>;

export type RouteHydrateModule = (input: {
  root: unknown;
  data: unknown;
  params: Record<string, string>;
  path: string;
}) => unknown;

export type RouteErrorModule = (input: {
  error: unknown;
  params: Record<string, string>;
  path: string;
}) => Awaitable<unknown>;

export type RouteLayoutModule = (input: {
  children: unknown;
  data: unknown;
  slots: Record<string, unknown>;
  slotData: Record<string, unknown>;
  params: Record<string, string>;
  path: string;
}) => Awaitable<unknown>;

export type RuntimeSlotFiles = {
  error?: RouteModuleLoader<RouteErrorModule>;
  hydrate?: RouteModuleLoader<RouteHydrateModule>;
  loader?: RouteModuleLoader<RouteLoaderModule>;
  page?: RouteModuleLoader<RoutePageModule>;
};

export type RuntimeSlotDefinition = {
  id: string;
  slot: string;
  path: string;
  error?: RouteErrorModule;
  hydrate?: RouteHydrateModule;
  loader?: RouteLoaderModule;
  page?: RoutePageModule;
  files?: RuntimeSlotFiles;
  layoutChain?: readonly RouteModuleLoader<RouteLayoutModule>[];
};

export type RuntimeRouteFiles = {
  action?: RouteModuleLoader<RouteActionModule>;
  entries?: RouteModuleLoader<RouteEntriesModule>;
  error?: RouteModuleLoader<RouteErrorModule>;
  hydrate?: RouteModuleLoader<RouteHydrateModule>;
  loader?: RouteModuleLoader<RouteLoaderModule>;
  meta?: RouteModuleLoader<RouteMetaModule>;
  page?: RouteModuleLoader<RoutePageModule>;
  route?: RouteModuleLoader<RouteHandlerModule>;
};

export type RuntimeRouteDefinition = {
  id: string;
  path: string;
  hydrationPolicy?: HydrationPolicy;
  action?: RouteActionModule;
  entries?: RouteEntriesModule;
  error?: RouteErrorModule;
  hydrate?: RouteHydrateModule;
  loader?: RouteLoaderModule;
  meta?: RouteMetaModule;
  page?: RoutePageModule;
  route?: RouteHandlerModule;
  files?: RuntimeRouteFiles;
  layoutChain?: readonly RouteModuleLoader<RouteLayoutModule>[];
  slotOwnerLayout?: string;
  slotOwnerLayoutIndex?: number;
  slots?: Record<string, readonly RuntimeSlotDefinition[]>;
};

export type NormalizedSlotRoute = {
  id: string;
  slot: string;
  path: string;
  directorySegments: string[];
  files: Partial<Record<SlotRouteFileKind, string>>;
  layoutChain: string[];
  params: string[];
};

export type NormalizedRoute = {
  id: string;
  path: string;
  directorySegments: string[];
  files: Partial<Record<RouteFileKind, string>>;
  layoutChain: string[];
  params: string[];
  slotOwnerLayout?: string;
  slots?: Record<string, readonly NormalizedSlotRoute[]>;
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
  slotData?: Record<string, unknown>;
};

export type RouterListener = (entry: RouterEntry) => void;

export type BootstrapPayload = {
  routeId?: string;
  path?: string;
  pathname: string;
  params?: Record<string, string>;
  hydrationPolicy?: HydrationPolicy;
  data: unknown;
  slotData?: Record<string, unknown>;
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
