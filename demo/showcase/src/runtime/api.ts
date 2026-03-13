import { internalDataBasePath } from "van-stack";

import {
  createCustomApiPayload,
  createGalleryPageDataFromPath,
  ShowcaseRouteNotFoundError,
} from "./data";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

export function handleInternalDataRequest(pathname: string) {
  const routePath = pathname.slice(internalDataBasePath.length) || "/";
  const normalizedPath = routePath.startsWith("/")
    ? routePath
    : `/${routePath}`;

  try {
    return jsonResponse(createGalleryPageDataFromPath(normalizedPath));
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

export function handleCustomApiRequest(pathname: string) {
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
