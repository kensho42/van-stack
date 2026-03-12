import { bindServerRenderEnv } from "../../ssr/src/render-env";

export function bindStaticRenderEnv() {
  return bindServerRenderEnv();
}
