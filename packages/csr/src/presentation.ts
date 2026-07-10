import type {
  HistoryLike,
  RouterBackOptions,
  RouterBackResult,
  RouterEntry,
  RouterNavigationState,
  RouterNavigationStateListener,
  RuntimeRouteDefinition,
} from "../../core/src/index";
import type {
  NavigationScrollBehavior,
  ResolvedNavigationScrollOptions,
} from "./navigation-scroll";
import type { AppRootLike } from "./route-render";

export type ClientNavigationAction = "push" | "replace" | "pop" | "reset";
export type ClientNavigationIntent = "load" | "navigate" | "popstate";

export type ClientPresentationWindowLike = {
  location: {
    origin: string;
    pathname: string;
    search: string;
  };
  pageXOffset?: number;
  pageYOffset?: number;
  requestAnimationFrame?: (callback: (time: number) => unknown) => number;
  scrollTo?: (options: {
    top: number;
    left: number;
    behavior: NavigationScrollBehavior;
  }) => unknown;
  scrollX?: number;
  scrollY?: number;
};

export type ClientPresentationRenderInput = {
  action?: ClientNavigationAction;
  entry: RouterEntry;
  from: RouterEntry | null;
  history: HistoryLike;
  intent: ClientNavigationIntent;
  navigate: (
    path: string,
    action?: ClientNavigationAction,
  ) => Promise<RouterEntry>;
  root: AppRootLike;
  routes: readonly RuntimeRouteDefinition[];
  scroll: ResolvedNavigationScrollOptions;
  window: ClientPresentationWindowLike;
};

export type ClientPresentation = {
  back?: (options?: RouterBackOptions) => Promise<RouterBackResult>;
  canGoBack?: () => boolean;
  dispose?: () => void;
  getNavigationState?: () => RouterNavigationState;
  managesScroll?: boolean;
  render: (input: ClientPresentationRenderInput) => Promise<void> | void;
  subscribeNavigationState?: (
    listener: RouterNavigationStateListener,
  ) => () => void;
};
