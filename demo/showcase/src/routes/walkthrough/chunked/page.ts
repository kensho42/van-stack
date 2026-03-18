import { renderModeWalkthrough } from "../../../route-helpers/walkthrough";

export default function page() {
  return renderModeWalkthrough({
    modeId: "chunked",
    title: "Chunked walkthrough",
    checkpoints: [
      "The browser entry imports a generated route manifest so the bundler can split one chunk per route family.",
      "Navigation still uses the same transport-driven data loading as shell mode.",
      "The gallery proves route code loads lazily as you move across the archive.",
    ],
    implementationNotes: [
      "demo/showcase/src/client/chunked.ts",
      "demo/showcase/.van-stack/routes.chunked.generated.ts",
      "demo/showcase/src/runtime/assets.ts",
    ],
    transportNotes: [
      "The shell stays lean because page and loader modules are discovered from the generated manifest.",
      "The runtime serves the emitted chunk files alongside the entry bundle.",
      "This mode demonstrates route-level chunking inside the main showcase.",
    ],
  });
}
