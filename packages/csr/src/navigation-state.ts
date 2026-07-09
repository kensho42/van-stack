import type {
  RouterEntry,
  RouterNavigationSnapshot,
  RouterNavigationState,
  RouterNavigationStateListener,
} from "../../core/src/index";

export function createNavigationSnapshot(input: {
  canGoBack: boolean;
  current: RouterEntry | null;
  previous?: RouterEntry | null;
  stackDepth?: number;
}): RouterNavigationSnapshot {
  return {
    canGoBack: input.canGoBack,
    current: input.current,
    previous: input.previous ?? null,
    stackDepth: input.stackDepth ?? (input.current ? 1 : 0),
  };
}

export function createIdleNavigationState(
  snapshot: RouterNavigationSnapshot,
): RouterNavigationState {
  return {
    ...snapshot,
    progress: 1,
    transition: {
      direction: "none",
      from: snapshot,
      phase: "idle",
      progress: 1,
      to: snapshot,
    },
  };
}

export function createNavigationStateStore(initial: RouterNavigationState) {
  let state = initial;
  const listeners = new Set<RouterNavigationStateListener>();

  return {
    get() {
      return state;
    },
    set(nextState: RouterNavigationState) {
      state = nextState;
      for (const listener of listeners) {
        listener(state);
      }
    },
    subscribe(listener: RouterNavigationStateListener) {
      listeners.add(listener);
      listener(state);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}
