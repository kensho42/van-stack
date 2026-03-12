import vanCore from "vanjs-core";

import { bindRenderEnv } from "../../core/src/render";

export function bindClientRenderEnv() {
  bindRenderEnv(vanCore);
  return vanCore;
}
