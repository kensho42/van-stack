import { van } from "van-stack/render";
import { renderShowcaseFrame } from "../components/chrome";
import { renderEditorialHero } from "../components/editorial";
import { renderRuntimePanel } from "../components/runtime";
import {
  showcaseAuthors,
  showcaseCategories,
  showcasePosts,
  showcaseTags,
} from "../content/blog";
import {
  getShowcaseMode,
  type ShowcaseLiveModeId,
  showcaseModes,
} from "../content/modes";

const { a, article, code, div, h2, li, p, pre, section, ul } = van.tags;

function renderModeCard(modeId: ShowcaseLiveModeId) {
  const mode = getShowcaseMode(modeId);
  if (!mode) {
    throw new Error(`Missing walkthrough mode: ${modeId}`);
  }

  return article(
    { class: "editorial-card editorial-card--compact" },
    p({ class: "showcase-eyebrow" }, mode.deliveryLabel),
    h2(a({ href: mode.walkthroughPath }, `${mode.title} walkthrough`)),
    p({ class: "editorial-summary" }, mode.proves),
    p({ class: "showcase-subtle" }, mode.dataBoundary),
    p(
      a({ href: mode.galleryPath }, "Open live route"),
      " ",
      a({ href: `/gallery/${mode.id}` }, "Open mode landing"),
    ),
  );
}

export function renderWalkthroughIndex() {
  return renderShowcaseFrame({
    currentPath: "/walkthrough",
    children: [
      renderEditorialHero({
        eyebrow: "Guided Walkthrough",
        title: "How to evaluate Northstar Journal",
        summary:
          "Use these mode notes when you want the live route and the implementation story side by side.",
        detail:
          "Each walkthrough page links straight back into the matching gallery mode and calls out the runtime boundary that matters most.",
      }),
      section(
        { class: "showcase-section-block" },
        h2("Shared product surface"),
        p(
          `Every walkthrough assumes the same editorial graph: ${showcasePosts.length} posts, ${showcaseAuthors.length} authors, ${showcaseCategories.length} categories, and ${showcaseTags.length} tags.`,
        ),
        p(
          "That consistency is what makes the runtime differences legible instead of noisy.",
        ),
      ),
      section(
        { class: "editorial-section" },
        div(
          { class: "section-heading" },
          h2("Mode guides"),
          p(
            { class: "showcase-subtle" },
            "Read the explanation first, then jump into the live route with the same entity.",
          ),
        ),
        div(
          { class: "card-grid" },
          ...showcaseModes.map((mode) => renderModeCard(mode.id)),
        ),
      ),
    ],
  });
}

export function renderModeWalkthrough(input: {
  modeId: ShowcaseLiveModeId;
  title: string;
  checkpoints: string[];
  implementationNotes: string[];
  transportNotes: string[];
  sampleHtml?: string;
}) {
  const mode = getShowcaseMode(input.modeId);
  if (!mode) {
    throw new Error(`Missing showcase mode: ${input.modeId}`);
  }

  return renderShowcaseFrame({
    currentPath: mode.walkthroughPath,
    currentModeId: mode.id,
    children: [
      renderEditorialHero({
        eyebrow: "Mode walkthrough",
        title: input.title,
        summary: mode.proves,
        detail: mode.dataBoundary,
      }),
      renderRuntimePanel(mode.id),
      section(
        { class: "showcase-section-block" },
        h2("What to verify"),
        ul(...input.checkpoints.map((item) => li(item))),
      ),
      section(
        { class: "showcase-section-block" },
        h2("Implementation touchpoints"),
        ul(...input.implementationNotes.map((item) => li(code(item)))),
      ),
      section(
        { class: "showcase-section-block" },
        h2("Route surface to click"),
        ul(
          li(a({ href: `/gallery/${mode.id}` }, `${mode.title} homepage`)),
          li(a({ href: `/gallery/${mode.id}/posts` }, "Posts index")),
          li(a({ href: `/gallery/${mode.id}/authors` }, "Authors index")),
          li(a({ href: `/gallery/${mode.id}/categories` }, "Categories index")),
          li(a({ href: `/gallery/${mode.id}/tags` }, "Tags index")),
          li(a({ href: mode.galleryPath }, "Canonical comparison post")),
        ),
      ),
      section(
        { class: "showcase-section-block" },
        h2("Data boundary"),
        ul(...input.transportNotes.map((item) => li(item))),
      ),
      input.sampleHtml
        ? section(
            { class: "showcase-section-block" },
            h2("Generated sample"),
            pre(input.sampleHtml),
          )
        : null,
    ],
  });
}
