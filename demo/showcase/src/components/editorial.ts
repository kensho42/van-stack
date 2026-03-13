import { van } from "van-stack/render";

import {
  type ShowcaseAuthor,
  type ShowcaseCategory,
  type ShowcasePost,
  type ShowcaseTag,
  showcasePublication,
} from "../content/blog";
import {
  buildShowcaseGalleryPath,
  type ShowcaseLiveModeId,
} from "../content/modes";
import { getPostByline, getPostEyebrow } from "./blog";

const {
  a,
  article,
  div,
  h1,
  h2,
  h3,
  header,
  li,
  p,
  section,
  span,
  strong,
  time,
  ul,
} = van.tags;

export function renderEditorialHero(input: {
  eyebrow: string;
  title: string;
  summary: string;
  detail?: string;
}) {
  return header(
    { class: "showcase-hero" },
    p({ class: "showcase-eyebrow" }, input.eyebrow),
    h1(input.title),
    p({ class: "showcase-lede" }, input.summary),
    input.detail ? p({ class: "showcase-subtle" }, input.detail) : null,
  );
}

export function renderPostCard(
  post: ShowcasePost,
  modeId: ShowcaseLiveModeId,
  tone: "feature" | "compact" = "feature",
) {
  return article(
    {
      class:
        tone === "feature"
          ? "editorial-card editorial-card--feature"
          : "editorial-card editorial-card--compact",
    },
    p({ class: "showcase-eyebrow" }, getPostEyebrow(post)),
    h3(
      a(
        { href: buildShowcaseGalleryPath(modeId, "posts", post.slug) },
        post.title,
      ),
    ),
    p({ class: "editorial-summary" }, post.summary),
    div(
      { class: "editorial-meta" },
      span(post.author.name),
      span("·"),
      time({ datetime: post.publishedOn }, post.publishedAt),
    ),
    div(
      { class: "taxonomy-row" },
      ...post.tags.map((tag) => renderTagChip(tag, modeId)),
    ),
  );
}

export function renderAuthorCard(
  author: ShowcaseAuthor,
  modeId: ShowcaseLiveModeId,
  postCount: number,
) {
  return article(
    { class: "editorial-card editorial-card--compact" },
    p({ class: "showcase-eyebrow" }, author.role),
    h3(
      a(
        { href: buildShowcaseGalleryPath(modeId, "authors", author.slug) },
        author.name,
      ),
    ),
    p({ class: "editorial-summary" }, author.bio),
    p({ class: "showcase-subtle" }, `${author.location} · ${postCount} posts`),
  );
}

export function renderCategoryCard(
  category: ShowcaseCategory,
  modeId: ShowcaseLiveModeId,
  postCount: number,
) {
  return article(
    { class: "editorial-card editorial-card--compact" },
    p({ class: "showcase-eyebrow" }, category.strapline),
    h3(
      a(
        { href: buildShowcaseGalleryPath(modeId, "categories", category.slug) },
        category.name,
      ),
    ),
    p({ class: "editorial-summary" }, category.description),
    p({ class: "showcase-subtle" }, `${postCount} stories in ${category.name}`),
  );
}

export function renderTagChip(tag: ShowcaseTag, modeId: ShowcaseLiveModeId) {
  return a(
    {
      class: "taxonomy-chip",
      href: buildShowcaseGalleryPath(modeId, "tags", tag.slug),
    },
    `#${tag.name}`,
  );
}

export function renderTagCard(
  tag: ShowcaseTag,
  modeId: ShowcaseLiveModeId,
  postCount: number,
) {
  return article(
    { class: "editorial-card editorial-card--compact" },
    p({ class: "showcase-eyebrow" }, "Cross-cutting tag"),
    h3(
      a({ href: buildShowcaseGalleryPath(modeId, "tags", tag.slug) }, tag.name),
    ),
    p({ class: "editorial-summary" }, tag.description),
    p({ class: "showcase-subtle" }, `${postCount} connected stories`),
  );
}

