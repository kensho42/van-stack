import type {
  HistoryLike,
  RouteNavigation,
  RouteNavigationRetention,
  RouteNavigationTransition,
  RouterBackOptions,
  RouterBackResult,
  RouterEntry,
  RouterNavigationDirection,
  RouterNavigationPhase,
  RouterNavigationSnapshot,
  RouterNavigationStateListener,
  RuntimeRouteDefinition,
} from "../../../core/src/index";
import { matchPath } from "../../../core/src/index";
import {
  createIdleNavigationState,
  createNavigationSnapshot,
  createNavigationStateStore,
} from "../navigation-state";
import type {
  ClientNavigationAction,
  ClientNavigationIntent,
  ClientPresentation,
  ClientPresentationRenderInput,
  ClientPresentationWindowLike,
} from "../presentation";
import { findMatchedRoute, resolveRouteModule } from "../route-render";
import {
  getElementHeight,
  removeInlineStyle,
  type StackViewRoot,
  setInlineStyle,
} from "./dom";
import {
  createSwipeBackController,
  type StackSwipeBackOptions,
} from "./gestures";
import {
  createStackItem,
  ensurePositionedRoots,
  ensureViewRoot,
  getRetainedItems,
  pruneUnmountedRoots,
  type StackItem,
  syncRoot,
} from "./state";
import { ensureStackStyles } from "./styles";
import {
  clearTransitionRoot,
  resolveRetention,
  resolveTransition,
  type StackPlatform,
  setTransitionRoot,
  waitForTransition,
} from "./transitions";

export type StackNavigationAction = ClientNavigationAction;
export type StackNavigationIntent = ClientNavigationIntent;

export type StackPresentationOptions = {
  action?: (input: {
    from: RouterEntry | null;
    intent: StackNavigationIntent;
    routeNavigation?: RouteNavigation;
    to: RouterEntry;
  }) => StackNavigationAction | Promise<StackNavigationAction>;
  animate?: boolean;
  duration?: number;
  initial?: "leaf";
  platform?: StackPlatform;
  retention?: RouteNavigationRetention;
  styles?: boolean;
  swipeBack?: StackSwipeBackOptions;
  transition?: RouteNavigationTransition;
};

export type StackPresentation = ClientPresentation & {
  back: (options?: RouterBackOptions) => Promise<RouterBackResult>;
  canGoBack: () => boolean;
};

async function resolveRouteNavigation(
  routes: readonly RuntimeRouteDefinition[],
  entry: RouterEntry,
) {
  const match = findMatchedRoute(routes, entry.path);
  return resolveRouteModule<RouteNavigation>(
    match.route.navigation,
    match.route.files?.navigation,
    match.route,
  );
}

function setHistory(
  history: HistoryLike,
  action: Exclude<StackNavigationAction, "pop">,
  entry: RouterEntry,
) {
  if (action === "push") {
    history.pushState({ path: entry.path }, "", entry.path);
    return;
  }

  if (history.replaceState) {
    history.replaceState({ path: entry.path }, "", entry.path);
    return;
  }

  history.pushState({ path: entry.path }, "", entry.path);
}

function findStackIndex(stack: readonly StackItem[], entry: RouterEntry) {
  return stack.findIndex((item) => item.entry.path === entry.path);
}

function currentItem(stack: readonly StackItem[]) {
  return stack[stack.length - 1] ?? null;
}

function stackItemEntry(item: StackItem | undefined) {
  return item?.entry ?? null;
}

function isRouteUpMatch(
  routeNavigation: RouteNavigation | undefined,
  item: StackItem | undefined,
) {
  return Boolean(
    routeNavigation?.up &&
      item &&
      matchPath(routeNavigation.up, item.entry.pathname),
  );
}

function getWindowScroll(window: ClientPresentationWindowLike) {
  return {
    left: window.scrollX ?? window.pageXOffset ?? 0,
    top: window.scrollY ?? window.pageYOffset ?? 0,
  };
}

function saveItemScroll(
  item: StackItem | null,
  window: ClientPresentationWindowLike,
) {
  if (!item) return;
  item.scroll = getWindowScroll(window);
}

function getItemScroll(item: StackItem) {
  return item.scroll ?? { left: 0, top: 0 };
}

function setItemScrollOffset(item: StackItem | null, offsetY: number) {
  if (!item?.root) return;
  if (offsetY === 0) {
    removeInlineStyle(item.root, "translate");
    return;
  }
  setInlineStyle(item.root, "translate", `0 ${offsetY}px`);
}

