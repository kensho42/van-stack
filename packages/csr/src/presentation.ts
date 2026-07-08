import type {
  HistoryLike,
  RouterBackOptions,
  RouterBackResult,
  RouterEntry,
  RuntimeRouteDefinition,
} from "../../core/src/index";
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
  scrollTo?: (options: {
    top: number;
    left: number;
    behavior: "auto";
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
  window: ClientPresentationWindowLike;
};

export type ClientPresentation = {
  back?: (options?: RouterBackOptions) => Promise<RouterBackResult>;
  canGoBack?: () => boolean;
  dispose?: () => void;
  render: (input: ClientPresentationRenderInput) => Promise<void> | void;
};
