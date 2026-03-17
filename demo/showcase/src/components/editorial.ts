import { van } from "van-stack/render";

import type {
  ShowcaseAuthor,
  ShowcaseCategory,
  ShowcasePost,
  ShowcaseTag,
} from "../content/blog";
import { showcasePublication } from "../content/publication";
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

export type ShowcaseCollection = "posts" | "authors" | "categories" | "tags";

export type ShowcaseLinkBuilder = (
  collection: ShowcaseCollection,
  slug: string,
) => string;

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
  buildPath: ShowcaseLinkBuilder,
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
    h3(a({ href: buildPath("posts", post.slug) }, post.title)),
    p({ class: "editorial-summary" }, post.summary),
    div(
      { class: "editorial-meta" },
      span(post.author.name),
      span("·"),
      time({ datetime: post.publishedOn }, post.publishedAt),
    ),
    div(
      { class: "taxonomy-row" },
      ...post.tags.map((tag) => renderTagChip(tag, buildPath)),
    ),
  );
}

export function renderAuthorCard(
  author: ShowcaseAuthor,
  buildPath: ShowcaseLinkBuilder,
  postCount: number,
) {
  return article(
    { class: "editorial-card editorial-card--compact" },
    p({ class: "showcase-eyebrow" }, author.role),
    h3(a({ href: buildPath("authors", author.slug) }, author.name)),
    p({ class: "editorial-summary" }, author.bio),
    p({ class: "showcase-subtle" }, `${author.location} · ${postCount} posts`),
  );
}

export function renderCategoryCard(
  category: ShowcaseCategory,
  buildPath: ShowcaseLinkBuilder,
  postCount: number,
) {
  return article(
    { class: "editorial-card editorial-card--compact" },
    p({ class: "showcase-eyebrow" }, category.strapline),
    h3(a({ href: buildPath("categories", category.slug) }, category.name)),
    p({ class: "editorial-summary" }, category.description),
    p({ class: "showcase-subtle" }, `${postCount} stories in ${category.name}`),
  );
}

export function renderTagChip(
  tag: ShowcaseTag,
  buildPath: ShowcaseLinkBuilder,
) {
  return a(
    {
      class: "taxonomy-chip",
      href: buildPath("tags", tag.slug),
    },
    `#${tag.name}`,
  );
}

export function renderTagCard(
  tag: ShowcaseTag,
  buildPath: ShowcaseLinkBuilder,
  postCount: number,
) {
  return article(
    { class: "editorial-card editorial-card--compact" },
    p({ class: "showcase-eyebrow" }, "Cross-cutting tag"),
    h3(a({ href: buildPath("tags", tag.slug) }, tag.name)),
    p({ class: "editorial-summary" }, tag.description),
    p({ class: "showcase-subtle" }, `${postCount} connected stories`),
  );
}

export function renderPostGrid(
  title: string,
  posts: ShowcasePost[],
  buildPath: ShowcaseLinkBuilder,
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
      ...posts.map((post) => renderPostCard(post, buildPath, tone)),
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
  buildPath: ShowcaseLinkBuilder,
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
        ...post.tags.map((tag) => renderTagChip(tag, buildPath)),
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
          renderPostCard(relatedPost, buildPath, "compact"),
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
  buildPath: ShowcaseLinkBuilder,
) {
  return div(
    renderArchiveIntro({
      eyebrow: author.role,
      title: author.name,
      summary: author.bio,
      metric: `${author.location} · ${posts.length} published stories`,
    }),
    renderPostGrid("Recent stories", posts, buildPath, "compact"),
  );
}

export function renderCategoryDetail(
  category: ShowcaseCategory,
  posts: ShowcasePost[],
  buildPath: ShowcaseLinkBuilder,
) {
  return div(
    renderArchiveIntro({
      eyebrow: "Category archive",
      title: category.name,
      summary: category.description,
      metric: `${posts.length} stories · ${category.strapline}`,
    }),
    renderPostGrid("Stories in this category", posts, buildPath, "compact"),
  );
}

export function renderTagDetail(
  tag: ShowcaseTag,
  posts: ShowcasePost[],
  buildPath: ShowcaseLinkBuilder,
) {
  return div(
    renderArchiveIntro({
      eyebrow: "Tag archive",
      title: `#${tag.name}`,
      summary: tag.description,
      metric: `${posts.length} connected stories`,
    }),
    renderPostGrid("Stories carrying this tag", posts, buildPath, "compact"),
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
