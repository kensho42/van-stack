import vanCore from "vanjs-core";
import * as vanXRuntime from "vanjs-ext";

import { bindRenderEnv } from "../../core/src/render";

export function bindClientRenderEnv() {
  bindRenderEnv({
    van: vanCore,
    vanX: vanXRuntime,
  });
  return vanCore;
}
