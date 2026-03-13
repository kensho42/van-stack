import { renderModeWalkthrough } from "../../../route-helpers/walkthrough";

export default function page() {
  return renderModeWalkthrough({
    modeId: "ssr",
    title: "SSR walkthrough",
    checkpoints: [
      "The initial response already contains the full article, author, category, and tag content.",
      "There is no app root takeover marker and no bootstrap payload in the HTML.",
      "A fresh request for any archive page should still feel like a traditional server-rendered blog.",
    ],
    implementationNotes: [
      "demo/showcase/src/routes/gallery/ssr/index/page.ts",
      "demo/showcase/src/routes/gallery/ssr/posts/[slug]/loader.ts",
      "demo/showcase/src/runtime/app.ts",
    ],
    transportNotes: [
      "The server resolves route loaders before sending HTML.",
      "No client asset is required for the page to be complete.",
      "This is the baseline for comparing the other modes.",
    ],
  });
}
