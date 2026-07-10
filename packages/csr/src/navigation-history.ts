import type { HistoryLike, RouterBackResult } from "../../core/src/index";

export type NavigationHistoryPopState = {
  state?: unknown;
};

export type NavigationHistory = {
  back: () => RouterBackResult;
  canGoBack: () => boolean;
  history: HistoryLike;
  notePopState: (event?: NavigationHistoryPopState) => void;
};

const historyIndexKey = "__vanStackHistoryIndex";

function withHistoryIndex(state: unknown, index: number) {
  if (state && typeof state === "object" && !Array.isArray(state)) {
    return {
      ...(state as Record<string, unknown>),
      [historyIndexKey]: index,
    };
  }

  return {
    [historyIndexKey]: index,
    value: state ?? null,
  };
}

function readHistoryIndex(state: unknown) {
  if (!state || typeof state !== "object") return undefined;

  const value = (state as Record<string, unknown>)[historyIndexKey];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export function createNavigationHistory(
  history: HistoryLike,
): NavigationHistory {
  let index = 0;
  const hasBack = typeof history.back === "function";

  const trackedHistory: HistoryLike = {
    pushState(state, unused, url) {
      index += 1;
      history.pushState(withHistoryIndex(state, index), unused, url);
    },
    replaceState(state, unused, url) {
      if (history.replaceState) {
        history.replaceState(withHistoryIndex(state, index), unused, url);
        return;
      }

      index += 1;
      history.pushState(withHistoryIndex(state, index), unused, url);
    },
  };
  if (hasBack) {
    trackedHistory.back = () => {
      history.back?.();
    };
  }
  if (history.scrollRestoration) {
    Object.defineProperty(trackedHistory, "scrollRestoration", {
      enumerable: true,
      get() {
        return history.scrollRestoration;
      },
      set(value: "auto" | "manual") {
        history.scrollRestoration = value;
      },
    });
  }

  return {
    back() {
      if (index <= 0 || !hasBack) return "none";

      history.back?.();
      return "history";
    },
    canGoBack() {
      return index > 0 && hasBack;
    },
    history: trackedHistory,
    notePopState(event) {
      const nextIndex = readHistoryIndex(event?.state);
      index =
        nextIndex === undefined
          ? event
            ? 0
            : Math.max(0, index - 1)
          : Math.max(0, nextIndex);
    },
  };
}
