export type VanState<T> = {
  val: T;
};

type VanTags = Record<string, CallableFunction>;
export type VanXLike = {
  calc: CallableFunction;
  reactive: CallableFunction;
  noreactive: CallableFunction;
  stateFields: CallableFunction;
  raw: CallableFunction;
  list: CallableFunction;
  replace: CallableFunction;
  compact: CallableFunction;
};

export type VanLike = {
  tags: VanTags;
  state: CallableFunction;
  derive: CallableFunction;
  add: CallableFunction;
  hydrate: CallableFunction;
};

export type RenderEnv = {
  van: VanLike;
  vanX: VanXLike;
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

function getBoundVanX(): VanXLike {
  return getBoundRenderEnv().vanX;
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

export const vanX: VanXLike = {
  get calc() {
    return getBoundVanX().calc;
  },
  get reactive() {
    return getBoundVanX().reactive;
  },
  get noreactive() {
    return getBoundVanX().noreactive;
  },
  get stateFields() {
    return getBoundVanX().stateFields;
  },
  get raw() {
    return getBoundVanX().raw;
  },
  get list() {
    return getBoundVanX().list;
  },
  get replace() {
    return getBoundVanX().replace;
  },
  get compact() {
    return getBoundVanX().compact;
  },
};
