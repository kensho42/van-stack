import type { RouteNavigation } from "../../../core/src/index";
import {
  addClass,
  createViewRoot,
  getElementLeft,
  getElementWidth,
  removeClass,
  removeInlineStyle,
  type StackPointerEventLike,
  type StackViewRoot,
  setAttribute,
  setInlineStyle,
} from "./dom";

export type StackSwipeBackOptions =
  | boolean
  | {
      activeArea?: number;
      commitRatio?: number;
      enabled?: boolean | "auto";
      fastSwipeDistance?: number;
      fastSwipeMs?: number;
      opacity?: boolean;
      shadow?: boolean;
      threshold?: number;
    };

export type ResolvedSwipeBackOptions = {
  activeArea: number;
  commitRatio: number;
  enabled: boolean | "auto";
  fastSwipeDistance: number;
  fastSwipeMs: number;
  opacity: boolean;
  shadow: boolean;
  threshold: number;
};

export type SwipeBackController = {
  dispose: () => void;
  update: (root: StackViewRoot) => void;
};

type SwipeTarget = {
  current: StackViewRoot;
  opacityLayer?: StackViewRoot;
  previous: StackViewRoot;
  previousOffsetY?: number;
  shadowLayer?: StackViewRoot;
};

type SwipeBackCommitHandle = {
  finish: (clearStyles: () => void) => Promise<void> | void;
};

export type SwipeBackGestureEvent = {
  phase: "start" | "move" | "cancel" | "commit";
  progress: number;
};

type SwipeBackControllerOptions = {
  canStart: () => SwipeTarget | null;
  commit: () =>
    | Promise<SwipeBackCommitHandle | undefined>
    | SwipeBackCommitHandle
    | undefined;
  getRouteNavigation: () => RouteNavigation | undefined;
  getSettleDuration: () => number;
  onGesture?: (event: SwipeBackGestureEvent) => void;
  options: StackSwipeBackOptions | undefined;
};

function resolveSwipeBackOptions(
  options: StackSwipeBackOptions | undefined,
): ResolvedSwipeBackOptions {
  if (options === false) {
    return {
      activeArea: 30,
      commitRatio: 0.5,
      enabled: false,
      fastSwipeDistance: 10,
      fastSwipeMs: 300,
      opacity: true,
      shadow: true,
      threshold: 0,
    };
  }

  if (options === true || typeof options === "undefined") {
    return {
      activeArea: 30,
      commitRatio: 0.5,
      enabled: "auto",
      fastSwipeDistance: 10,
      fastSwipeMs: 300,
      opacity: true,
      shadow: true,
      threshold: 0,
    };
  }

  return {
    activeArea: options.activeArea ?? 30,
    commitRatio: options.commitRatio ?? 0.5,
    enabled: options.enabled ?? "auto",
    fastSwipeDistance: options.fastSwipeDistance ?? 10,
    fastSwipeMs: options.fastSwipeMs ?? 300,
    opacity: options.opacity ?? true,
    shadow: options.shadow ?? true,
    threshold: options.threshold ?? 0,
  };
}

function isIosLikeTouchEnvironment() {
  if (typeof globalThis.navigator === "undefined") {
    return false;
  }

  const maxTouchPoints = globalThis.navigator.maxTouchPoints ?? 0;
  if (maxTouchPoints <= 0) {
    return false;
  }

  const userAgent = globalThis.navigator.userAgent.toLowerCase();
  return (
    userAgent.includes("iphone") ||
    userAgent.includes("ipad") ||
    userAgent.includes("ipod") ||
    (userAgent.includes("macintosh") && maxTouchPoints > 1)
  );
}

function isEnabled(
  options: ResolvedSwipeBackOptions,
  routeNavigation: RouteNavigation | undefined,
) {
  if (routeNavigation?.swipeBack === false) {
    return false;
  }
  if (routeNavigation?.swipeBack === true) {
    return true;
  }
  if (options.enabled === "auto") {
    return isIosLikeTouchEnvironment();
  }
  return options.enabled;
}

function getPoint(event: StackPointerEventLike) {
  const touch = event.targetTouches?.[0];
  return {
    x: touch?.pageX ?? event.pageX ?? event.clientX ?? 0,
    y: touch?.pageY ?? event.pageY ?? event.clientY ?? 0,
  };
}

function hasClosest(target: unknown, selector: string) {
  if (!target || typeof target !== "object") {
    return false;
  }

  const closest = (target as { closest?: (selector: string) => unknown })
    .closest;
  if (typeof closest === "function") {
    return Boolean(closest.call(target, selector));
  }

  return false;
}

function hasMatches(target: unknown, selector: string) {
  if (!target || typeof target !== "object") {
    return false;
  }

  const matches = (target as { matches?: (selector: string) => boolean })
    .matches;
  if (typeof matches === "function") {
    return matches.call(target, selector);
  }

  return false;
}

function isContentEditable(target: unknown) {
  return (
    Boolean(target) &&
    typeof target === "object" &&
    (target as { isContentEditable?: boolean }).isContentEditable === true
  );
}

