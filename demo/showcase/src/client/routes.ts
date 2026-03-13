import { matchPath } from "van-stack";
import type { HydratableRoute, RouteHydrateModule } from "van-stack/csr";
import { van } from "van-stack/render";

import { renderGalleryPage } from "../route-helpers/gallery";
import {
  type CustomApiPayload,
  createCustomGalleryPageData,
  type GalleryPageData,
  resolveCustomApiPath,
} from "../runtime/data";

type HistoryLike = {
  pushState: (state: unknown, unused: string, url?: string) => void;
};

type RouterLike = {
  load: (path: string) => Promise<unknown>;
  navigate: (path: string) => Promise<unknown>;
};

type ClientRouteDefinition = {
  id: string;
  path: string;
};

type AnchorLike = {
  href: string;
  target?: string | null;
  download?: string | null;
  getAttribute?: (name: string) => string | null;
};

type WindowLike = Window & {
  history: HistoryLike;
};

const { div, h1, p } = van.tags;

export const hydratedClientRoutes: HydratableRoute[] = [
  { id: "gallery/hydrated/index", path: "/gallery/hydrated" },
  { id: "gallery/hydrated/posts", path: "/gallery/hydrated/posts" },
  {
    id: "gallery/hydrated/posts/[slug]",
    path: "/gallery/hydrated/posts/:slug",
    files: {
      hydrate: async () => ({
        default: (
          await import("../routes/gallery/hydrated/posts/[slug]/hydrate")
        ).default as RouteHydrateModule,
      }),
    },
  },
  { id: "gallery/hydrated/authors", path: "/gallery/hydrated/authors" },
  {
    id: "gallery/hydrated/authors/[slug]",
    path: "/gallery/hydrated/authors/:slug",
  },
  { id: "gallery/hydrated/categories", path: "/gallery/hydrated/categories" },
  {
    id: "gallery/hydrated/categories/[slug]",
    path: "/gallery/hydrated/categories/:slug",
  },
  { id: "gallery/hydrated/tags", path: "/gallery/hydrated/tags" },
  { id: "gallery/hydrated/tags/[slug]", path: "/gallery/hydrated/tags/:slug" },
] as const;

export const islandsClientRoutes: HydratableRoute[] = [
  { id: "gallery/islands/index", path: "/gallery/islands" },
  { id: "gallery/islands/posts", path: "/gallery/islands/posts" },
  {
    id: "gallery/islands/posts/[slug]",
    path: "/gallery/islands/posts/:slug",
    files: {
      hydrate: async () => ({
        default: (
          await import("../routes/gallery/islands/posts/[slug]/hydrate")
        ).default as RouteHydrateModule,
      }),
    },
  },
  { id: "gallery/islands/authors", path: "/gallery/islands/authors" },
  {
    id: "gallery/islands/authors/[slug]",
    path: "/gallery/islands/authors/:slug",
  },
  { id: "gallery/islands/categories", path: "/gallery/islands/categories" },
  {
    id: "gallery/islands/categories/[slug]",
    path: "/gallery/islands/categories/:slug",
  },
  { id: "gallery/islands/tags", path: "/gallery/islands/tags" },
  { id: "gallery/islands/tags/[slug]", path: "/gallery/islands/tags/:slug" },
] as const;

export const shellClientRoutes: ClientRouteDefinition[] = [
  { id: "gallery/shell/index", path: "/gallery/shell" },
  { id: "gallery/shell/posts", path: "/gallery/shell/posts" },
  { id: "gallery/shell/posts/[slug]", path: "/gallery/shell/posts/:slug" },
  { id: "gallery/shell/authors", path: "/gallery/shell/authors" },
  { id: "gallery/shell/authors/[slug]", path: "/gallery/shell/authors/:slug" },
  { id: "gallery/shell/categories", path: "/gallery/shell/categories" },
  {
    id: "gallery/shell/categories/[slug]",
    path: "/gallery/shell/categories/:slug",
  },
  { id: "gallery/shell/tags", path: "/gallery/shell/tags" },
  { id: "gallery/shell/tags/[slug]", path: "/gallery/shell/tags/:slug" },
] as const;

export const customClientRoutes: ClientRouteDefinition[] = [
  { id: "gallery/custom/index", path: "/gallery/custom" },
  { id: "gallery/custom/posts", path: "/gallery/custom/posts" },
  { id: "gallery/custom/posts/[slug]", path: "/gallery/custom/posts/:slug" },
  { id: "gallery/custom/authors", path: "/gallery/custom/authors" },
  {
    id: "gallery/custom/authors/[slug]",
    path: "/gallery/custom/authors/:slug",
  },
  { id: "gallery/custom/categories", path: "/gallery/custom/categories" },
  {
    id: "gallery/custom/categories/[slug]",
    path: "/gallery/custom/categories/:slug",
  },
  { id: "gallery/custom/tags", path: "/gallery/custom/tags" },
  { id: "gallery/custom/tags/[slug]", path: "/gallery/custom/tags/:slug" },
] as const;

export function getClientRoot(document: Document) {
  const root = document.querySelector(
    "[data-showcase-client-root], [data-van-stack-app-root]",
  );

  if (!(root instanceof Element)) {
    throw new Error("No showcase client root was found in the document.");
  }

  return root;
}

export function renderClientPage(root: Element, data: GalleryPageData) {
  root.replaceChildren();
  van.add(root, renderGalleryPage(data));
}

export function renderClientLoading(
  root: Element,
  title: string,
  body: string,
) {
  root.replaceChildren();
  van.add(root, div({ class: "showcase-client-state" }, h1(title), p(body)));
}

function getAnchor(event: MouseEvent) {
  return (event.target as Element | null)?.closest?.("a[href]") ?? null;
}

function isAnchorLike(value: unknown): value is AnchorLike {
  return Boolean(value && typeof value === "object" && "href" in value);
}

export function wireClientNavigation(
  router: RouterLike,
  options: {
    document: Document;
    routes: ClientRouteDefinition[];
    window: WindowLike;
  },
) {
  const clickHandler = async (event: MouseEvent) => {
    const anchor = getAnchor(event);
    if (!isAnchorLike(anchor)) {
      return;
    }
    if (event.defaultPrevented || event.button !== 0) {
      return;
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (anchor.target && anchor.target !== "_self") {
      return;
    }
    if (anchor.download) {
      return;
    }
    if ((anchor.getAttribute?.("data-van-stack-ignore") ?? null) !== null) {
      return;
    }

    const url = new URL(anchor.href, options.window.location.origin);
    if (url.origin !== options.window.location.origin) {
      return;
    }

    const isOwnedRoute = options.routes.some((route) =>
      Boolean(matchPath(route.path, url.pathname)),
    );
    if (!isOwnedRoute) {
      return;
    }

    event.preventDefault();
    await router.navigate(`${url.pathname}${url.search}`);
  };

  const popstateHandler = async () => {
    await router.load(
      `${options.window.location.pathname}${options.window.location.search}`,
    );
  };

  options.document.addEventListener("click", clickHandler);
  options.window.addEventListener("popstate", popstateHandler);

  return () => {
    options.document.removeEventListener("click", clickHandler);
    options.window.removeEventListener("popstate", popstateHandler);
  };
}

export async function fetchCustomPageData(path: string) {
  const response = await fetch(resolveCustomApiPath(path));
  if (!response.ok) {
    throw new Error(
      `Custom showcase API failed for ${path}: ${response.status}`,
    );
  }

  return createCustomGalleryPageData(
    path,
    (await response.json()) as CustomApiPayload,
  );
}
