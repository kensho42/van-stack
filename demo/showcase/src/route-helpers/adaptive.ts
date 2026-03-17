import { van } from "van-stack/render";

import {
  renderArticleLayout,
  renderAuthorCard,
  renderAuthorDetail,
  renderCategoryCard,
  renderCategoryDetail,
  renderCollectionGrid,
  renderEditorialHero,
  renderPostGrid,
  renderTagCard,
  renderTagDetail,
  type ShowcaseLinkBuilder,
} from "../components/editorial";
import type { GalleryPageData } from "../runtime/data";

const { div, h2, p, section } = van.tags;

export function buildAdaptivePath(
  collection: "posts" | "authors" | "categories" | "tags" = "posts",
  slug?: string,
) {
  if (!slug) {
    return collection === "posts"
      ? "/adaptive/posts"
      : `/adaptive/${collection}`;
  }

  return collection === "posts"
    ? `/adaptive/posts/${slug}`
    : `/adaptive/${collection}/${slug}`;
}

function renderAdaptivePanel(title: string, body: string) {
  return section(
    { class: "runtime-panel" },
    p({ class: "showcase-eyebrow" }, "Adaptive navigation"),
    h2(title),
    p(body),
  );
}

export function renderAdaptivePage(data: GalleryPageData) {
  const buildPath: ShowcaseLinkBuilder = (collection, slug) =>
    buildAdaptivePath(collection, slug);

  switch (data.pageType) {
    case "home":
      return div(
        renderEditorialHero({
          eyebrow: "Adaptive track",
          title: "Stack presentation",
          summary:
            "This track keeps the same Northstar Journal graph but frames it as an adaptive navigation surface instead of a rendering-mode comparison.",
          detail:
            "Use it to inspect how the shared route tree reads when the boundary declares stack presentation.",
        }),
        renderAdaptivePanel(
          "Shared route tree, different navigation framing",
          "The route graph is the same blog product. The adaptive layout changes how evaluators should read the journey, not what content exists.",
        ),
        renderPostGrid("Featured stories", data.featuredPosts, buildPath),
        renderPostGrid(
          "Latest from the newsroom",
          data.recentPosts,
          buildPath,
          "compact",
        ),
        renderCollectionGrid(
          "Authors",
          "Author archives remain part of the same adaptive surface.",
          data.authors.map((item) =>
            renderAuthorCard(item.author, buildPath, item.postCount),
          ),
        ),
        renderCollectionGrid(
          "Categories",
          "Every taxonomy route stays available inside the stack track.",
          data.categories.map((item) =>
            renderCategoryCard(item.category, buildPath, item.postCount),
          ),
        ),
        renderCollectionGrid(
          "Tags",
          "Cross-cutting tags still let evaluators move sideways through the publication.",
          data.tags
            .slice(0, 8)
            .map((item) => renderTagCard(item.tag, buildPath, item.postCount)),
        ),
      );
    case "posts-index":
      return div(
        renderEditorialHero({
          eyebrow: "Adaptive archive",
          title: "All posts",
          summary:
            "Stack presentation should still browse like a complete publication archive.",
        }),
        renderAdaptivePanel(
          "Archive density still matters",
          "The adaptive track is only credible if post, author, category, and tag routes remain rich enough to navigate for a while.",
        ),
        renderPostGrid("Editor picks", data.featuredPosts, buildPath),
        renderPostGrid("All stories", data.posts, buildPath, "compact"),
      );
    case "post-detail":
      return div(
        renderAdaptivePanel(
          "Detail routes stay first-class",
          "The adaptive layout surrounds the same story route with a stack-oriented frame instead of a mode-comparison frame.",
        ),
        renderArticleLayout(data.post, buildPath, data.related),
      );
    case "authors-index":
      return div(
        renderEditorialHero({
          eyebrow: "Adaptive archive",
          title: "Authors",
          summary:
            "Adaptive navigation still needs dense contributor routes, not just one-way article flows.",
        }),
        renderCollectionGrid(
          "Contributors",
          "Each author archive remains directly browsable inside the stack track.",
          data.authors.map((item) =>
            renderAuthorCard(item.author, buildPath, item.postCount),
          ),
        ),
      );
    case "author-detail":
      return div(
        renderAdaptivePanel(
          "Author archive in the stack",
          "Contributor routes should feel native to the adaptive track rather than bolted on after post detail pages.",
        ),
        renderAuthorDetail(data.author, data.posts, buildPath),
      );
    case "categories-index":
      return div(
        renderEditorialHero({
          eyebrow: "Adaptive archive",
          title: "Categories",
          summary:
            "Editorial desks stay navigable when the presentation boundary switches to stack.",
        }),
        renderCollectionGrid(
          "Editorial desks",
          "Category routes keep the same archive richness under adaptive navigation.",
          data.categories.map((item) =>
            renderCategoryCard(item.category, buildPath, item.postCount),
          ),
        ),
      );
    case "category-detail":
      return div(
        renderAdaptivePanel(
          "Category archive in context",
          "This route proves the stack track is more than a single post detail page.",
        ),
        renderCategoryDetail(data.category, data.posts, buildPath),
      );
    case "tags-index":
      return div(
        renderEditorialHero({
          eyebrow: "Adaptive archive",
          title: "Tags",
          summary:
            "Cross-cutting topics still give evaluators a sideways browsing path through the same content graph.",
        }),
        renderCollectionGrid(
          "Cross-cutting topics",
          "Tag pages keep the adaptive track from collapsing into a linear demo.",
          data.tags.map((item) =>
            renderTagCard(item.tag, buildPath, item.postCount),
          ),
        ),
      );
    case "tag-detail":
      return div(
        renderAdaptivePanel(
          "Tag archive in the stack",
          "Adaptive navigation still has to support routes that slice the graph across authors and categories.",
        ),
        renderTagDetail(data.tag, data.posts, buildPath),
      );
    default:
      return div(
        renderAdaptivePanel(
          "Adaptive route unavailable",
          "The requested adaptive page could not be assembled.",
        ),
      );
  }
}
