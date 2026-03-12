import { registerEnv } from "mini-van-plate/shared";
import vanPlate from "mini-van-plate/van-plate";

import { bindRenderEnv } from "../../core/src/render";

export function bindServerRenderEnv() {
  registerEnv({ van: vanPlate });
  bindRenderEnv(vanPlate);
  return vanPlate;
}
