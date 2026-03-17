import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadRoutes } from "van-stack/compiler";
import { exportStaticSite } from "van-stack/ssg";

const routesRoot = fileURLToPath(new URL("./src/routes", import.meta.url));
const assetsRoot = fileURLToPath(new URL("./public", import.meta.url));

function getOutDir() {
  if (process.env.VAN_STACK_SSG_OUT_DIR) {
    return resolve(process.env.VAN_STACK_SSG_OUT_DIR);
  }

  return fileURLToPath(new URL("./dist", import.meta.url));
}

const outDir = getOutDir();
const routes = (await loadRoutes({
  root: routesRoot,
})) as Parameters<typeof exportStaticSite>[0]["routes"];

await rm(outDir, { recursive: true, force: true });

const result = await exportStaticSite({
  routes: routes.map((route) => ({
    ...route,
    hydrationPolicy: "document-only" as const,
  })),
  outDir,
  assets: [{ from: assetsRoot, to: "assets" }],
});

console.log(
  JSON.stringify(
    {
      outDir,
      writtenFiles: result.writtenFiles.sort(),
    },
    null,
    2,
  ),
);
