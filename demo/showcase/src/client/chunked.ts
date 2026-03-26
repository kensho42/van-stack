import { startClientApp } from "van-stack/csr";

import { loadChunkedClientRoutes } from "./routes";

const routes = await loadChunkedClientRoutes();

const app = startClientApp({
  mode: "shell",
  routes,
  history: window.history,
  rootSelector: "[data-showcase-client-root]",
});

void app.ready;
