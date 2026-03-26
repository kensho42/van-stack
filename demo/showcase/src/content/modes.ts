const showcaseCanonicalPostSlug = "runtime-gallery-tour";

export const showcaseLiveModeIds = [
  "ssg",
  "ssr",
  "hydrated",
  "islands",
  "shell",
  "custom",
  "chunked",
] as const;

export type ShowcaseLiveModeId = (typeof showcaseLiveModeIds)[number];

export type ShowcaseModeId = ShowcaseLiveModeId;

export type ShowcaseMode = {
  id: ShowcaseLiveModeId;
  title: string;
  summary: string;
  proves: string;
  galleryPath: string;
  walkthroughPath: string;
  deliveryLabel: string;
  dataBoundary: string;
};

export const showcaseModes = [
  {
    id: "ssg",
    title: "SSG",
    summary: "Serve fully materialized blog pages generated ahead of time.",
    proves:
      "Shows that the same publication graph can be pre-rendered into static homepage, archive, and detail routes.",
    galleryPath: `/gallery/ssg/posts/${showcaseCanonicalPostSlug}`,
    walkthroughPath: "/walkthrough/ssg",
    deliveryLabel: "Pre-generated HTML",
    dataBoundary: "Build-time entries expand dynamic routes into static pages.",
  },
  {
    id: "ssr",
    title: "SSR",
    summary:
      "Render complete article pages on the server with no client takeover.",
    proves:
      "Shows the publication as traditional server-rendered HTML, including full post, author, category, and tag routes.",
    galleryPath: `/gallery/ssr/posts/${showcaseCanonicalPostSlug}`,
    walkthroughPath: "/walkthrough/ssr",
    deliveryLabel: "Server-rendered HTML",
    dataBoundary:
      "The server resolves route data and sends finished documents.",
  },
  {
    id: "hydrated",
    title: "Hydrated",
    summary:
      "Start from SSR HTML, then let the browser remount the live app by default.",
    proves:
      "Shows SSR output handing off to a real client router that remounts the current route by default, then keeps the same blog app interactive after first paint.",
    galleryPath: `/gallery/hydrated/posts/${showcaseCanonicalPostSlug}`,
    walkthroughPath: "/walkthrough/hydrated",
    deliveryLabel: "SSR plus remount takeover",
    dataBoundary:
      "Bootstrap state seeds the first remount, then the client router owns later navigation.",
  },
  {
    id: "islands",
    title: "Hydrated Islands",
    summary:
      "Keep the document server-rendered, then hydrate only focused interactive islands.",
    proves:
      "Shows low-level enhance hooks without a client router takeover by wiring small post interactions onto an otherwise server-owned page.",
    galleryPath: `/gallery/islands/posts/${showcaseCanonicalPostSlug}`,
    walkthroughPath: "/walkthrough/islands",
    deliveryLabel: "SSR plus island hydration",
    dataBoundary:
      "The server owns navigation while focused client islands attach to marked DOM.",
  },
  {
    id: "shell",
    title: "Shell",
    summary: "Boot from a minimal shell and load blog data through transport.",
    proves:
      "Shows route-driven loading without SSR article HTML by letting the client fetch framework transport data after startup.",
    galleryPath: `/gallery/shell/posts/${showcaseCanonicalPostSlug}`,
    walkthroughPath: "/walkthrough/shell",
    deliveryLabel: "Client shell plus transport",
    dataBoundary:
      "VanStack-owned transport resolves page data after the shell loads.",
  },
  {
    id: "custom",
    title: "Custom",
    summary: "Keep data ownership inside the app while still using the router.",
    proves:
      "Shows route components fetching from a custom JSON surface while still using the same route graph and chrome.",
    galleryPath: `/gallery/custom/posts/${showcaseCanonicalPostSlug}`,
    walkthroughPath: "/walkthrough/custom",
    deliveryLabel: "Client shell plus custom JSON API",
    dataBoundary:
      "The app or route component owns data loading through demo API endpoints.",
  },
  {
    id: "chunked",
    title: "Chunked",
    summary:
      "Keep the same shell behavior but load route modules on demand from the generated manifest.",
    proves:
      "Shows that client-side route code can stay split per route while the app still uses the same transport-driven data flow.",
    galleryPath: `/gallery/chunked/posts/${showcaseCanonicalPostSlug}`,
    walkthroughPath: "/walkthrough/chunked",
    deliveryLabel: "Client shell with chunked route modules",
    dataBoundary:
      "The browser entry resolves route data and route code independently, loading pages only when navigation reaches them.",
  },
] satisfies ShowcaseMode[];

export function getShowcaseMode(id: ShowcaseModeId) {
  return showcaseModes.find((mode) => mode.id === id);
}

export function getSiblingShowcaseModes(currentModeId: ShowcaseLiveModeId) {
  return showcaseModes.filter((mode) => mode.id !== currentModeId);
}

export function buildShowcaseGalleryPath(
  modeId: ShowcaseLiveModeId,
  collection: "posts" | "authors" | "categories" | "tags" = "posts",
  slug = showcaseCanonicalPostSlug,
) {
  if (collection === "posts") {
    return `/gallery/${modeId}/posts/${slug}`;
  }

  return `/gallery/${modeId}/${collection}/${slug}`;
}
