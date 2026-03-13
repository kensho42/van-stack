import { van } from "van-stack/render";
import {
  getShowcaseTracks,
  renderShowcaseFrame,
} from "../../components/chrome";
import { renderEditorialHero } from "../../components/editorial";
import {
  showcaseAuthors,
  showcaseCategories,
  showcasePosts,
  showcasePublication,
  showcaseTags,
} from "../../content/blog";

const { a, article, div, h2, p, section } = van.tags;

export default function page() {
  return renderShowcaseFrame({
    currentPath: "/",
    children: [
      renderEditorialHero({
        eyebrow: showcasePublication.issue,
        title: "Northstar Journal Showcase",
        summary:
          "One shared blog app, two evaluator tracks, and five runtime modes you can compare route by route.",
        detail:
          "Use the Runtime Gallery for live behavior and the Guided Walkthrough for implementation context.",
      }),
      section(
        { class: "editorial-section" },
        div(
          { class: "section-heading" },
          h2("Choose a track"),
          p(
            { class: "showcase-subtle" },
            "Both tracks point at the same publication. They just optimize for different evaluator workflows.",
          ),
        ),
        div(
          { class: "card-grid" },
          ...getShowcaseTracks().map((track) =>
            article(
              { class: "editorial-card editorial-card--feature" },
              p({ class: "showcase-eyebrow" }, track.label),
              h2(a({ href: track.href }, track.label)),
              p({ class: "editorial-summary" }, track.description),
            ),
          ),
        ),
      ),
      section(
        { class: "showcase-section-block" },
        h2("Shared editorial graph"),
        p(
          `${showcasePosts.length} posts, ${showcaseAuthors.length} authors, ${showcaseCategories.length} categories, and ${showcaseTags.length} tags all route through the same Northstar Journal product.`,
        ),
      ),
    ],
  });
}
