import { startClientApp } from "van-stack/csr";

import { hydratedClientRoutes } from "./routes";

const app = startClientApp({
  mode: "hydrated",
  routes: [...hydratedClientRoutes],
});

void app.ready;
