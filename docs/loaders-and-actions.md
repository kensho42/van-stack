# Loaders And Actions

`loader.ts` handles route reads for `GET`.

Loaders receive `{ params, request }`, so SSR and hydrated routes can read cookies, headers, or the current URL from the normal route contract.

`action.ts` handles mutations through a method-agnostic request contract. The MVP keeps `GET` and `POST` ergonomic while preserving room for `PUT`, `PATCH`, and `DELETE`.

`loader.ts` is used by SSR, SSG, `hydrated`, and `shell` mode apps. `custom` CSR mode bypasses `loader.ts` and either lets the host app provide route data through its own resolver or skips route-level loading entirely so components can fetch for themselves.

`route.ts` is for full raw responses. Use it when the endpoint is not an HTML document, or when you need full control over status, headers, body, and content type.
