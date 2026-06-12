import { getCompatVanX } from "./vanx-env";

export const calc = (...args: unknown[]) => getCompatVanX().calc(...args);
export const reactive = (...args: unknown[]) =>
  getCompatVanX().reactive(...args);
export const noreactive = (...args: unknown[]) =>
  getCompatVanX().noreactive(...args);
export const stateFields = (...args: unknown[]) =>
  getCompatVanX().stateFields(...args);
export const raw = (...args: unknown[]) => getCompatVanX().raw(...args);
export const list = (...args: unknown[]) => getCompatVanX().list(...args);
export const replace = (...args: unknown[]) => getCompatVanX().replace(...args);
export const compact = (...args: unknown[]) => getCompatVanX().compact(...args);
