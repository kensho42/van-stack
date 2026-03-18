export * from "./hydrate-app";
export * from "./render-env";
export * from "./router";
export * from "./start-client-app";

import { bindClientRenderEnv } from "./render-env";

export const csrPackageName = "van-stack/csr";

bindClientRenderEnv();
