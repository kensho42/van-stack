import { startClientApp } from "van-stack/csr";

import routes from "../../.van-stack/routes.generated";

const app = startClientApp({
  mode: "hydrated",
  routes: [...routes],
  history: window.history,
});

void app.ready;
