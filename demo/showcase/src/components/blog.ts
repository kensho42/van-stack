import type { ShowcasePost } from "../content/blog";

export function getPostEyebrow(post: ShowcasePost) {
  return `${post.primaryCategory.name} · ${post.readTimeMinutes} min read`;
}

export function getPostByline(post: ShowcasePost) {
  return `By ${post.author.name} · ${post.publishedAt}`;
}

export function formatTagline(post: ShowcasePost) {
  return post.tags.map((tag) => tag.name).join(" / ");
}
