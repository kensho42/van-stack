import { renderShowcaseFrame } from "../components/chrome";
import {
  renderArticleLayout,
  renderAuthorCard,
  renderAuthorDetail,
  renderCategoryCard,
  renderCategoryDetail,
  renderCollectionGrid,
  renderEditorialHero,
  renderNotFoundState,
  renderPostGrid,
  renderTagCard,
  renderTagDetail,
  type ShowcaseLinkBuilder,
} from "../components/editorial";
import {
  renderReaderPulse,
  renderRuntimePanel,
  renderSiblingModeLinks,
} from "../components/runtime";
import { buildShowcaseGalleryPath } from "../content/modes";
import type { GalleryPageData } from "../runtime/data";

export function renderGalleryPage(data: GalleryPageData) {
  const buildPath: ShowcaseLinkBuilder = (collection, slug) =>
    buildShowcaseGalleryPath(data.mode.id, collection, slug);

  switch (data.pageType) {
    case "home":
      return renderShowcaseFrame({
        currentPath: data.path,
        currentModeId: data.mode.id,
        children: [
          renderEditorialHero({
            eyebrow: `${data.mode.title} gallery`,
            title: "Northstar Journal",
            summary:
              "Browse the same publication graph through one runtime at a time, then switch modes without changing the editorial domain.",
            detail: data.mode.proves,
          }),
          renderRuntimePanel(data.mode.id),
          renderPostGrid("Featured stories", data.featuredPosts, buildPath),
          renderPostGrid(
            "Latest from the newsroom",
            data.recentPosts,
            buildPath,
            "compact",
          ),
          renderCollectionGrid(
            "Authors",
            "Recurring voices make the demo feel like a real publication.",
            data.authors.map((item) =>
              renderAuthorCard(item.author, buildPath, item.postCount),
            ),
          ),
          renderCollectionGrid(
            "Categories",
            "Every category stays navigable in every runtime mode.",
            data.categories.map((item) =>
              renderCategoryCard(item.category, buildPath, item.postCount),
            ),
          ),
          renderCollectionGrid(
            "Tags",
            "Cross-cutting tags reveal how the same graph can be sliced sideways.",
            data.tags
              .slice(0, 8)
              .map((item) =>
                renderTagCard(item.tag, buildPath, item.postCount),
              ),
          ),
        ],
      });
    case "posts-index":
      return renderShowcaseFrame({
        currentPath: data.path,
        currentModeId: data.mode.id,
        children: [
          renderEditorialHero({
            eyebrow: `${data.mode.title} archive`,
            title: "All posts",
            summary:
              "A dense post index makes it easy to compare how each runtime handles archive-heavy browsing.",
            detail: data.mode.dataBoundary,
          }),
          renderRuntimePanel(data.mode.id),
          renderPostGrid("Editor picks", data.featuredPosts, buildPath),
          renderPostGrid("All stories", data.posts, buildPath, "compact"),
        ],
      });
    case "post-detail":
      return renderShowcaseFrame({
        currentPath: data.path,
        currentModeId: data.mode.id,
        children: [
          renderRuntimePanel(data.mode.id),
          renderArticleLayout(data.post, buildPath, data.related),
          renderReaderPulse(data.post, data.mode.id, data.interactions),
          renderSiblingModeLinks(data.mode.id, {
            collection: "posts",
            slug: data.post.slug,
            label: data.post.title,
          }),
        ],
      });
    case "authors-index":
      return renderShowcaseFrame({
        currentPath: data.path,
        currentModeId: data.mode.id,
        children: [
          renderEditorialHero({
            eyebrow: `${data.mode.title} archive`,
            title: "Authors",
            summary:
              "Northstar Journal treats authors as a first-class route family, not a byline afterthought.",
            detail: data.mode.summary,
          }),
          renderRuntimePanel(data.mode.id),
          renderCollectionGrid(
            "Contributors",
            "Each author has enough volume to support real browsing.",
            data.authors.map((item) =>
              renderAuthorCard(item.author, buildPath, item.postCount),
            ),
          ),
        ],
      });
    case "author-detail":
      return renderShowcaseFrame({
        currentPath: data.path,
        currentModeId: data.mode.id,
        children: [
          renderRuntimePanel(data.mode.id),
          renderAuthorDetail(data.author, data.posts, buildPath),
          renderSiblingModeLinks(data.mode.id, {
            collection: "authors",
            slug: data.author.slug,
            label: data.author.name,
          }),
        ],
      });
    case "categories-index":
      return renderShowcaseFrame({
        currentPath: data.path,
        currentModeId: data.mode.id,
        children: [
          renderEditorialHero({
            eyebrow: `${data.mode.title} archive`,
            title: "Categories",
            summary:
              "Categories frame the reading agenda of the publication and provide fast route-surface comparison across modes.",
            detail: data.mode.summary,
          }),
          renderRuntimePanel(data.mode.id),
          renderCollectionGrid(
            "Editorial desks",
            "Each category has a strapline and a meaningful archive depth.",
            data.categories.map((item) =>
              renderCategoryCard(item.category, buildPath, item.postCount),
            ),
          ),
        ],
      });
    case "category-detail":
      return renderShowcaseFrame({
        currentPath: data.path,
        currentModeId: data.mode.id,
        children: [
          renderRuntimePanel(data.mode.id),
          renderCategoryDetail(data.category, data.posts, buildPath),
          renderSiblingModeLinks(data.mode.id, {
            collection: "categories",
            slug: data.category.slug,
            label: data.category.name,
          }),
        ],
      });
    case "tags-index":
      return renderShowcaseFrame({
        currentPath: data.path,
        currentModeId: data.mode.id,
        children: [
          renderEditorialHero({
            eyebrow: `${data.mode.title} archive`,
            title: "Tags",
            summary:
              "Tags expose themes that cut across categories, authors, and runtime concerns.",
            detail: data.mode.summary,
          }),
          renderRuntimePanel(data.mode.id),
          renderCollectionGrid(
            "Cross-cutting topics",
            "Tag pages are one of the quickest ways to verify archive richness.",
            data.tags.map((item) =>
              renderTagCard(item.tag, buildPath, item.postCount),
            ),
          ),
        ],
      });
    case "tag-detail":
      return renderShowcaseFrame({
        currentPath: data.path,
        currentModeId: data.mode.id,
        children: [
          renderRuntimePanel(data.mode.id),
          renderTagDetail(data.tag, data.posts, buildPath),
          renderSiblingModeLinks(data.mode.id, {
            collection: "tags",
            slug: data.tag.slug,
            label: data.tag.name,
          }),
        ],
      });
    default:
      return renderShowcaseFrame({
        currentPath: "/gallery",
        children: [
          renderNotFoundState(
            "Showcase page not found",
            "The requested gallery route could not be assembled.",
          ),
        ],
      });
  }
}
