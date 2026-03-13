import { van } from "van-stack/render";

import {
  buildShowcaseGalleryPath,
  getShowcaseMode,
  getSiblingShowcaseModes,
  type ShowcaseLiveModeId,
  type ShowcaseModeId,
} from "../content/modes";

const { a, div, h2, li, p, section, span, strong, ul } = van.tags;

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

  if (modeId === "adaptive") {
    return {
      title: "Adaptive Mode",
      body: "Legacy adaptive showcase routes remain available only until the runtime gallery rewrite removes them.",
      href: "/gallery",
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

export function renderRuntimePanel(modeId: ShowcaseLiveModeId) {
  const mode = getShowcaseMode(modeId);
  if (!mode) {
    throw new Error(`Unknown showcase mode: ${modeId}`);
  }

  return section(
    { class: "runtime-panel" },
    div({ class: "runtime-panel__head" }, renderModePill(modeId), strong(mode.deliveryLabel)),
    p(mode.summary),
    p({ class: "showcase-subtle" }, mode.dataBoundary),
  );
}

export function renderSiblingModeLinks(
  currentModeId: ShowcaseLiveModeId,
  target: ShowcaseComparisonTarget,
) {
  return section(
    { class: "runtime-panel runtime-panel--comparison" },
    h2("Compare this route in other modes"),
    p({ class: "showcase-subtle" }, "Keep the same entity and switch only the delivery contract."),
    ul(
      ...getSiblingShowcaseModes(currentModeId).map((mode) =>
        li(
          a(
            {
              href: buildShowcaseGalleryPath(mode.id, target.collection, target.slug),
            },
            `${mode.title}: ${target.label}`,
          ),
        ),
      ),
    ),
  );
}
