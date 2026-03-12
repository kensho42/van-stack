export type ShowcaseAuthor = {
  slug: string;
  name: string;
  role: string;
};

export type ShowcasePost = {
  slug: string;
  title: string;
  summary: string;
  excerpt: string;
  category: string;
  readTimeMinutes: number;
  publishedAt: string;
  tags: string[];
  author: ShowcaseAuthor;
  relatedSlugs: string[];
};

const authors = {
  "marta-solis": {
    slug: "marta-solis",
    name: "Marta Solis",
    role: "Product Lead",
  },
  "niko-drummond": {
    slug: "niko-drummond",
    name: "Niko Drummond",
    role: "Platform Engineer",
  },
  "ivy-chen": {
    slug: "ivy-chen",
    name: "Ivy Chen",
    role: "Developer Experience",
  },
} satisfies Record<string, ShowcaseAuthor>;

export const showcasePosts = [
  {
    slug: "launch-week-notes",
    title: "Launch Week Notes",
    summary: "How the team shaped the first evaluator-ready demo week.",
    excerpt:
      "A behind-the-scenes look at which runtime demos landed first and why.",
    category: "Product",
    readTimeMinutes: 6,
    publishedAt: "March 10, 2026",
    tags: ["launch", "product", "roadmap"],
    author: authors["marta-solis"],
    relatedSlugs: ["runtime-gallery-tour", "adaptive-threads-in-practice"],
  },
  {
    slug: "runtime-gallery-tour",
    title: "Runtime Gallery Tour",
    summary: "What evaluators should notice as they move across runtime modes.",
    excerpt:
      "A field guide to the same blog app rendered through hydrated, shell, custom, SSG, and adaptive paths.",
    category: "Engineering",
    readTimeMinutes: 7,
    publishedAt: "March 8, 2026",
    tags: ["runtime", "csr", "ssr"],
    author: authors["niko-drummond"],
    relatedSlugs: ["launch-week-notes", "shell-routing-with-real-content"],
  },
  {
    slug: "shell-routing-with-real-content",
    title: "Shell Routing With Real Content",
    summary: "Why the shell demo should still feel like a believable blog app.",
    excerpt:
      "Using one shared content graph keeps the shell path comparable instead of feeling like a toy example.",
    category: "Architecture",
    readTimeMinutes: 5,
    publishedAt: "March 6, 2026",
    tags: ["shell", "transport", "routing"],
    author: authors["ivy-chen"],
    relatedSlugs: ["runtime-gallery-tour", "launch-week-notes"],
  },
  {
    slug: "adaptive-threads-in-practice",
    title: "Adaptive Threads In Practice",
    summary: "How replace and stack presentations change the reading flow.",
    excerpt:
      "A narrative example showing when adaptive navigation should swap context or preserve a reading stack.",
    category: "UX",
    readTimeMinutes: 4,
    publishedAt: "March 4, 2026",
    tags: ["adaptive", "navigation", "ux"],
    author: authors["marta-solis"],
    relatedSlugs: ["runtime-gallery-tour", "launch-week-notes"],
  },
] satisfies ShowcasePost[];

export function getShowcasePost(slug: string) {
  return showcasePosts.find((post) => post.slug === slug);
}

export function getRelatedPosts(post: ShowcasePost, limit = 2): ShowcasePost[] {
  return post.relatedSlugs
    .map((slug) => getShowcasePost(slug))
    .filter((candidate): candidate is ShowcasePost => candidate !== undefined)
    .filter((candidate) => candidate.slug !== post.slug)
    .slice(0, limit);
}
