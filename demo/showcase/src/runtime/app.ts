import { fileURLToPath } from "node:url";

import { loadRoutes } from "../../../../packages/compiler/src/index";
import { renderRequest } from "../../../../packages/ssr/src/index";

import { getShowcasePost } from "../content/blog";

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

function renderPostNotFound() {
  return createHtml(
    "Post not found",
    `
      <main>
        <h1>Post not found</h1>
        <p>The showcase could not find that blog post.</p>
      </main>
    `,
    404,
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

function getRequestedPost(pathname: string) {
  const match = pathname.match(/^\/gallery\/[^/]+\/posts\/([^/]+)$/);
  if (!match) return null;
  return getShowcasePost(match[1] ?? "");
}

export async function handleShowcaseRequest(request: Request) {
  const { pathname } = new URL(request.url);

  if (pathname.includes("/posts/") && !getRequestedPost(pathname)) {
    return renderPostNotFound();
  }

  const response = await renderRequest({
    request,
    routes: await getShowcaseRoutes(),
  });

  if (response.status === 404) {
    return renderRouteNotFound();
  }

  return response;
}
