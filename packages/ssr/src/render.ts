import {
  defaultHydrationPolicy,
  matchPath,
  type RouteMeta,
} from "../../core/src/index";
import { bindServerRenderEnv } from "./render-env";

type ModuleLoader<T> = () => Promise<{ default: T }>;
type RouteHandler = (input: {
  request: Request;
  params: Record<string, string>;
}) => Promise<Response> | Response;
type RouteLayout = (input: {
  children: unknown;
  data: unknown;
  params: Record<string, string>;
  path: string;
}) => Promise<string> | string;

type RouteDefinition = {
  id: string;
  path: string;
  hydrationPolicy?: string;
  layoutChain?: ModuleLoader<RouteLayout>[];
  route?: RouteHandler;
  loader?: (input: {
    params: Record<string, string>;
    request: Request;
  }) => Promise<unknown> | unknown;
  meta?: (input: {
    params: Record<string, string>;
    data: unknown;
  }) => Promise<RouteMeta> | RouteMeta;
  page?: (input: { data: unknown }) => Promise<string> | string;
  files?: {
    route?: ModuleLoader<RouteHandler>;
    loader?: ModuleLoader<
      (input: {
        params: Record<string, string>;
        request: Request;
      }) => Promise<unknown> | unknown
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

type RenderablePageOutput = {
  render?: () => string;
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

function wrapPageBody(body: string, hydrationPolicy: string | undefined) {
  if (hydrationPolicy === "app") {
    return `<div data-van-stack-app-root="">${body}</div>`;
  }

  return body;
}

function renderPageOutput(output: unknown): string {
  if (
    output &&
    typeof output === "object" &&
    typeof (output as RenderablePageOutput).render === "function"
  ) {
    return (output as RenderablePageOutput).render?.() ?? "";
  }

  return String(output ?? "");
}

async function applyLayouts(
  body: unknown,
  route: RouteDefinition,
  data: unknown,
  params: Record<string, string>,
  path: string,
) {
  let output = body;

  for (const layoutLoader of [...(route.layoutChain ?? [])].reverse()) {
    const module = await layoutLoader();
    output = await module.default({
      children: output,
      data,
      params,
      path,
    });
  }

  return renderPageOutput(output);
}

export async function renderRequest(input: RenderRequestInput) {
  bindServerRenderEnv();
  const requestPath = getRequestPath(input.request);

  for (const route of input.routes) {
    const match = matchPath(route.path, requestPath.pathname);
    if (!match) continue;

    const routeHandler = await resolveRouteModule(
      route.route,
      route.files?.route,
    );
    if (routeHandler) {
      return routeHandler({
        request: input.request,
        params: match.params,
      });
    }

    const loader = await resolveRouteModule(route.loader, route.files?.loader);
    const metaHandler = await resolveRouteModule(route.meta, route.files?.meta);
    const page = await resolveRouteModule(route.page, route.files?.page);

    if (!page) {
      throw new Error(`Route "${route.id}" is missing a page module.`);
    }

    const hydrationPolicy = route.hydrationPolicy ?? defaultHydrationPolicy;
    const data = loader
      ? await loader({ params: match.params, request: input.request })
      : null;
    const meta = metaHandler
      ? await metaHandler({ params: match.params, data })
      : undefined;
    const pageOutput = await page({ data });
    const body = wrapPageBody(
      await applyLayouts(
        pageOutput,
        route,
        data,
        match.params,
        requestPath.path,
      ),
      hydrationPolicy,
    );
    const bootstrap =
      hydrationPolicy !== "document-only"
        ? `<script type="application/json" data-van-stack-bootstrap>${JSON.stringify(
            {
              routeId: route.id,
              path: requestPath.path,
              pathname: requestPath.pathname,
              params: match.params,
              hydrationPolicy,
              data,
            },
          )}</script>`
        : "";

    return new Response(
      `<!doctype html><html><head>${buildHead(meta)}</head><body>${body}${bootstrap}</body></html>`,
      {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      },
    );
  }

  return new Response(
    "<!doctype html><html><head></head><body><h1>Not Found</h1></body></html>",
    {
      status: 404,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    },
  );
}
