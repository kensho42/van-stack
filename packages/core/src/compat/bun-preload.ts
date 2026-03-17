import { fileURLToPath } from "node:url";

function getCompatPath(relativePath: string) {
  return fileURLToPath(new URL(relativePath, import.meta.url));
}

type BunPluginBuilder = {
  onResolve: (
    input: { filter: RegExp; namespace?: string },
    callback: () => { path: string },
  ) => void;
};

type BunLike = {
  plugin: (input: {
    name: string;
    setup: (build: BunPluginBuilder) => void;
  }) => void;
};

function registerBunCompatAliases() {
  const bunRuntime = (globalThis as { Bun?: BunLike }).Bun;

  if (!bunRuntime || typeof bunRuntime.plugin !== "function") {
    return;
  }

  bunRuntime.plugin({
    name: "van-stack:compat-aliases",
    setup(build) {
      build.onResolve({ filter: /^vanjs-core$/, namespace: "file" }, () => ({
        path: getCompatPath("./vanjs-core.ts"),
      }));
      build.onResolve({ filter: /^vanjs-ext$/, namespace: "file" }, () => ({
        path: getCompatPath("./vanjs-ext.ts"),
      }));
    },
  });
}

registerBunCompatAliases();
