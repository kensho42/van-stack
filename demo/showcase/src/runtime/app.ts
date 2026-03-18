import { fileURLToPath } from "node:url";

import { internalDataBasePath } from "van-stack";

import { loadRoutes } from "../../../../packages/compiler/src/index";
import { renderRequest } from "../../../../packages/ssr/src/index";
import { handleCustomApiRequest, handleInternalDataRequest } from "./api";
import { createShowcaseAssetResponse } from "./assets";
import { ShowcaseRouteNotFoundError } from "./data";
import {
  resolveShowcaseSession,
  showcaseSessionCookieName,
} from "./interactions";
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
            : route.id.startsWith("gallery/islands/")
              ? "islands"
              : "document-only",
        })) as ShowcaseRenderRoutes,
    );
  }

  return routesPromise;
}

function getClientAssetTag(pathname: string) {
  if (pathname.startsWith("/gallery/hydrated")) {
    return '<script type="module" src="/assets/showcase-hydrated.js" data-showcase-hydrated=""></script>';
  }
  if (pathname.startsWith("/gallery/islands")) {
    return '<script type="module" src="/assets/showcase-islands.js" data-showcase-islands=""></script>';
  }
  if (pathname.startsWith("/gallery/shell")) {
    return '<script type="module" src="/assets/showcase-shell.js" data-showcase-shell=""></script>';
  }
  if (pathname.startsWith("/gallery/custom")) {
    return '<script type="module" src="/assets/showcase-custom.js" data-showcase-custom=""></script>';
  }
  if (pathname.startsWith("/gallery/chunked")) {
    return '<script type="module" src="/assets/showcase-chunked.js" data-showcase-chunked=""></script>';
  }

  return null;
}

function shouldPrimeShowcaseSession(pathname: string) {
  return (
    pathname.startsWith("/gallery/hydrated/posts/") ||
    pathname.startsWith("/gallery/islands/posts/")
  );
}

function withShowcaseSession(request: Request) {
  const session = resolveShowcaseSession(request);

  if (!session.setCookie) {
    return {
      request,
      setCookie: null,
    };
  }

  const headers = new Headers(request.headers);
  headers.set("cookie", `${showcaseSessionCookieName}=${session.sessionId}`);

  return {
    request: new Request(request, {
      headers,
    }),
    setCookie: session.setCookie,
  };
}

async function renderFrameworkRoute(request: Request, pathname: string) {
  const sessionRequest = shouldPrimeShowcaseSession(pathname)
    ? withShowcaseSession(request)
    : { request, setCookie: null };
  const response = await renderRequest({
    request: sessionRequest.request,
    routes: await getShowcaseRoutes(),
  });

  if (response.status === 404) {
    return renderRouteNotFound();
  }

  const assetTag = getClientAssetTag(pathname);
  if (!assetTag) {
    if (!sessionRequest.setCookie) {
      return response;
    }

    const headers = new Headers(response.headers);
    headers.set("set-cookie", sessionRequest.setCookie);

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  }

  const html = await response.text();

  const headers = new Headers({
    "content-type":
      response.headers.get("content-type") ?? "text/html; charset=utf-8",
  });
  if (sessionRequest.setCookie) {
    headers.set("set-cookie", sessionRequest.setCookie);
  }

  return new Response(html.replace("</body>", `${assetTag}</body>`), {
    status: response.status,
    headers,
  });
}

export async function handleShowcaseRequest(request: Request) {
  const { pathname } = new URL(request.url);

  if (pathname.startsWith("/assets/")) {
    const assetResponse = await createShowcaseAssetResponse(pathname);
    return assetResponse ?? renderRouteNotFound();
  }

  if (pathname.startsWith(internalDataBasePath)) {
    return handleInternalDataRequest(request);
  }

  if (pathname.startsWith("/api/showcase")) {
    return handleCustomApiRequest(request);
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

  try {
    return await renderFrameworkRoute(request, pathname);
  } catch (error) {
    if (error instanceof ShowcaseRouteNotFoundError) {
      return renderEntityNotFound();
    }

    throw error;
  }
}
