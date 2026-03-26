import { renderModeWalkthrough } from "../../../route-helpers/walkthrough";

export default function page() {
  return renderModeWalkthrough({
    modeId: "hydrated",
    title: "Hydrated walkthrough",
    checkpoints: [
      "The first response is server-rendered HTML with a bootstrap payload and app root marker.",
      "The canonical post detail page becomes interactive because the browser remounts the route from its page module by default.",
      "Subsequent navigation uses the client router and internal transport data.",
    ],
    implementationNotes: [
      "demo/showcase/src/routes/gallery/hydrated/posts/[slug]/page.ts",
      "demo/showcase/src/components/runtime.ts",
      "demo/showcase/src/client/routes.ts",
      "demo/showcase/src/client/hydrated.ts",
    ],
    transportNotes: [
      "SSR provides the initial payload and markup.",
      'startClientApp({ mode: "hydrated" }) uses hydrateApp(...) for the initial handoff and the shared client render queue for later navigations.',
      "Hydrated routes keep the same editorial chrome while defaulting to remount-based client continuity.",
    ],
  });
}
