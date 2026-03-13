import { renderModeWalkthrough } from "../../../route-helpers/walkthrough";

export default function page() {
  return renderModeWalkthrough({
    modeId: "hydrated",
    title: "Hydrated walkthrough",
    checkpoints: [
      "The first response is server-rendered HTML with a bootstrap payload and app root marker.",
      "A small route-level interaction hydrates on the canonical post detail page.",
      "Subsequent navigation uses the client router and internal transport data.",
    ],
    implementationNotes: [
      "demo/showcase/src/routes/gallery/hydrated/posts/[slug]/page.ts",
      "demo/showcase/src/routes/gallery/hydrated/posts/[slug]/hydrate.ts",
      "demo/showcase/src/client/hydrated.ts",
    ],
    transportNotes: [
      "SSR provides the initial payload and markup.",
      "hydrateApp({ routes }) performs the takeover for in-app navigation.",
      "Hydrated routes keep the same editorial chrome while adding client continuity.",
    ],
  });
}
