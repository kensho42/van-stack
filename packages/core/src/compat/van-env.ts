export type VanState<T> = {
  val: T;
};

type VanTags = Record<string, CallableFunction> & CallableFunction;

export type VanLike = {
  tags: VanTags;
  state: CallableFunction;
  derive: CallableFunction;
  add: CallableFunction;
  hydrate: CallableFunction;
};

const compatVanKey = Symbol.for("van-stack.compat-van-env");

type GlobalCompatVan = typeof globalThis & {
  [compatVanKey]?: VanLike | null;
};

function getCompatVanState() {
  const globalCompatVan = globalThis as GlobalCompatVan;
  return globalCompatVan[compatVanKey] ?? null;
}

function setCompatVanState(van: VanLike | null) {
  const globalCompatVan = globalThis as GlobalCompatVan;
  globalCompatVan[compatVanKey] = van;
}

export function bindCompatVan(van: VanLike | null) {
  setCompatVanState(van);
}

export function getCompatVan() {
  const van = getCompatVanState();
  if (!van) {
    throw new Error(
      "van-stack/compat/vanjs-core has not been bound to a Van runtime yet.",
    );
  }

  return van;
}

const compatTags = new Proxy<CallableFunction>(function tags() {}, {
  get(_target, property) {
    if (typeof property !== "string") {
      return undefined;
    }

    return (...args: unknown[]) => getCompatVan().tags[property](...args);
  },
  apply(_target, _thisArg, args) {
    return (getCompatVan().tags as CallableFunction)(...args);
  },
}) as unknown as VanTags;

export const compatVan: VanLike = {
  tags: compatTags,
  state(value: unknown) {
    return getCompatVan().state(value);
  },
  derive(fn: () => unknown) {
    return getCompatVan().derive(fn);
  },
  add(...args: unknown[]) {
    return getCompatVan().add(...args);
  },
  hydrate(...args: unknown[]) {
    return getCompatVan().hydrate(...args);
  },
};
