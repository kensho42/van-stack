# Route Conventions

Filesystem routing autoloads from `src/routes` and compiles into `.van-stack/routes.generated.ts`.

Reserved route filenames:

- `page.ts`
- `layout.ts`
- `loader.ts`
- `action.ts`
- `entries.ts`
- `meta.ts`
- `error.ts`

Bracket params like `[slug]` compile to canonical paths like `:slug`.

Helpers such as `_components` are ignored unless they use a reserved filename.

`meta.ts` is the route-level place for page metadata such as title, description, and canonical URL.

The generated JS manifest is the runtime bridge between route files and the CSR, SSR, or SSG entrypoints. Apps that do not want filesystem routing can still skip this and provide routes manually.
