import { renderModeWalkthrough } from "../../../route-helpers/walkthrough";

export default function page() {
  return renderModeWalkthrough({
    modeId: "islands",
    title: "Hydrated islands walkthrough",
    checkpoints: [
      "The initial response is full server-rendered HTML with focused interactive controls already in place.",
      "A small client entry hydrates only the post interaction islands instead of taking over routing.",
      "Navigation remains document-driven while the like and save state persists for the session.",
    ],
    implementationNotes: [
      "demo/showcase/src/routes/gallery/islands/posts/[slug]/hydrate.ts",
      "demo/showcase/src/client/islands.ts",
      "packages/csr/src/hydrate-app.ts",
    ],
    transportNotes: [
      "SSR owns the document and route loading.",
      "hydrateIslands({ routes }) attaches focused behavior without a client router.",
      "This mode isolates per-component hydration from full-app takeover.",
    ],
  });
}
