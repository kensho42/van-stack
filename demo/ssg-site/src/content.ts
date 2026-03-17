export type DemoPost = {
  slug: string;
  title: string;
  summary: string;
  body: string;
};

export const demoPosts: DemoPost[] = [
  {
    slug: "launch-week",
    title: "Launch Week",
    summary:
      "Static pages, copied assets, and raw route output from one build.",
    body: "This demo exports a dist tree that can be served by any generic web server.",
  },
  {
    slug: "cdn-cutover",
    title: "CDN Cutover",
    summary: "Entries expand dynamic routes into concrete pages at build time.",
    body: "The build script uses loadRoutes plus exportStaticSite to materialize HTML files.",
  },
];

export function getDemoPost(slug: string) {
  return demoPosts.find((post) => post.slug === slug) ?? null;
}
