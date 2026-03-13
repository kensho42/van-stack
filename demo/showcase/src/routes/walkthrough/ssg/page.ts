import { renderModeWalkthrough } from "../../../route-helpers/walkthrough";

export default function page(input: { data: unknown }) {
  const data = input.data as { sampleHtml: string };

  return renderModeWalkthrough({
    modeId: "ssg",
    title: "SSG walkthrough",
    checkpoints: [
      "The served HTML is generated ahead of time and contains no bootstrap payload.",
      "Static homepage, list pages, and taxonomy detail pages are all materialized at startup.",
      "The output still uses the same shared page renderer as the live routes.",
    ],
    implementationNotes: [
      "demo/showcase/src/runtime/ssg-cache.ts",
      "demo/showcase/src/routes/gallery/ssg/posts/[slug]/entries.ts",
      "packages/ssg/src/build.ts",
    ],
    transportNotes: [
      "The startup cache builds static pages once and serves them directly.",
      "No client router or JSON fetch is required to read the page.",
      "Dynamic SSG routes expand through entries.ts while static routes no longer need entries.",
    ],
    sampleHtml: data.sampleHtml,
  });
}