function lockStackHeight(
  input: ClientPresentationRenderInput,
  ...items: Array<StackItem | null>
) {
  const height = Math.max(
    0,
    ...items.map((item) => (item?.root ? getElementHeight(item.root) : 0)),
  );
  if (height > 0) {
    setInlineStyle(input.root as StackViewRoot, "min-height", `${height}px`);
  }
}

function unlockStackHeight(input: ClientPresentationRenderInput) {
  removeInlineStyle(input.root as StackViewRoot, "min-height");
}

function getNavigationTargetScroll(
  input: ClientPresentationRenderInput,
  destination?: StackItem,
) {
  if (input.intent === "navigate") {
    return input.scroll.onNavigate === "top" ? { left: 0, top: 0 } : null;
  }

  if (input.intent === "popstate") {
    return getPopStateTargetScroll(input, destination);
  }

  return null;
}

function getPopStateTargetScroll(
  input: ClientPresentationRenderInput,
  destination?: StackItem,
) {
  return input.scroll.onPopState === "top"
    ? { left: 0, top: 0 }
    : destination
      ? getItemScroll(destination)
      : null;
}

function restoreWindowScroll(
  window: ClientPresentationWindowLike,
  scroll: { left: number; top: number },
  behavior: ClientPresentationRenderInput["scroll"]["behavior"] = "auto",
) {
  window.scrollTo?.({
    top: scroll.top,
    left: scroll.left,
    behavior,
  });
}

async function restoreSwipeBackScroll(
  input: ClientPresentationRenderInput,
  destination: StackItem,
  scroll: { left: number; top: number },
  clearStyles: () => void,
) {
  const updateLayoutOffset = () => {
    const current = getWindowScroll(input.window);
    const offsetY = current.top - scroll.top;
    if (destination.root) {
      if (Math.abs(offsetY) <= 0.5) {
        removeInlineStyle(destination.root, "top");
      } else {
        setInlineStyle(destination.root, "top", `${offsetY}px`);
      }
    }
    return (
      Math.abs(current.left - scroll.left) <= 0.5 &&
      Math.abs(current.top - scroll.top) <= 0.5
    );
  };

  updateLayoutOffset();
  clearStyles();

  if (!input.window.scrollTo) {
    if (destination.root) removeInlineStyle(destination.root, "top");
    return;
  }

  if (updateLayoutOffset()) return;

  const requestFrame = input.window.requestAnimationFrame?.bind(input.window);
  if (requestFrame) {
    await new Promise<void>((resolve) => {
      requestFrame(() => requestFrame(() => resolve()));
    });
  }

  restoreWindowScroll(input.window, scroll, input.scroll.behavior);

  if (updateLayoutOffset()) return;
  if (!requestFrame) {
    if (destination.root) removeInlineStyle(destination.root, "top");
    return;
  }

  await new Promise<void>((resolve) => {
    const update = () => {
      if (updateLayoutOffset()) {
        resolve();
        return;
      }
      requestFrame(update);
    };

    requestFrame(update);
  });
}

async function syncRetainedRoot(
  input: ClientPresentationRenderInput,
  stack: StackItem[],
  retention: RouteNavigationRetention,
) {
  const retained = getRetainedItems(stack, retention);
  await ensurePositionedRoots(input.routes, retained);
  syncRoot(input.root, retained);
  pruneUnmountedRoots(stack, retained);
}

