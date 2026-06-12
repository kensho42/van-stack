import { dummyVanX, registerEnv } from "mini-van-plate/shared";
import vanPlate from "mini-van-plate/van-plate";

import { bindCompatVanX } from "../../core/src/compat/vanx-env";
import {
  bindRenderEnv,
  type RenderEnv,
  type VanLike,
} from "../../core/src/render";

let serverEnv: RenderEnv | null = null;

function createServerVan(): VanLike {
  return {
    ...vanPlate,
    hydrate() {
      throw new Error("van.hydrate is unavailable in the current runtime.");
    },
  };
}

export function bindServerRenderEnv() {
  registerEnv({ van: vanPlate, vanX: dummyVanX });
  if (!serverEnv) {
    serverEnv = {
      van: createServerVan(),
    };
  }
  const env = serverEnv;
  bindRenderEnv(env);
  bindCompatVanX(dummyVanX);
  return env.van;
}
