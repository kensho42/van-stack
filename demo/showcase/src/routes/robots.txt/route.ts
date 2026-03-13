export default function route(input: { request: Request }) {
  const url = new URL(input.request.url);

  return new Response(
    `User-agent: *\nAllow: /\nSitemap: ${url.origin}/sitemap.xml\n`,
    {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    },
  );
}
