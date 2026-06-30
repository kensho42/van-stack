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
  | "navigation"
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

export type RouteUrlContext = {
  params: Record<string, string>;
  path: string;
  pathname: string;
  query: URLSearchParams;
};

export type RouteDataContext = RouteUrlContext & {
  data: unknown;
};

export type RouteMetaModule = (
  input: RouteDataContext,
) => Awaitable<RouteMeta | undefined>;

export type RouteNavigationAction = "push" | "replace" | "reset";

export type RouteNavigationTransition =
  | "platform"
  | "ios-slide"
  | "android-fade-through"
  | "cover"
  | "fade"
  | "none"
  | (string & {});

export type RouteNavigationRetention = "current" | "previous" | "all";

export type RouteNavigation = {
  animate?: boolean;
  enter?: RouteNavigationAction;
  retention?: RouteNavigationRetention;
  swipeBack?: boolean;
  transition?: RouteNavigationTransition;
  up?: string;
};

export type RouteNavigationModule = RouteNavigation;

export type RoutePageModule = (input: RouteDataContext) => Awaitable<unknown>;

export type RouteHydrateModule = (
  input: RouteDataContext & {
    root: unknown;
  },
) => unknown;

export type RouteErrorModule = (
  input: RouteUrlContext & {
    error: unknown;
  },
) => Awaitable<unknown>;

export type RouteLayoutModule = (
  input: RouteDataContext & {
    children: unknown;
    slots: Record<string, unknown>;
    slotData: Record<string, unknown>;
  },
) => Awaitable<unknown>;

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
  chunked?: boolean;
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
  navigation?: RouteModuleLoader<RouteNavigationModule>;
  page?: RouteModuleLoader<RoutePageModule>;
  route?: RouteModuleLoader<RouteHandlerModule>;
};

export type RuntimeRouteDefinition = {
  id: string;
  path: string;
  chunked?: boolean;
  hydrationPolicy?: HydrationPolicy;
  action?: RouteActionModule;
  entries?: RouteEntriesModule;
  error?: RouteErrorModule;
  hydrate?: RouteHydrateModule;
  loader?: RouteLoaderModule;
  meta?: RouteMetaModule;
  navigation?: RouteNavigation;
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
  chunked?: boolean;
  directorySegments: string[];
  files: Partial<Record<SlotRouteFileKind, string>>;
  layoutChain: string[];
  params: string[];
};

export type NormalizedRoute = {
  id: string;
  path: string;
  chunked?: boolean;
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
  replaceState?: (state: unknown, unused: string, url?: string) => void;
  back?: () => void;
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
  pathname: string;
  params: Record<string, string>;
  query: URLSearchParams;
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
  routes: readonly RouteDefinition[];
  history: HistoryLike;
  bootstrap: BootstrapPayload;
  transport?: Transport;
};

export type CreateShellRouterOptions = {
  mode: "shell";
  routes: readonly RouteDefinition[];
  history: HistoryLike;
  transport?: Transport;
};

export type CreateCustomRouterOptions = {
  mode: "custom";
  routes: readonly RouteDefinition[];
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
