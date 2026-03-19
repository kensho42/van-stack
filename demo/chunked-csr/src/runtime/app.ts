import { fileURLToPath } from "node:url";

import {
  internalDataBasePath,
  matchPath,
  type RouteLoaderModule,
  type RouteModuleLoader,
} from "van-stack";
import { loadRoutes } from "van-stack/compiler";
import { renderRequest } from "van-stack/ssr";
import { createChunkedCsrAssetResponse, warmChunkedCsrAssets } from "./assets";

export { warmChunkedCsrAssets } from "./assets";

type ChunkedCsrRoutes = Parameters<typeof renderRequest>[0]["routes"];

const routesRoot = fileURLToPath(new URL("../routes", import.meta.url));
const customApiBasePath = "/api/chunked-csr";
let routesPromise: Promise<ChunkedCsrRoutes> | null = null;

function getMode(pathname: string) {
  if (pathname.startsWith("/hydrated/")) return "hydrated";
  if (pathname.startsWith("/shell/")) return "shell";
  if (pathname.startsWith("/shell-workbench/")) return "shell";
  if (pathname.startsWith("/custom/")) return "custom";
  return "landing";
}

async function getChunkedCsrRoutes() {
  if (!routesPromise) {
    routesPromise = loadRoutes({ root: routesRoot }).then((routes) =>
      routes.map((route) => ({
        ...route,
        hydrationPolicy: route.id === "index" ? "document-only" : "app",
      })),
    );
  }

  return routesPromise;
}

async function resolveRouteModule<T>(
  directValue: T | undefined,
  factory: RouteModuleLoader<T> | undefined,
) {
  if (directValue) {
    return directValue;
  }
  if (!factory) {
    return undefined;
  }

  const module = await factory();
  return module.default;
}

function createRouteRequest(request: Request, path: string) {
  const url = new URL(request.url);
  const routeUrl = new URL(path, url.origin);

  return new Request(routeUrl, request);
}

function findMatchedRoute(routes: ChunkedCsrRoutes, path: string) {
  const pathname = new URL(path, "https://van-stack.local").pathname;

  for (const route of routes) {
    const match = matchPath(route.path, pathname);
    if (!match) {
      continue;
    }

    return {
      params: match.params,
      route,
    };
  }

  return null;
}

function getRoutePathFromPrefixedPath(pathname: string, prefix: string) {
  const suffix = pathname.slice(prefix.length);

  if (!suffix) {
    return "/";
  }

  return suffix.startsWith("/") ? suffix : `/${suffix}`;
}

function stripBootstrap(html: string) {
  return html.replace(
    /<script type="application\/json" data-van-stack-bootstrap>[\s\S]*?<\/script>/,
    "",
  );
}

function getClientAssetTag(pathname: string) {
  const mode = getMode(pathname);
  if (mode === "landing") {
    return null;
  }

  return `<script type="module" src="/assets/chunked-csr-${mode}.js" data-chunked-csr-mode="${mode}"></script>`;
}

async function renderRouteDataResponse(request: Request, path: string) {
  const match = findMatchedRoute(await getChunkedCsrRoutes(), path);
  if (!match) {
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    });
  }

  const loader = await resolveRouteModule<RouteLoaderModule>(
    match.route.loader,
    match.route.files?.loader,
  );
  const data = loader
    ? await loader({
        params: match.params,
        request: createRouteRequest(request, path),
      })
    : null;

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

async function renderChunkedCsrDocument(request: Request) {
  const { pathname } = new URL(request.url);
  const response = await renderRequest({
    request,
    routes: await getChunkedCsrRoutes(),
  });

  if (response.status === 404) {
    return new Response(
      "<!doctype html><html><head><title>Not Found</title></head><body><h1>Chunked CSR page not found</h1></body></html>",
      {
        status: 404,
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      },
    );
  }

  let html = await response.text();
  const mode = getMode(pathname);
  const assetTag = getClientAssetTag(pathname);

  if (mode === "shell" || mode === "custom") {
    html = stripBootstrap(html);
  }

  if (assetTag) {
    await warmChunkedCsrAssets();
    html = html.replace("</body>", `${assetTag}</body>`);
  }

  return new Response(html, {
    status: response.status,
    headers: {
      "content-type":
        response.headers.get("content-type") ?? "text/html; charset=utf-8",
    },
  });
}

export async function handleChunkedCsrRequest(request: Request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith("/assets/")) {
    const assetResponse = await createChunkedCsrAssetResponse(url.pathname);
    return (
      assetResponse ??
      new Response(
        "<!doctype html><html><head><title>Not Found</title></head><body><h1>Chunked CSR asset not found</h1></body></html>",
        {
          status: 404,
          headers: {
            "content-type": "text/html; charset=utf-8",
          },
        },
      )
    );
  }

  if (url.pathname.startsWith(internalDataBasePath)) {
    return renderRouteDataResponse(
      request,
      `${getRoutePathFromPrefixedPath(url.pathname, internalDataBasePath)}${url.search}`,
    );
  }

  if (url.pathname.startsWith(customApiBasePath)) {
    return renderRouteDataResponse(
      request,
      `${getRoutePathFromPrefixedPath(url.pathname, customApiBasePath)}${url.search}`,
    );
  }

  return renderChunkedCsrDocument(request);
}
