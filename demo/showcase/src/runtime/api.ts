import { internalDataBasePath } from "van-stack";

import {
  createCustomApiPayload,
  createGalleryPageDataFromPath,
  ShowcaseRouteNotFoundError,
} from "./data";
import {
  likeShowcasePost,
  readShowcaseInteractionState,
  resolveShowcaseSession,
  toggleShowcaseBookmark,
} from "./interactions";

function jsonResponse(
  data: unknown,
  status = 200,
  headers?: Record<string, string>,
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function getInteractionSlug(pathname: string) {
  const match = /^\/api\/showcase\/posts\/([^/]+)\/interactions$/.exec(
    pathname,
  );
  return match?.[1] ?? null;
}

async function readJsonBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {};
  }

  return (await request.json()) as Record<string, unknown>;
}

function getSessionHeaders(request: Request) {
  const session = resolveShowcaseSession(request);

  return {
    sessionId: session.sessionId,
    headers: session.setCookie
      ? { "set-cookie": session.setCookie }
      : undefined,
  };
}

export function handleInternalDataRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const routePath = pathname.slice(internalDataBasePath.length) || "/";
  const normalizedPath = routePath.startsWith("/")
    ? routePath
    : `/${routePath}`;

  try {
    return jsonResponse(
      createGalleryPageDataFromPath(normalizedPath, { request }),
    );
  } catch (error) {
    if (error instanceof ShowcaseRouteNotFoundError) {
      return jsonResponse(
        {
          error: error.message,
          pathname: error.pathname,
        },
        404,
      );
    }

    throw error;
  }
}

export async function handleCustomApiRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const interactionSlug = getInteractionSlug(pathname);

  if (interactionSlug) {
    const { sessionId, headers } = getSessionHeaders(request);

    try {
      if (request.method === "POST") {
        const body = await readJsonBody(request);
        const action = body.action;

        if (action === "like") {
          return jsonResponse(
            likeShowcasePost(sessionId, interactionSlug),
            200,
            headers,
          );
        }

        if (action === "bookmark") {
          return jsonResponse(
            toggleShowcaseBookmark(sessionId, interactionSlug),
            200,
            headers,
          );
        }

        return jsonResponse(
          {
            error: `Unknown interaction action: ${String(action ?? "")}`,
          },
          400,
          headers,
        );
      }

      return jsonResponse(
        readShowcaseInteractionState(sessionId, interactionSlug),
        200,
        headers,
      );
    } catch (error) {
      if (error instanceof ShowcaseRouteNotFoundError) {
        return jsonResponse(
          {
            error: error.message,
            pathname,
          },
          404,
          headers,
        );
      }

      throw error;
    }
  }

  try {
    return jsonResponse(createCustomApiPayload(pathname));
  } catch (error) {
    if (error instanceof ShowcaseRouteNotFoundError) {
      return jsonResponse(
        {
          error: error.message,
          pathname: error.pathname,
        },
        404,
      );
    }

    throw error;
  }
}
