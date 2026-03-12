export type VanState<T> = {
  val: T;
};

type VanTags = Record<string, CallableFunction>;

export type VanLike = {
  tags: VanTags;
  state: CallableFunction;
  derive: CallableFunction;
  add: CallableFunction;
};

let renderEnv: VanLike | null = null;

function getBoundRenderEnv(): VanLike {
  if (!renderEnv) {
    throw new Error(
      "van-stack/render has not been bound to a Van runtime yet.",
    );
  }

  return renderEnv;
}

export function bindRenderEnv(vanImpl: VanLike | null) {
  renderEnv = vanImpl;
}

export function getRenderEnv() {
  return renderEnv;
}

export const van: VanLike = {
  get tags() {
    return getBoundRenderEnv().tags;
  },
  state(value: unknown) {
    return getBoundRenderEnv().state(value);
  },
  derive(fn: () => unknown) {
    return getBoundRenderEnv().derive(fn);
  },
  add(...args: unknown[]) {
    return getBoundRenderEnv().add(...args);
  },
};
