import type { ShowcasePost } from "../content/blog";

export function getPostEyebrow(post: ShowcasePost) {
  return `${post.category} · ${post.readTimeMinutes} min read`;
}

export function getPostByline(post: ShowcasePost) {
  return `By ${post.author.name} · ${post.publishedAt}`;
}
