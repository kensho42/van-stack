export * from "./hydrate-app";
export * from "./render-env";
export * from "./router";

import { bindClientRenderEnv } from "./render-env";

export const csrPackageName = "van-stack/csr";

bindClientRenderEnv();
