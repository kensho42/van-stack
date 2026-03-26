import { matchPath } from "van-stack";
import type {
  ClientRouteDefinition,
  HydratableRoute,
  RouteHydrateModule,
} from "van-stack/csr";

type HistoryLike = {
  pushState: (state: unknown, unused: string, url?: string) => void;
};

type RouterLike = {
  load: (path: string) => Promise<unknown>;
  navigate: (path: string) => Promise<unknown>;
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

export const hydratedClientRoutes: HydratableRoute[] = [
  {
    id: "gallery/hydrated/index",
    path: "/gallery/hydrated",
    files: {
      page: async () => ({
        default: (await import("../routes/gallery/hydrated/index/page"))
          .default,
      }),
      meta: async () => ({
        default: (await import("../routes/gallery/hydrated/index/meta"))
          .default,
      }),
    },
  },
  {
    id: "gallery/hydrated/posts",
    path: "/gallery/hydrated/posts",
    files: {
      page: async () => ({
        default: (await import("../routes/gallery/hydrated/posts/page"))
          .default,
      }),
      meta: async () => ({
        default: (await import("../routes/gallery/hydrated/posts/meta"))
          .default,
      }),
    },
  },
  {
    id: "gallery/hydrated/posts/[slug]",
    path: "/gallery/hydrated/posts/:slug",
    files: {
      page: async () => ({
        default: (await import("../routes/gallery/hydrated/posts/[slug]/page"))
          .default,
      }),
      meta: async () => ({
        default: (await import("../routes/gallery/hydrated/posts/[slug]/meta"))
          .default,
      }),
    },
  },
  {
    id: "gallery/hydrated/authors",
    path: "/gallery/hydrated/authors",
    files: {
      page: async () => ({
        default: (await import("../routes/gallery/hydrated/authors/page"))
          .default,
      }),
      meta: async () => ({
        default: (await import("../routes/gallery/hydrated/authors/meta"))
          .default,
      }),
    },
  },
  {
    id: "gallery/hydrated/authors/[slug]",
    path: "/gallery/hydrated/authors/:slug",
    files: {
      page: async () => ({
        default: (
          await import("../routes/gallery/hydrated/authors/[slug]/page")
        ).default,
      }),
      meta: async () => ({
        default: (
          await import("../routes/gallery/hydrated/authors/[slug]/meta")
        ).default,
      }),
    },
  },
  {
    id: "gallery/hydrated/categories",
    path: "/gallery/hydrated/categories",
    files: {
      page: async () => ({
        default: (await import("../routes/gallery/hydrated/categories/page"))
          .default,
      }),
      meta: async () => ({
        default: (await import("../routes/gallery/hydrated/categories/meta"))
          .default,
      }),
    },
  },
  {
    id: "gallery/hydrated/categories/[slug]",
    path: "/gallery/hydrated/categories/:slug",
    files: {
      page: async () => ({
        default: (
          await import("../routes/gallery/hydrated/categories/[slug]/page")
        ).default,
      }),
      meta: async () => ({
        default: (
          await import("../routes/gallery/hydrated/categories/[slug]/meta")
        ).default,
      }),
    },
  },
  {
    id: "gallery/hydrated/tags",
    path: "/gallery/hydrated/tags",
    files: {
      page: async () => ({
        default: (await import("../routes/gallery/hydrated/tags/page")).default,
      }),
      meta: async () => ({
        default: (await import("../routes/gallery/hydrated/tags/meta")).default,
      }),
    },
  },
  {
    id: "gallery/hydrated/tags/[slug]",
    path: "/gallery/hydrated/tags/:slug",
    files: {
      page: async () => ({
        default: (await import("../routes/gallery/hydrated/tags/[slug]/page"))
          .default,
      }),
      meta: async () => ({
        default: (await import("../routes/gallery/hydrated/tags/[slug]/meta"))
          .default,
      }),
    },
  },
] as const;

export const islandsClientRoutes: HydratableRoute[] = [
  {
    id: "gallery/islands/index",
    path: "/gallery/islands",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/islands/index/meta")).default,
      }),
    },
  },
  {
    id: "gallery/islands/posts",
    path: "/gallery/islands/posts",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/islands/posts/meta")).default,
      }),
    },
  },
  {
    id: "gallery/islands/posts/[slug]",
    path: "/gallery/islands/posts/:slug",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/islands/posts/[slug]/meta"))
          .default,
      }),
      hydrate: async () => ({
        default: (
          await import("../routes/gallery/islands/posts/[slug]/hydrate")
        ).default as RouteHydrateModule,
      }),
    },
  },
  {
    id: "gallery/islands/authors",
    path: "/gallery/islands/authors",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/islands/authors/meta"))
          .default,
      }),
    },
  },
  {
    id: "gallery/islands/authors/[slug]",
    path: "/gallery/islands/authors/:slug",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/islands/authors/[slug]/meta"))
          .default,
      }),
    },
  },
  {
    id: "gallery/islands/categories",
    path: "/gallery/islands/categories",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/islands/categories/meta"))
          .default,
      }),
    },
  },
  {
    id: "gallery/islands/categories/[slug]",
    path: "/gallery/islands/categories/:slug",
    files: {
      meta: async () => ({
        default: (
          await import("../routes/gallery/islands/categories/[slug]/meta")
        ).default,
      }),
    },
  },
  {
    id: "gallery/islands/tags",
    path: "/gallery/islands/tags",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/islands/tags/meta")).default,
      }),
    },
  },
  {
    id: "gallery/islands/tags/[slug]",
    path: "/gallery/islands/tags/:slug",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/islands/tags/[slug]/meta"))
          .default,
      }),
    },
  },
] as const;

