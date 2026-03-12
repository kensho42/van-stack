import { registerEnv } from "mini-van-plate/shared";
import vanPlate from "mini-van-plate/van-plate";

import { bindRenderEnv, type VanLike } from "../../core/src/render";

let serverVan: VanLike | null = null;

function createServerVan(): VanLike {
  return {
    ...vanPlate,
    hydrate() {
      throw new Error("van.hydrate is unavailable in the current runtime.");
    },
  };
}

export function bindServerRenderEnv() {
  registerEnv({ van: vanPlate });
  serverVan ??= createServerVan();
  bindRenderEnv(serverVan);
  return serverVan;
}
