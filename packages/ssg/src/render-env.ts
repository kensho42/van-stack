import {
  bindServerRenderEnv,
  withServerRenderEnv,
} from "../../ssr/src/render-env";

export function bindStaticRenderEnv() {
  return bindServerRenderEnv();
}

export function withStaticRenderEnv<T>(fn: () => T | Promise<T>) {
  return withServerRenderEnv(fn);
}
