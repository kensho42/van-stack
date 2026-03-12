import {
  defaultHydrationPolicy,
  matchPath,
  type RouteMeta,
} from "../../core/src/index";
import { bindServerRenderEnv } from "./render-env";

type ModuleLoader<T> = () => Promise<{ default: T }>;

type RouteDefinition = {
  id: string;
  path: string;
  hydrationPolicy?: string;
  loader?: (input: {
    params: Record<string, string>;
  }) => Promise<unknown> | unknown;
  meta?: (input: {
    params: Record<string, string>;
    data: unknown;
  }) => Promise<RouteMeta> | RouteMeta;
  page?: (input: { data: unknown }) => Promise<string> | string;
  files?: {
    loader?: ModuleLoader<
      (input: { params: Record<string, string> }) => Promise<unknown> | unknown
    >;
    meta?: ModuleLoader<
      (input: {
        params: Record<string, string>;
        data: unknown;
      }) => Promise<RouteMeta> | RouteMeta
    >;
    page?: ModuleLoader<(input: { data: unknown }) => Promise<string> | string>;
  };
};

type RenderRequestInput = {
  request: Request;
  routes: RouteDefinition[];
};

function getRequestPath(request: Request) {
  const url = new URL(request.url);

  return {
    pathname: url.pathname,
    path: `${url.pathname}${url.search}`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildHead(meta: RouteMeta | undefined): string {
  if (!meta) return "";

  const tags: string[] = [];

  if (meta.title) {
    tags.push(`<title>${escapeHtml(meta.title)}</title>`);
  }

  if (meta.description) {
    tags.push(
      `<meta name="description" content="${escapeHtml(meta.description)}">`,
    );
  }

  if (meta.canonical) {
    tags.push(`<link rel="canonical" href="${escapeHtml(meta.canonical)}">`);
  }

  if (meta.openGraph?.title) {
    tags.push(
      `<meta property="og:title" content="${escapeHtml(meta.openGraph.title)}">`,
    );
  }

  if (meta.openGraph?.description) {
    tags.push(
      `<meta property="og:description" content="${escapeHtml(meta.openGraph.description)}">`,
    );
  }

  return tags.join("");
}

async function resolveRouteModule<T>(
  directValue: T | undefined,
  factory: ModuleLoader<T> | undefined,
): Promise<T | undefined> {
  if (directValue) return directValue;
  if (!factory) return undefined;

  const module = await factory();
  return module.default;
}

export async function renderRequest(input: RenderRequestInput) {
  bindServerRenderEnv();
  const requestPath = getRequestPath(input.request);

  for (const route of input.routes) {
    const match = matchPath(route.path, requestPath.pathname);
    if (!match) continue;

    const loader = await resolveRouteModule(route.loader, route.files?.loader);
    const metaHandler = await resolveRouteModule(route.meta, route.files?.meta);
    const page = await resolveRouteModule(route.page, route.files?.page);

    if (!page) {
      throw new Error(`Route "${route.id}" is missing a page module.`);
    }

    const data = loader ? await loader({ params: match.params }) : null;
    const meta = metaHandler
      ? await metaHandler({ params: match.params, data })
      : undefined;
    const body = await page({ data });
    const bootstrap = JSON.stringify({
      routeId: route.id,
      path: requestPath.path,
      pathname: requestPath.pathname,
      params: match.params,
      hydrationPolicy: route.hydrationPolicy ?? defaultHydrationPolicy,
      data,
    });

    return {
      status: 200,
      html: `<!doctype html><html><head>${buildHead(meta)}</head><body>${body}<script type="application/json" data-van-stack-bootstrap>${bootstrap}</script></body></html>`,
    };
  }

  return {
    status: 404,
    html: "<!doctype html><html><head></head><body><h1>Not Found</h1></body></html>",
  };
}
