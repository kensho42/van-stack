import { startClientApp } from "van-stack/csr";

import routes from "../../.van-stack/routes.generated";

async function resolveChunkedRouteData(match: {
  pathname: string;
  query: URLSearchParams;
}) {
  const search = match.query.size > 0 ? `?${match.query.toString()}` : "";
  const response = await fetch(`/api/chunked-csr${match.pathname}${search}`);

  if (!response.ok) {
    throw new Error(
      `Chunked CSR custom data request failed: ${response.status}`,
    );
  }

  return response.json();
}

const app = startClientApp({
  mode: "custom",
  routes: [...routes],
  history: window.history,
  resolve: resolveChunkedRouteData,
});

void app.ready;