function isBlockedTarget(target: unknown) {
  return (
    hasClosest(target, "[data-van-stack-no-swipe-back]") ||
    hasClosest(target, "input, textarea, select, button, [contenteditable]") ||
    hasMatches(target, "input, textarea, select, button, [contenteditable]") ||
    isContentEditable(target)
  );
}

function appendGestureLayer(parent: StackViewRoot, className: string) {
  const layer = createViewRoot();
  addClass(layer, className);
  setAttribute(layer, "aria-hidden", "true");
  parent.appendChild?.(layer);
  return layer;
}

function ensureGestureLayers(
  target: SwipeTarget,
  options: ResolvedSwipeBackOptions,
) {
  if (options.opacity && !target.opacityLayer) {
    target.opacityLayer = appendGestureLayer(
      target.previous,
      "van-stack-swipe-opacity",
    );
  }
  if (options.shadow && !target.shadowLayer) {
    target.shadowLayer = appendGestureLayer(
      target.current,
      "van-stack-swipe-shadow",
    );
  }
}

function removeGestureLayer(parent: StackViewRoot, layer: StackViewRoot) {
  layer.remove?.();
  const children = parent.children ? Array.from(parent.children) : [];
  if (!children.includes(layer)) return;
  parent.replaceChildren?.(...children.filter((child) => child !== layer));
}

function removeGestureLayers(target: SwipeTarget) {
  if (target.opacityLayer) {
    removeGestureLayer(target.previous, target.opacityLayer);
    target.opacityLayer = undefined;
  }
  if (target.shadowLayer) {
    removeGestureLayer(target.current, target.shadowLayer);
    target.shadowLayer = undefined;
  }
}

function getGestureMotionNodes(target: SwipeTarget) {
  return [
    target.current,
    target.previous,
    target.opacityLayer,
    target.shadowLayer,
  ].filter((root): root is StackViewRoot => Boolean(root));
}

function clearGestureStyles(target: SwipeTarget) {
  for (const root of getGestureMotionNodes(target)) {
    removeInlineStyle(root, "transform");
    removeInlineStyle(root, "opacity");
    removeInlineStyle(root, "transition");
    removeInlineStyle(root, "z-index");
  }
  removeGestureLayers(target);
}

function setCanceledGestureMotionStyles(target: SwipeTarget) {
  removeInlineStyle(target.current, "transform");
  removeInlineStyle(target.current, "opacity");
  removeInlineStyle(target.previous, "opacity");

  const previousOffsetY = target.previousOffsetY ?? 0;
  if (previousOffsetY === 0) {
    removeInlineStyle(target.previous, "transform");
    return;
  }

  setInlineStyle(
    target.previous,
    "transform",
    `translate3d(-20%, ${previousOffsetY}px, 0)`,
  );
}

function setCommittedGestureMotionStyles(target: SwipeTarget) {
  setInlineStyle(target.current, "z-index", "2");
  setInlineStyle(target.previous, "z-index", "1");
  removeInlineStyle(target.current, "transform");
  removeInlineStyle(target.current, "opacity");
  removeInlineStyle(target.previous, "opacity");
  if (target.opacityLayer) {
    setInlineStyle(target.opacityLayer, "opacity", "0");
  }

  const previousOffsetY = target.previousOffsetY ?? 0;
  if (previousOffsetY === 0) {
    removeInlineStyle(target.previous, "transform");
    return;
  }

  setInlineStyle(
    target.previous,
    "transform",
    `translate3d(0px, ${previousOffsetY}px, 0)`,
  );
}

async function settleGesture(
  target: SwipeTarget,
  duration: number,
  committed: boolean,
) {
  if (duration <= 0) {
    if (committed) {
      setCommittedGestureMotionStyles(target);
    } else {
      setCanceledGestureMotionStyles(target);
    }
    return;
  }

  const transition = `transform ${duration}ms cubic-bezier(.32,.72,0,1), opacity ${duration}ms cubic-bezier(.32,.72,0,1)`;
  for (const root of getGestureMotionNodes(target)) {
    setInlineStyle(root, "transition", transition);
  }
  for (const root of [target.current, target.previous]) {
    root.getBoundingClientRect?.();
  }

  if (committed) {
    setCommittedGestureMotionStyles(target);
  } else {
    setCanceledGestureMotionStyles(target);
  }

  await new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, duration);
  });

  for (const root of getGestureMotionNodes(target)) {
    removeInlineStyle(root, "transition");
  }
}

