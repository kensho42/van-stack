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

let renderEnv: RenderEnv | null = null;

function getBoundRenderEnv(): RenderEnv {
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
  renderEnv = env;
}

export function getRenderEnv() {
  return renderEnv;
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
