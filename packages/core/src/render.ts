export type VanState<T> = {
  val: T;
};

type VanTags = Record<string, CallableFunction>;
export type VanLike = {
  tags: VanTags;
  state: CallableFunction;
  derive: CallableFunction;
  add: CallableFunction;
  hydrate: CallableFunction;
};

export type RenderEnv = {
  van: VanLike;
};

const renderEnvKey = Symbol.for("van-stack.render-env");

type GlobalRenderEnv = typeof globalThis & {
  [renderEnvKey]?: RenderEnv | null;
};

function getRenderEnvState() {
  const globalRenderEnv = globalThis as GlobalRenderEnv;
  return globalRenderEnv[renderEnvKey] ?? null;
}

function setRenderEnvState(env: RenderEnv | null) {
  const globalRenderEnv = globalThis as GlobalRenderEnv;
  globalRenderEnv[renderEnvKey] = env;
}

function getBoundRenderEnv(): RenderEnv {
  const renderEnv = getRenderEnvState();
  if (!renderEnv) {
    throw new Error(
      "van-stack/render has not been bound to a Van runtime yet.",
    );
  }

  return renderEnv;
}

function getBoundVan(): VanLike {
  return getBoundRenderEnv().van;
}

export function bindRenderEnv(env: RenderEnv | null) {
  setRenderEnvState(env);
}

export function getRenderEnv() {
  return getRenderEnvState();
}

export const van: VanLike = {
  get tags() {
    return getBoundVan().tags;
  },
  state(value: unknown) {
    return getBoundVan().state(value);
  },
  derive(fn: () => unknown) {
    return getBoundVan().derive(fn);
  },
  add(...args: unknown[]) {
    return getBoundVan().add(...args);
  },
  hydrate(...args: unknown[]) {
    return getBoundVan().hydrate(...args);
  },
};