export const shellClientRoutes: ClientRouteDefinition[] = [
  {
    id: "gallery/shell/index",
    path: "/gallery/shell",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/shell/index/meta")).default,
      }),
    },
  },
  {
    id: "gallery/shell/posts",
    path: "/gallery/shell/posts",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/shell/posts/meta")).default,
      }),
    },
  },
  {
    id: "gallery/shell/posts/[slug]",
    path: "/gallery/shell/posts/:slug",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/shell/posts/[slug]/meta"))
          .default,
      }),
    },
  },
  {
    id: "gallery/shell/authors",
    path: "/gallery/shell/authors",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/shell/authors/meta")).default,
      }),
    },
  },
  {
    id: "gallery/shell/authors/[slug]",
    path: "/gallery/shell/authors/:slug",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/shell/authors/[slug]/meta"))
          .default,
      }),
    },
  },
  {
    id: "gallery/shell/categories",
    path: "/gallery/shell/categories",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/shell/categories/meta"))
          .default,
      }),
    },
  },
  {
    id: "gallery/shell/categories/[slug]",
    path: "/gallery/shell/categories/:slug",
    files: {
      meta: async () => ({
        default: (
          await import("../routes/gallery/shell/categories/[slug]/meta")
        ).default,
      }),
    },
  },
  {
    id: "gallery/shell/tags",
    path: "/gallery/shell/tags",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/shell/tags/meta")).default,
      }),
    },
  },
  {
    id: "gallery/shell/tags/[slug]",
    path: "/gallery/shell/tags/:slug",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/shell/tags/[slug]/meta"))
          .default,
      }),
    },
  },
] as const;

export const customClientRoutes: ClientRouteDefinition[] = [
  {
    id: "gallery/custom/index",
    path: "/gallery/custom",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/custom/index/meta")).default,
      }),
    },
  },
  {
    id: "gallery/custom/posts",
    path: "/gallery/custom/posts",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/custom/posts/meta")).default,
      }),
    },
  },
  {
    id: "gallery/custom/posts/[slug]",
    path: "/gallery/custom/posts/:slug",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/custom/posts/[slug]/meta"))
          .default,
      }),
    },
  },
  {
    id: "gallery/custom/authors",
    path: "/gallery/custom/authors",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/custom/authors/meta"))
          .default,
      }),
    },
  },
  {
    id: "gallery/custom/authors/[slug]",
    path: "/gallery/custom/authors/:slug",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/custom/authors/[slug]/meta"))
          .default,
      }),
    },
  },
  {
    id: "gallery/custom/categories",
    path: "/gallery/custom/categories",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/custom/categories/meta"))
          .default,
      }),
    },
  },
  {
    id: "gallery/custom/categories/[slug]",
    path: "/gallery/custom/categories/:slug",
    files: {
      meta: async () => ({
        default: (
          await import("../routes/gallery/custom/categories/[slug]/meta")
        ).default,
      }),
    },
  },
  {
    id: "gallery/custom/tags",
    path: "/gallery/custom/tags",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/custom/tags/meta")).default,
      }),
    },
  },
  {
    id: "gallery/custom/tags/[slug]",
    path: "/gallery/custom/tags/:slug",
    files: {
      meta: async () => ({
        default: (await import("../routes/gallery/custom/tags/[slug]/meta"))
          .default,
      }),
    },
  },
] as const;

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
