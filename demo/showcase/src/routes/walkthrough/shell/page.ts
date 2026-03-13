import { renderModeWalkthrough } from "../../../route-helpers/walkthrough";

export default function page() {
  return renderModeWalkthrough({
    modeId: "shell",
    title: "Shell walkthrough",
    checkpoints: [
      "The HTML document is only a shell and does not include the article body.",
      "The client router fetches page data from /_van-stack/data/... after boot.",
      "Once loaded, the page should expose the same authors, categories, and tags as the SSR modes.",
    ],
    implementationNotes: [
      "demo/showcase/src/runtime/api.ts",
      "demo/showcase/src/client/shell.ts",
      "demo/showcase/src/client/routes.ts",
    ],
    transportNotes: [
      "The router owns the transport fetches through the internal VanStack data surface.",
      "The shell document validates the path but leaves content loading to the browser entry.",
      "This mode proves route-driven loading without SSR article HTML.",
    ],
  });
}