export function createSwipeBackController({
  canStart,
  commit,
  getRouteNavigation,
  getSettleDuration,
  onGesture,
  options,
}: SwipeBackControllerOptions): SwipeBackController | null {
  const resolved = resolveSwipeBackOptions(options);
  let root: StackViewRoot | null = null;
  let target: SwipeTarget | null = null;
  let active = false;
  let moved = false;
  let scrolling: boolean | undefined;
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let width = 0;
  let diff = 0;

  const onStart = (event: StackPointerEventLike) => {
    if (!root || active) return;
    if (!isEnabled(resolved, getRouteNavigation())) return;
    if (isBlockedTarget(event.target)) return;

    const point = getPoint(event);
    const left = getElementLeft(root);
    if (point.x - left > resolved.activeArea) return;

    const swipeTarget = canStart();
    if (!swipeTarget) return;

    width = getElementWidth(root) || 1;
    target = swipeTarget;
    active = true;
    moved = false;
    scrolling = undefined;
    diff = 0;
    startX = point.x;
    startY = point.y;
    startTime = Date.now();
    addClass(root, "van-stack-swipe-active");
    onGesture?.({ phase: "start", progress: 0 });
  };

  const onMove = (event: StackPointerEventLike) => {
    if (!root || !active || !target) return;

    const point = getPoint(event);
    const deltaX = point.x - startX;
    const deltaY = point.y - startY;

    if (typeof scrolling === "undefined") {
      scrolling = Math.abs(deltaY) > Math.abs(deltaX) || deltaX < 0;
    }

    if (scrolling) {
      active = false;
      moved = false;
      clearGestureStyles(target);
      removeClass(root, "van-stack-swipe-active");
      onGesture?.({ phase: "cancel", progress: 0 });
      target = null;
      return;
    }

    event.preventDefault?.();
    moved = true;
    diff = Math.max(deltaX - resolved.threshold, 0);
    const progress = Math.min(Math.max(diff / width, 0), 1);
    const currentTranslate = Math.min(diff, width);
    const previousTranslate = Math.min(diff / 5 - width / 5, 0);

    ensureGestureLayers(target, resolved);
    setInlineStyle(
      target.current,
      "transform",
      `translate3d(${currentTranslate}px, 0, 0)`,
    );
    setInlineStyle(
      target.previous,
      "transform",
      `translate3d(${previousTranslate}px, ${target.previousOffsetY ?? 0}px, 0)`,
    );

    if (target.opacityLayer) {
      setInlineStyle(target.opacityLayer, "opacity", String(1 - progress));
    }
    onGesture?.({ phase: "move", progress });
  };

  const onEnd = async () => {
    if (!root || !active || !target) {
      active = false;
      moved = false;
      return;
    }

    const swipeTarget = target;
    const elapsed = Date.now() - startTime;
    const shouldCommit =
      moved &&
      ((elapsed < resolved.fastSwipeMs && diff > resolved.fastSwipeDistance) ||
        diff > width * resolved.commitRatio);

    active = false;
    moved = false;
    target = null;

    if (shouldCommit) {
      onGesture?.({ phase: "commit", progress: 1 });
      const handle = await commit();
      removeClass(root, "van-stack-swipe-active");
      await settleGesture(swipeTarget, getSettleDuration(), true);
      let stylesCleared = false;
      const clearStyles = () => {
        if (stylesCleared) return;
        stylesCleared = true;
        clearGestureStyles(swipeTarget);
      };
      await handle?.finish?.(clearStyles);
      clearStyles();
      return;
    }

    onGesture?.({ phase: "cancel", progress: 0 });
    removeClass(root, "van-stack-swipe-active");
    await settleGesture(swipeTarget, getSettleDuration(), false);
    clearGestureStyles(swipeTarget);
  };

  function attach(nextRoot: StackViewRoot) {
    if (root === nextRoot) return;
    if (root) {
      root.removeEventListener?.("pointerdown", onStart);
      root.removeEventListener?.("pointermove", onMove);
      root.removeEventListener?.("pointerup", onEnd as never);
      root.removeEventListener?.("pointercancel", onEnd as never);
      root.removeEventListener?.("touchstart", onStart);
      root.removeEventListener?.("touchmove", onMove);
      root.removeEventListener?.("touchend", onEnd as never);
      root.removeEventListener?.("touchcancel", onEnd as never);
    }

    root = nextRoot;
    root.addEventListener?.("pointerdown", onStart);
    root.addEventListener?.("pointermove", onMove);
    root.addEventListener?.("pointerup", onEnd as never);
    root.addEventListener?.("pointercancel", onEnd as never);
    root.addEventListener?.("touchstart", onStart, { passive: true });
    root.addEventListener?.("touchmove", onMove);
    root.addEventListener?.("touchend", onEnd as never);
    root.addEventListener?.("touchcancel", onEnd as never);
  }

  return {
    dispose() {
      if (!root) return;
      const currentRoot = root;
      root = null;
      currentRoot.removeEventListener?.("pointerdown", onStart);
      currentRoot.removeEventListener?.("pointermove", onMove);
      currentRoot.removeEventListener?.("pointerup", onEnd as never);
      currentRoot.removeEventListener?.("pointercancel", onEnd as never);
      currentRoot.removeEventListener?.("touchstart", onStart);
      currentRoot.removeEventListener?.("touchmove", onMove);
      currentRoot.removeEventListener?.("touchend", onEnd as never);
      currentRoot.removeEventListener?.("touchcancel", onEnd as never);
    },
    update(nextRoot) {
      attach(nextRoot);
    },
  };
}
