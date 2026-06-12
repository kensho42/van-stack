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

const compatVanXKey = Symbol.for("van-stack.compat-vanx-env");

type GlobalCompatVanX = typeof globalThis & {
  [compatVanXKey]?: VanXLike | null;
};

function getCompatVanXState() {
  const globalCompatVanX = globalThis as GlobalCompatVanX;
  return globalCompatVanX[compatVanXKey] ?? null;
}

function setCompatVanXState(vanX: VanXLike | null) {
  const globalCompatVanX = globalThis as GlobalCompatVanX;
  globalCompatVanX[compatVanXKey] = vanX;
}

export function bindCompatVanX(vanX: VanXLike | null) {
  setCompatVanXState(vanX);
}

export function getCompatVanX(): VanXLike {
  const vanX = getCompatVanXState();
  if (!vanX) {
    throw new Error(
      "van-stack/compat/vanjs-ext has not been bound to a VanX runtime yet.",
    );
  }

  return vanX;
}
