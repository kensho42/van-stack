import { van } from "van-stack/render";

export const chunkedCanonicalSlug = "chunked-route";

export const chunkedRouteContent = {
  hydrated: {
    title: "Chunked hydrated detail",
    summary:
      "Hydrated mode starts from SSR HTML, then remounts the live route through the generated client manifest.",
    note: "This page proves the hydrated route chunk is loaded lazily from the split bundle and becomes interactive through default remount.",
  },
  shell: {
    title: "Chunked shell detail",
    summary:
      "Shell mode keeps the browser entry lean and resolves the current route from the generated manifest.",
    note: "This page proves the shell route chunk is loaded lazily from the split bundle.",
  },
  custom: {
    title: "Chunked custom detail",
    summary:
      "Custom mode resolves route data from application-owned logic while still loading route code on demand.",
    note: "This page proves the custom route chunk is loaded lazily from the split bundle.",
  },
} as const;

const chunkedLandingLinks = [
  {
    href: `/hydrated/${chunkedCanonicalSlug}`,
    title: "Hydrated route",
    summary: "SSR markup plus a bootstrap payload and lazy route modules.",
  },
  {
    href: `/shell/${chunkedCanonicalSlug}`,
    title: "Shell route",
    summary: "Client-owned navigation with transport-style route resolution.",
  },
  {
    href: `/custom/${chunkedCanonicalSlug}`,
    title: "Custom route",
    summary: "Client-owned navigation with app-owned data resolution.",
  },
  {
    href: "/shell-workbench/overview",
    title: "Shell slot route",
    summary:
      "A control-plane workbench with a pathless @sidebar slot and workspace-only shell updates.",
  },
] as const;

export type ChunkedMode = keyof typeof chunkedRouteContent;

export type ChunkedRouteData = {
  mode: ChunkedMode;
  note: string;
  slug: string;
  summary: string;
  title: string;
};

export function getChunkedLandingLinks() {
  return chunkedLandingLinks;
}

export function getChunkedRouteData(
  mode: ChunkedMode,
  slug: string,
): ChunkedRouteData {
  const content = chunkedRouteContent[mode];

  return {
    mode,
    note: content.note,
    slug,
    summary: content.summary,
    title: content.title,
  };
}

export function renderChunkedLandingPage() {
  const { a, article, h1, li, p, section, small, ul } = van.tags;

  return article(
    { class: "chunked-csr-landing" },
    h1("Chunked CSR demo"),
    p(
      "The demo writes .van-stack/routes.generated.ts before building the split browser bundle.",
    ),
    section(
      ul(
        ...chunkedLandingLinks.map((link) =>
          li(
            a({ href: link.href }, link.title),
            p(link.summary),
            small(link.href),
          ),
        ),
      ),
    ),
  );
}

export function renderChunkedDetailPage(data: ChunkedRouteData) {
  const { article, button, h1, p, section, small, span } = van.tags;
  const remountCount = createHydratedRemountCount(data);

  return article(
    {
      class: "chunked-csr-detail",
      "data-mode": data.mode,
      "data-slug": data.slug,
    },
    h1(data.title),
    p(data.summary),
    section(
      p(
        "Shared detail copy proves the route modules are rendering real content.",
      ),
      p(data.note),
      data.mode === "hydrated"
        ? section(
            { class: "chunked-csr-remount-proof" },
            p(
              "The browser entry remounts this route by default, so this counter becomes live without a route-level hydrate.ts hook.",
            ),
            p(
              span(
                { "data-remount-count": "" },
                remountCount
                  ? () => String(remountCount.val)
                  : String(getHydratedRemountInitialCount(data)),
              ),
              " remount clicks recorded in this browser view.",
            ),
            button(
              {
                type: "button",
                ...(remountCount
                  ? {
                      onclick: () => {
                        remountCount.val += 1;
                      },
                    }
                  : {}),
              },
              "Increment remount counter",
            ),
          )
        : null,
      small(`/${data.mode}/${data.slug}`),
    ),
  );
}

type StateLike<T> = {
  val: T;
};

function isBrowserEnvironment() {
  return (
    typeof globalThis.window !== "undefined" &&
    typeof globalThis.document !== "undefined"
  );
}

function getHydratedRemountInitialCount(data: ChunkedRouteData) {
  return Math.max(1, data.slug.length % 5);
}

function createHydratedRemountCount(data: ChunkedRouteData) {
  if (data.mode !== "hydrated" || !isBrowserEnvironment()) {
    return null;
  }

  return van.state(getHydratedRemountInitialCount(data)) as StateLike<number>;
}

export async function loadChunkedRouteData(
  match: { pathname: string },
  _navigation?: { pathname: string },
) {
  const pathname = new URL(match.pathname, "https://van-stack.local").pathname;
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return {
      landing: true,
      routes: chunkedLandingLinks,
    };
  }

  const [mode, slug] = segments;
  if ((mode === "hydrated" || mode === "shell" || mode === "custom") && slug) {
    return getChunkedRouteData(mode, slug);
  }

  return {
    landing: true,
    routes: chunkedLandingLinks,
  };
}
