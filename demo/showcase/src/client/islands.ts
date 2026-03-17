import { hydrateIslands } from "van-stack/csr";

import { islandsClientRoutes } from "./routes";

const hydration = hydrateIslands({
  routes: [...islandsClientRoutes],
});

await hydration.ready;
