# Loaders And Actions

`loader.ts` handles route reads for `GET`.

`action.ts` handles mutations through a method-agnostic request contract. The MVP keeps `GET` and `POST` ergonomic while preserving room for `PUT`, `PATCH`, and `DELETE`.

`loader.ts` is used by SSR, SSG, `hydrated`, and `shell` mode apps. `custom` CSR mode bypasses `loader.ts` and either lets the host app provide route data through its own resolver or skips route-level loading entirely so components can fetch for themselves.
