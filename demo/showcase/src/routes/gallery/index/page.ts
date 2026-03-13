import { van } from "van-stack/render";
import { renderShowcaseFrame } from "../../../components/chrome";
import { renderEditorialHero } from "../../../components/editorial";
import { showcaseModes } from "../../../content/modes";

const { a, article, div, h2, p, section } = van.tags;

export default function page() {
  return renderShowcaseFrame({
    currentPath: "/gallery",
    children: [
      renderEditorialHero({
        eyebrow: "Runtime Gallery",
        title: "Compare one blog app across five delivery modes",
        summary:
          "Every card below opens the same publication through a different runtime contract so you can compare output, boot behavior, and navigation honestly.",
        detail:
          "Start with the canonical post in each mode, then move sideways into authors, categories, and tags.",
      }),
      section(
        { class: "editorial-section" },
        div(
          { class: "section-heading" },
          h2("Mode cards"),
          p(
            { class: "showcase-subtle" },
            "Each mode card sends you to the same comparison slug first.",
          ),
        ),
        div(
          { class: "card-grid" },
          ...showcaseModes.map((mode) =>
            article(
              { class: "editorial-card editorial-card--feature" },
              p({ class: "showcase-eyebrow" }, mode.deliveryLabel),
              h2(a({ href: mode.galleryPath }, mode.title)),
              p({ class: "editorial-summary" }, mode.proves),
              p({ class: "showcase-subtle" }, mode.dataBoundary),
              p(
                a({ href: `/gallery/${mode.id}` }, "Mode landing"),
                " ",
                a({ href: mode.walkthroughPath }, "Walkthrough"),
              ),
            ),
          ),
        ),
      ),
    ],
  });
}