export function renderPostGrid(
  title: string,
  posts: ShowcasePost[],
  modeId: ShowcaseLiveModeId,
  tone: "feature" | "compact" = "feature",
) {
  return section(
    { class: "editorial-section" },
    div(
      { class: "section-heading" },
      h2(title),
      p({ class: "showcase-subtle" }, showcasePublication.tagline),
    ),
    div(
      {
        class: tone === "feature" ? "card-grid" : "card-grid card-grid--tight",
      },
      ...posts.map((post) => renderPostCard(post, modeId, tone)),
    ),
  );
}

export function renderCollectionGrid(
  title: string,
  subtitle: string,
  cards: unknown[],
) {
  return section(
    { class: "editorial-section" },
    div(
      { class: "section-heading" },
      h2(title),
      p({ class: "showcase-subtle" }, subtitle),
    ),
    div({ class: "card-grid card-grid--tight" }, ...cards),
  );
}

export function renderArticleLayout(
  post: ShowcasePost,
  modeId: ShowcaseLiveModeId,
  relatedPosts: ShowcasePost[],
) {
  return article(
    { class: "article-shell" },
    header(
      { class: "article-header" },
      p({ class: "showcase-eyebrow" }, getPostEyebrow(post)),
      h1(post.title),
      p({ class: "showcase-lede" }, post.summary),
      p({ class: "showcase-subtle" }, getPostByline(post)),
      div(
        { class: "taxonomy-row" },
        ...post.tags.map((tag) => renderTagChip(tag, modeId)),
      ),
    ),
    ...post.sections.map((sectionData) =>
      section(
        { class: "article-section" },
        h2(sectionData.heading),
        ...sectionData.paragraphs.map((paragraph) => p(paragraph)),
      ),
    ),
    section(
      { class: "article-section article-section--highlight" },
      h2("Reader checklist"),
      ul(...post.highlights.map((highlight) => li(highlight))),
    ),
    section(
      { class: "article-section" },
      h2("Related posts"),
      div(
        { class: "card-grid card-grid--tight" },
        ...relatedPosts.map((relatedPost) =>
          renderPostCard(relatedPost, modeId, "compact"),
        ),
      ),
    ),
  );
}

export function renderArchiveIntro(input: {
  eyebrow: string;
  title: string;
  summary: string;
  metric: string;
}) {
  return section(
    { class: "archive-intro" },
    p({ class: "showcase-eyebrow" }, input.eyebrow),
    h1(input.title),
    p({ class: "showcase-lede" }, input.summary),
    p({ class: "showcase-subtle" }, input.metric),
  );
}

export function renderAuthorDetail(
  author: ShowcaseAuthor,
  posts: ShowcasePost[],
  modeId: ShowcaseLiveModeId,
) {
  return div(
    renderArchiveIntro({
      eyebrow: author.role,
      title: author.name,
      summary: author.bio,
      metric: `${author.location} · ${posts.length} published stories`,
    }),
    renderPostGrid("Recent stories", posts, modeId, "compact"),
  );
}

export function renderCategoryDetail(
  category: ShowcaseCategory,
  posts: ShowcasePost[],
  modeId: ShowcaseLiveModeId,
) {
  return div(
    renderArchiveIntro({
      eyebrow: "Category archive",
      title: category.name,
      summary: category.description,
      metric: `${posts.length} stories · ${category.strapline}`,
    }),
    renderPostGrid("Stories in this category", posts, modeId, "compact"),
  );
}

export function renderTagDetail(
  tag: ShowcaseTag,
  posts: ShowcasePost[],
  modeId: ShowcaseLiveModeId,
) {
  return div(
    renderArchiveIntro({
      eyebrow: "Tag archive",
      title: `#${tag.name}`,
      summary: tag.description,
      metric: `${posts.length} connected stories`,
    }),
    renderPostGrid("Stories carrying this tag", posts, modeId, "compact"),
  );
}

export function renderNotFoundState(title: string, body: string) {
  return section(
    { class: "editorial-section editorial-empty" },
    h1(title),
    p(body),
    strong(showcasePublication.name),
  );
}
