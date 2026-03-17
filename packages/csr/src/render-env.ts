import vanCore from "actual-vanjs-core";
import * as vanXRuntime from "actual-vanjs-ext";

import { bindRenderEnv } from "../../core/src/render";

export function bindClientRenderEnv() {
  bindRenderEnv({
    van: vanCore,
    vanX: vanXRuntime,
  });
  return vanCore;
}