export function stackPresentation(
  options: StackPresentationOptions = {},
): StackPresentation {
  let stack: StackItem[] = [];
  let latestInput: ClientPresentationRenderInput | null = null;
  let currentNavigation: RouteNavigation | undefined;
  let suppressNextPopPath: string | null = null;
  let activeSwipeTargetPath: string | null = null;
  let activeSwipeHistoryPopped = false;
  let queue = Promise.resolve();
  let disposed = false;
  let managedHistory: HistoryLike | null = null;
  let previousScrollRestoration: HistoryLike["scrollRestoration"];
  const navigationStateStore = createNavigationStateStore(
    createIdleNavigationState(
      createNavigationSnapshot({
        canGoBack: false,
        current: null,
        stackDepth: 0,
      }),
    ),
  );

  function canStackGoBack(nextStack = stack) {
    return nextStack.length > 1 && Boolean(latestInput?.history.back);
  }

  function restoreNativeScrollRestoration() {
    if (managedHistory && previousScrollRestoration) {
      managedHistory.scrollRestoration = previousScrollRestoration;
    }
    managedHistory = null;
    previousScrollRestoration = undefined;
  }

  function manageNativeScrollRestoration(history: HistoryLike) {
    if (managedHistory === history) return;
    restoreNativeScrollRestoration();
    if (!history.scrollRestoration) return;

    managedHistory = history;
    previousScrollRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
  }

  function createStackSnapshot(nextStack = stack): RouterNavigationSnapshot {
    return createNavigationSnapshot({
      canGoBack: canStackGoBack(nextStack),
      current: stackItemEntry(nextStack[nextStack.length - 1]),
      previous: stackItemEntry(nextStack[nextStack.length - 2]),
      stackDepth: nextStack.length,
    });
  }

  function setNavigationStateForStack() {
    navigationStateStore.set(createIdleNavigationState(createStackSnapshot()));
  }

  function setTransitionState(input: {
    direction: RouterNavigationDirection;
    from: RouterNavigationSnapshot;
    phase: RouterNavigationPhase;
    progress: number;
    to: RouterNavigationSnapshot;
  }) {
    navigationStateStore.set({
      ...input.from,
      progress: input.progress,
      transition: input,
    });
  }

  function reportSwipeBackGesture(input: {
    phase: "start" | "move" | "cancel" | "commit";
    progress: number;
  }) {
    if (input.phase === "cancel") {
      activeSwipeTargetPath = null;
      activeSwipeHistoryPopped = false;
      setNavigationStateForStack();
      return;
    }

    if (stack.length <= 1) return;

    if (input.phase === "start") {
      activeSwipeTargetPath = stack[stack.length - 2]?.entry.path ?? null;
      activeSwipeHistoryPopped = false;
    }

    setTransitionState({
      direction: "backward",
      from: createStackSnapshot(stack),
      phase: "gesture",
      progress: input.progress,
      to: createStackSnapshot(stack.slice(0, -1)),
    });
  }

  async function resolveAction(
    input: ClientPresentationRenderInput,
    routeNavigation: RouteNavigation | undefined,
  ) {
    if (input.action) {
      return input.action;
    }
    if (options.action) {
      return options.action({
        from: input.from,
        intent: input.intent,
        routeNavigation,
        to: input.entry,
      });
    }
    if (input.intent === "popstate") {
      return "pop";
    }
    if (input.intent === "load") {
      return "replace";
    }
    return routeNavigation?.enter ?? "replace";
  }

  async function runTransition(
    input: ClientPresentationRenderInput,
    routeNavigation: RouteNavigation | undefined,
    direction: "forward" | "backward",
    navigationState: {
      from: RouterNavigationSnapshot;
      to: RouterNavigationSnapshot;
    },
    before: () => Promise<void> | void,
    during: () => Promise<void> | void,
    after: () => Promise<void> | void,
  ) {
    const transition = resolveTransition(options, routeNavigation);

    await before();
    if (transition.animate) {
      setTransitionState({
        direction,
        from: navigationState.from,
        phase: "transition",
        progress: 0,
        to: navigationState.to,
      });
      setTransitionRoot(input.root as StackViewRoot, transition, direction);
      (input.root as StackViewRoot).getBoundingClientRect?.();
      await during();
      setTransitionState({
        direction,
        from: navigationState.from,
        phase: "transition",
        progress: 1,
        to: navigationState.to,
      });
      await waitForTransition(input.root as StackViewRoot, transition);
      clearTransitionRoot(input.root as StackViewRoot, transition, direction);
    }
    await after();
  }

  async function applyPush(
    input: ClientPresentationRenderInput,
    routeNavigation: RouteNavigation | undefined,
  ) {
    const previous = currentItem(stack);
    const next = await createStackItem(input.routes, input.entry);
    const nextStack = [...stack, next];
    const retention = resolveRetention(options, routeNavigation);

    if (!previous) {
      stack = nextStack;
      await syncRetainedRoot(input, stack, retention);
      return;
    }

    saveItemScroll(previous, input.window);
    const previousScroll = getItemScroll(previous);
    const nextScroll = getNavigationTargetScroll(input, next);
    await ensureViewRoot(previous, input.routes);
    await runTransition(
      input,
      routeNavigation,
      "forward",
      {
        from: createStackSnapshot(stack),
        to: createStackSnapshot(nextStack),
      },
      async () => {
        if (nextScroll) {
          setItemScrollOffset(previous, nextScroll.top - previousScroll.top);
          restoreWindowScroll(input.window, nextScroll, input.scroll.behavior);
        }
        syncRoot(input.root, [
          { item: previous, position: "current" },
          { item: next, position: "next" },
        ]);
      },
      async () => {
        syncRoot(input.root, [
          { item: previous, position: "previous" },
          { item: next, position: "current" },
        ]);
      },
      async () => {
        stack = nextStack;
        await syncRetainedRoot(input, stack, retention);
        setItemScrollOffset(previous, 0);
      },
    );
  }

  async function applyReplaceOrReset(
    input: ClientPresentationRenderInput,
    routeNavigation: RouteNavigation | undefined,
    action: "replace" | "reset",
  ) {
    const next = await createStackItem(input.routes, input.entry);
    if (action === "reset" || stack.length === 0) {
      stack = [next];
    } else {
      const existingIndex = findStackIndex(stack, input.entry);
      const previous = stack[stack.length - 2];
      stack =
        existingIndex >= 0
          ? [...stack.slice(0, existingIndex), next]
          : isRouteUpMatch(routeNavigation, previous)
            ? [...stack.slice(0, -1), next]
            : [next];
    }
    await syncRetainedRoot(
      input,
      stack,
      resolveRetention(options, routeNavigation),
    );
    const nextScroll = getNavigationTargetScroll(input, currentItem(stack));
    if (nextScroll) {
      restoreWindowScroll(input.window, nextScroll, input.scroll.behavior);
    }
  }

  async function applyPop(
    input: ClientPresentationRenderInput,
    routeNavigation: RouteNavigation | undefined,
  ) {
    const existingIndex = findStackIndex(stack, input.entry);
    if (existingIndex < 0) {
      stack = [await createStackItem(input.routes, input.entry)];
      await syncRetainedRoot(
        input,
        stack,
        resolveRetention(options, routeNavigation),
      );
      const nextScroll = getNavigationTargetScroll(input, currentItem(stack));
      if (nextScroll) {
        restoreWindowScroll(input.window, nextScroll, input.scroll.behavior);
      }
      return;
    }

    const previous = stack[existingIndex] as StackItem;
    const outgoing = currentItem(stack);
    const nextStack = stack.slice(0, existingIndex + 1);
    const retention = resolveRetention(options, routeNavigation);

    if (!outgoing || outgoing === previous) {
      stack = nextStack;
      await syncRetainedRoot(input, stack, retention);
      const nextScroll = getNavigationTargetScroll(input, previous);
      if (nextScroll) {
        restoreWindowScroll(input.window, nextScroll, input.scroll.behavior);
      }
      return;
    }

    saveItemScroll(outgoing, input.window);
    const outgoingScroll = getItemScroll(outgoing);
    const previousScroll = getNavigationTargetScroll(input, previous);
    await ensureViewRoot(previous, input.routes);
    await ensureViewRoot(outgoing, input.routes);
    try {
      await runTransition(
        input,
        routeNavigation,
        "backward",
        {
          from: createStackSnapshot(stack),
          to: createStackSnapshot(nextStack),
        },
        async () => {
          lockStackHeight(input, previous, outgoing);
          if (previousScroll) {
            setItemScrollOffset(
              outgoing,
              previousScroll.top - outgoingScroll.top,
            );
            restoreWindowScroll(
              input.window,
              previousScroll,
              input.scroll.behavior,
            );
          }
          syncRoot(input.root, [
            { item: previous, position: "previous" },
            { item: outgoing, position: "current" },
          ]);
        },
        async () => {
          syncRoot(input.root, [
            { item: previous, position: "current" },
            { item: outgoing, position: "next" },
          ]);
        },
        async () => {
          stack = nextStack;
          await syncRetainedRoot(input, stack, retention);
        },
      );
    } finally {
      setItemScrollOffset(outgoing, 0);
      unlockStackHeight(input);
    }
  }

  async function applyAction(
    input: ClientPresentationRenderInput,
    action: StackNavigationAction,
    routeNavigation: RouteNavigation | undefined,
  ) {
    if (action === "pop") {
      await applyPop(input, routeNavigation);
      return;
    }

    if (action === "push") {
      await applyPush(input, routeNavigation);
    } else {
      await applyReplaceOrReset(input, routeNavigation, action);
    }

    if (input.intent === "navigate") {
      setHistory(input.history, action, input.entry);
    }
  }

  async function commitSwipeBack() {
    if (!latestInput || stack.length <= 1) return undefined;

    const input = latestInput;
    const previous = stack[stack.length - 2] as StackItem;
    const outgoing = stack[stack.length - 1] as StackItem;
    const nextStack = stack.slice(0, -1);
    const previousScroll = getPopStateTargetScroll(input, previous);
    const routeNavigation = await resolveRouteNavigation(
      input.routes,
      previous.entry,
    );
    const retention = resolveRetention(options, routeNavigation);

    await ensureViewRoot(previous, input.routes);
    await ensureViewRoot(outgoing, input.routes);
    lockStackHeight(input, previous, outgoing);
    syncRoot(input.root, [
      { item: previous, position: "current" },
      { item: outgoing, position: "next" },
    ]);

    return {
      async finish(clearStyles: () => void) {
        try {
          stack = nextStack;
          await syncRetainedRoot(input, stack, retention);
          setNavigationStateForStack();
          if (previousScroll) {
            await restoreSwipeBackScroll(
              input,
              previous,
              previousScroll,
              clearStyles,
            );
          } else {
            clearStyles();
          }
        } finally {
          unlockStackHeight(input);
        }

        const historyAlreadyPopped = activeSwipeHistoryPopped;
        activeSwipeTargetPath = null;
        activeSwipeHistoryPopped = false;
        if (historyAlreadyPopped) return;

        if (input.history.back) {
          suppressNextPopPath = previous.entry.path;
          input.history.back();
        } else {
          await input.navigate(previous.entry.path, "pop");
        }
      },
    };
  }

  const swipeBack = createSwipeBackController({
    canStart() {
      if (stack.length <= 1) return null;
      const previous = stack[stack.length - 2];
      const current = stack[stack.length - 1];
      if (!previous?.root || !current?.root) return null;
      const currentScroll = latestInput
        ? getWindowScroll(latestInput.window)
        : { left: 0, top: 0 };
      const previousScroll = latestInput
        ? getPopStateTargetScroll(latestInput, previous)
        : getItemScroll(previous);
      const previousTop = previousScroll?.top ?? 0;
      const input = latestInput;
      return {
        current: current.root,
        getPreviousOffsetY: input
          ? () => getWindowScroll(input.window).top - previousTop
          : undefined,
        previous: previous.root,
        previousOffsetY: currentScroll.top - previousTop,
        requestAnimationFrame: input?.window.requestAnimationFrame?.bind(
          input.window,
        ),
      };
    },
    commit: commitSwipeBack,
    getRouteNavigation() {
      return currentNavigation;
    },
    getSettleDuration() {
      const transition = resolveTransition(options, currentNavigation);
      return transition.animate ? transition.duration : 0;
    },
    onGesture: reportSwipeBackGesture,
    options: options.swipeBack,
  });

  async function renderQueued(input: ClientPresentationRenderInput) {
    if (disposed) return;

    if (options.styles !== false) {
      ensureStackStyles();
    }

    if (
      input.intent === "popstate" &&
      activeSwipeTargetPath === input.entry.path
    ) {
      activeSwipeHistoryPopped = true;
      suppressNextPopPath = null;
      return;
    }

    latestInput = input;
    manageNativeScrollRestoration(input.history);
    swipeBack?.update(input.root as StackViewRoot);
    currentNavigation = await resolveRouteNavigation(input.routes, input.entry);
    if (disposed) return;

    if (
      input.intent === "popstate" &&
      suppressNextPopPath &&
      suppressNextPopPath === input.entry.path
    ) {
      suppressNextPopPath = null;
      return;
    }

    const action = await resolveAction(input, currentNavigation);
    await applyAction(input, action, currentNavigation);
    setNavigationStateForStack();
  }

  return {
    async back(options?: RouterBackOptions) {
      if (stack.length > 1 && latestInput?.history.back) {
        latestInput.history.back();
        return "history";
      }

      const fallback = options?.fallback ?? currentNavigation?.up;
      if (fallback && latestInput) {
        await latestInput.navigate(fallback, "replace");
        return "fallback";
      }

      return "none";
    },
    canGoBack() {
      return canStackGoBack();
    },
    dispose() {
      disposed = true;
      swipeBack?.dispose();
      if (latestInput) {
        unlockStackHeight(latestInput);
      }
      restoreNativeScrollRestoration();
    },
    getNavigationState() {
      return navigationStateStore.get();
    },
    managesScroll: true,
    render(input) {
      if (disposed) return Promise.resolve();
      const run = queue.then(() => renderQueued(input));
      queue = run.catch(() => {});
      return run;
    },
    subscribeNavigationState(listener: RouterNavigationStateListener) {
      return navigationStateStore.subscribe(listener);
    },
  };
}
