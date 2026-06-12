import vanCore from "vanjs-core";

import { bindRenderEnv } from "../../core/src/render";

export function bindClientRenderEnv() {
  bindRenderEnv({
    van: vanCore,
  });
  return vanCore;
}
