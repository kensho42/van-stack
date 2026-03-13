import { fileURLToPath } from "node:url";

import { internalDataBasePath } from "van-stack";

import { loadRoutes } from "../../../../packages/compiler/src/index";
import { renderRequest } from "../../../../packages/ssr/src/index";
import { handleCustomApiRequest, handleInternalDataRequest } from "./api";
import { createShowcaseAssetResponse } from "./assets";
import {
  createGalleryPageDataFromPath,
  ShowcaseRouteNotFoundError,
} from "./data";
import { getShowcaseSsgPage } from "./ssg-cache";

type ShowcaseRenderRoutes = Parameters<typeof renderRequest>[0]["routes"];

const routesRoot = fileURLToPath(new URL("../routes", import.meta.url));
let routesPromise: Promise<ShowcaseRenderRoutes> | null = null;

function createHtml(title: string, body: string, status = 200) {
  return new Response(
    `<!doctype html><html><head><title>${title}</title></head><body>${body}</body></html>`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    },
  );
}

function renderRouteNotFound() {
  return createHtml(
    "Showcase page not found",
    `
      <main>
        <h1>Showcase page not found</h1>
        <p>Return to the landing page to choose a valid demo track.</p>
      </main>
    `,
    404,
  );
}

function renderEntityNotFound() {
  return createHtml(
    "Showcase content not found",
    `
      <main>
        <h1>Showcase content not found</h1>
        <p>The requested post, author, category, or tag does not exist in Northstar Journal.</p>
      </main>
    `,
    404,
  );
}

async function getShowcaseRoutes() {
  if (!routesPromise) {
    routesPromise = loadRoutes({ root: routesRoot }).then(
      (routes) =>
        routes.map((route) => ({
          ...route,
          hydrationPolicy: route.id.startsWith("gallery/hydrated/")
            ? "app"
            : "document-only",
        })) as ShowcaseRenderRoutes,
    );
  }

  return routesPromise;
}

function renderClientShell(pathname: string, mode: "shell" | "custom") {
  const assetPath =
    mode === "shell"
      ? "/assets/showcase-shell.js"
      : "/assets/showcase-custom.js";
  const shellId = mode === "shell" ? "showcase-shell" : "showcase-custom";
  const loadingCopy =
    mode === "shell"
      ? "Loading route data through the internal VanStack transport surface."
      : "Loading route data through the showcase JSON API.";

  return createHtml(
    `Northstar Journal ${mode}`,
    `
      <div
        id="${shellId}"
        data-showcase-client-root=""
        data-showcase-path="${pathname}"
        data-showcase-mode="${mode}"
      >
        <main>
          <h1>Northstar Journal</h1>
          <p>${loadingCopy}</p>
        </main>
      </div>
      <script type="module" src="${assetPath}" data-${shellId}=""></script>
    `,
  );
}

function isShellOrCustomPath(pathname: string) {
  return (
    pathname.startsWith("/gallery/shell") ||
    pathname.startsWith("/gallery/custom")
  );
}

function isHydratedPath(pathname: string) {
  return pathname.startsWith("/gallery/hydrated");
}

async function renderFrameworkRoute(request: Request, pathname: string) {
  const response = await renderRequest({
    request,
    routes: await getShowcaseRoutes(),
  });

  if (response.status === 404) {
    return renderRouteNotFound();
  }

  if (!isHydratedPath(pathname)) {
    return response;
  }

  const html = await response.text();

  return new Response(
    html.replace(
      "</body>",
      '<script type="module" src="/assets/showcase-hydrated.js" data-showcase-hydrated=""></script></body>',
    ),
    {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get("content-type") ?? "text/html; charset=utf-8",
      },
    },
  );
}

export async function handleShowcaseRequest(request: Request) {
  const { pathname } = new URL(request.url);

  if (pathname.startsWith("/assets/")) {
    const assetResponse = await createShowcaseAssetResponse(pathname);
    return assetResponse ?? renderRouteNotFound();
  }

  if (pathname.startsWith(internalDataBasePath)) {
    return handleInternalDataRequest(pathname);
  }

  if (pathname.startsWith("/api/showcase")) {
    return handleCustomApiRequest(pathname);
  }

  if (pathname.startsWith("/gallery/ssg")) {
    const page = await getShowcaseSsgPage(pathname);
    return page
      ? new Response(page.html, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
          },
        })
      : renderRouteNotFound();
  }

  if (isShellOrCustomPath(pathname)) {
    try {
      createGalleryPageDataFromPath(pathname);
      return renderClientShell(
        pathname,
        pathname.startsWith("/gallery/shell") ? "shell" : "custom",
      );
    } catch (error) {
      if (error instanceof ShowcaseRouteNotFoundError) {
        return renderEntityNotFound();
      }

      throw error;
    }
  }

  try {
    return await renderFrameworkRoute(request, pathname);
  } catch (error) {
    if (error instanceof ShowcaseRouteNotFoundError) {
      return renderEntityNotFound();
    }

    throw error;
  }
}
