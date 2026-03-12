import type {
  BootstrapPayload,
  HistoryLike,
  RouteDefinition,
  Router,
  Transport,
} from "../../core/src/index";
import { createRouter } from "./router";

type BootstrapElementLike = {
  textContent: string | null;
};

type AnchorLike = {
  href: string;
  target?: string | null;
  download?: string | null;
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
  routes: RouteDefinition[];
  transport?: Transport;
  window?: WindowLike;
};

export type HydratedApp = {
  bootstrap: BootstrapPayload;
  dispose: () => void;
  router: Router;
};

const defaultBootstrapSelector = "script[data-van-stack-bootstrap]";

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

function getAnchor(event: ClickEventLike) {
  return event.target?.closest?.("a[href]") ?? null;
}

function shouldInterceptNavigation(
  event: ClickEventLike,
  anchor: AnchorLike,
  window: WindowLike,
) {
  if (event.defaultPrevented) return false;
  if ((event.button ?? 0) !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.download) return false;

  const url = new URL(anchor.href, window.location.origin);
  return url.origin === window.location.origin;
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

  const clickHandler = async (event: ClickEventLike) => {
    const anchor = getAnchor(event);
    if (!anchor || !shouldInterceptNavigation(event, anchor, window)) {
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
    router,
    dispose() {
      document.removeEventListener("click", clickHandler);
      window.removeEventListener("popstate", popstateHandler);
    },
  };
}
