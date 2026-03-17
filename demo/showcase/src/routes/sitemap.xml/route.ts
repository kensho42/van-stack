import { showcaseCanonicalPostSlug } from "../../content/blog";
import { showcaseModes } from "../../content/modes";

export default function route(input: { request: Request }) {
  const url = new URL(input.request.url);
  const paths = [
    "/",
    "/gallery",
    "/walkthrough",
    ...showcaseModes.flatMap((mode) => [
      `/gallery/${mode.id}`,
      `/gallery/${mode.id}/posts/${showcaseCanonicalPostSlug}`,
      `/walkthrough/${mode.id}`,
    ]),
  ];
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map((path) => `  <url><loc>${url.origin}${path}</loc></url>`),
    "</urlset>",
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8",
    },
  });
}
