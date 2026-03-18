import { startClientApp } from "van-stack/csr";

import routes from "../../.van-stack/routes.chunked.generated";

const app = startClientApp({
  mode: "shell",
  routes: [...routes],
  history: window.history,
  rootSelector: "[data-showcase-client-root]",
});

void app.ready;
