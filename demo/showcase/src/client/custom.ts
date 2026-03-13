import { createRouter } from "van-stack/csr";

import {
  customClientRoutes,
  fetchCustomPageData,
  getClientRoot,
  renderClientLoading,
  renderClientPage,
  wireClientNavigation,
} from "./routes";

const root = getClientRoot(document);
const router = createRouter({
  mode: "custom",
  routes: [...customClientRoutes],
  history: window.history,
});

wireClientNavigation(router, { document, window });

router.subscribe(async (entry) => {
  renderClientLoading(
    root,
    "Loading custom route",
    "Northstar Journal is fetching JSON directly from the demo API.",
  );

  try {
    const data = await fetchCustomPageData(entry.path);
    renderClientPage(root, data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Custom showcase API failed.";
    renderClientLoading(root, "Custom route unavailable", message);
  }
});

await router.load(`${window.location.pathname}${window.location.search}`);
