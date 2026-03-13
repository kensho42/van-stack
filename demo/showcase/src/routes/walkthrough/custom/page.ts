import { renderModeWalkthrough } from "../../../route-helpers/walkthrough";

export default function page() {
  return renderModeWalkthrough({
    modeId: "custom",
    title: "Custom walkthrough",
    checkpoints: [
      "The route shell still comes from the client, but data is fetched from /api/showcase/... instead of the internal transport surface.",
      "VanStack still owns route matching, navigation, params, and history.",
      "The same blog graph renders after the JSON response comes back.",
    ],
    implementationNotes: [
      "demo/showcase/src/runtime/api.ts",
      "demo/showcase/src/client/custom.ts",
      "demo/showcase/src/runtime/data.ts",
    ],
    transportNotes: [
      "The router does not preload data in custom mode.",
      "Route rendering performs app-owned fetches against the demo API.",
      "This keeps the showcase honest about where data ownership lives.",
    ],
  });
}
