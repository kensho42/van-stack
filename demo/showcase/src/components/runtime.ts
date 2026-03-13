import { van } from "van-stack/render";

import {
  getShowcaseInitialLikeCount,
  type ShowcasePost,
} from "../content/blog";
import {
  buildShowcaseGalleryPath,
  getShowcaseMode,
  getSiblingShowcaseModes,
  type ShowcaseLiveModeId,
  type ShowcaseModeId,
} from "../content/modes";

const { a, button, div, h2, li, p, section, span, strong, ul } = van.tags;
const interactiveModeIds = new Set<ShowcaseModeId>([
  "hydrated",
  "islands",
  "shell",
  "custom",
]);

export type ShowcaseComparisonTarget = {
  collection: "posts" | "authors" | "categories" | "tags";
  slug: string;
  label: string;
};

export function getModeCallout(modeId: ShowcaseModeId) {
  const mode = getShowcaseMode(modeId);
  if (mode) {
    return {
      title: `${mode.title} Mode`,
      body: mode.proves,
      href: mode.galleryPath,
    };
  }

  throw new Error(`Unknown showcase mode: ${modeId}`);
}

export function renderModePill(modeId: ShowcaseLiveModeId) {
  const mode = getShowcaseMode(modeId);
  if (!mode) {
    throw new Error(`Unknown showcase mode: ${modeId}`);
  }

  return span({ class: `mode-pill mode-pill--${mode.id}` }, mode.title);
}

export function modeHasReaderPulse(modeId: ShowcaseModeId) {
  return interactiveModeIds.has(modeId);
}

export function renderRuntimePanel(modeId: ShowcaseLiveModeId) {
  const mode = getShowcaseMode(modeId);
  if (!mode) {
    throw new Error(`Unknown showcase mode: ${modeId}`);
  }

  return section(
    { class: "runtime-panel" },
    div(
      { class: "runtime-panel__head" },
      renderModePill(modeId),
      strong(mode.deliveryLabel),
    ),
    p(mode.summary),
    p({ class: "showcase-subtle" }, mode.dataBoundary),
  );
}

export function renderReaderPulse(
  post: ShowcasePost,
  modeId: ShowcaseLiveModeId,
) {
  if (!modeHasReaderPulse(modeId)) {
    return null;
  }

  const mode = getShowcaseMode(modeId);
  if (!mode) {
    throw new Error(`Unknown showcase mode: ${modeId}`);
  }

  return section(
    { class: "showcase-section-block", "data-post-slug": post.slug },
    h2("Reader pulse"),
    p(
      modeId === "islands"
        ? "This page keeps navigation on the server and hydrates only focused post interactions."
        : "This interaction persists for the current browser session without changing the underlying editorial route.",
    ),
    div(
      { class: "taxonomy-row" },
      a(
        {
          href: buildShowcaseGalleryPath(modeId, "posts", post.slug),
          "data-van-stack-ignore": "",
        },
        "Open this story fresh",
      ),
    ),
    div(
      { class: "card-grid card-grid--tight" },
      section(
        { class: "runtime-panel" },
        p({ class: "showcase-eyebrow" }, "Reaction"),
        strong("Session likes"),
        p(
          span(
            { "data-like-count": "" },
            String(getShowcaseInitialLikeCount(post)),
          ),
          " readers found this helpful",
        ),
        // Buttons stay in normal flow so shell/custom/islands all share the same DOM markers.
        button({ "data-like-button": "", type: "button" }, "Like this post"),
      ),
      section(
        { class: "runtime-panel" },
        p({ class: "showcase-eyebrow" }, "Save state"),
        strong("Reading list"),
        p({ "data-bookmark-state": "" }, "Not saved"),
        button(
          { "data-bookmark-button": "", type: "button" },
          "Save for later",
        ),
      ),
    ),
  );
}

export function renderSiblingModeLinks(
  currentModeId: ShowcaseLiveModeId,
  target: ShowcaseComparisonTarget,
) {
  return section(
    { class: "runtime-panel runtime-panel--comparison" },
    h2("Compare this route in other modes"),
    p(
      { class: "showcase-subtle" },
      "Keep the same entity and switch only the delivery contract.",
    ),
    ul(
      ...getSiblingShowcaseModes(currentModeId).map((mode) =>
        li(
          a(
            {
              href: buildShowcaseGalleryPath(
                mode.id,
                target.collection,
                target.slug,
              ),
              "data-van-stack-ignore": "",
            },
            `${mode.title}: ${target.label}`,
          ),
        ),
      ),
    ),
  );
}
