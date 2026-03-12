# Route Handlers Design

## Summary

Add `route.ts` as a reserved route module for raw `Request -> Response` handling, and unify `van-stack/ssr` around real `Response` output for both document and non-document routes.

## Goals

- Support non-HTML routes such as `robots.txt`, `sitemap.xml`, feeds, proxy endpoints, and webhooks.
- Keep `page.ts` focused on HTML document rendering.
- Make `renderRequest` return a real `Response` for all matched routes.
- Keep SSG file output HTML-oriented while reusing the new SSR `Response` surface internally.

## Design

- Add `route.ts` to the reserved route filenames.
- The compiler includes `route.ts` in normalized route files and generated manifests.
- In SSR:
  - if a matched route has `route.ts`, call it and return its `Response`
  - otherwise render `page.ts` and wrap the HTML document in a `Response`
- `loader.ts`, `meta.ts`, layouts, hydration payloads, and HTML document generation stay part of the `page.ts` path.
- `route.ts` bypasses those document-specific concerns.

## Validation

- compiler tests should recognize `route.ts`
- SSR tests should assert `Response` output for HTML routes
- SSR tests should assert raw text responses for `route.ts`
- README and docs should mention `route.ts` and `robots.txt`
