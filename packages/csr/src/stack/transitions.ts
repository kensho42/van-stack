import type {
  RouteNavigation,
  RouteNavigationRetention,
  RouteNavigationTransition,
} from "../../../core/src/index";
import {
  addClass,
  removeClass,
  removeInlineStyle,
  type StackViewRoot,
  setInlineStyle,
} from "./dom";

export type StackPlatform = "auto" | "ios" | "android";

export type ResolvedStackPlatform = Exclude<StackPlatform, "auto">;

export type StackTransitionOptions = {
  animate?: boolean;
  duration?: number;
  platform?: StackPlatform;
  retention?: RouteNavigationRetention;
  transition?: RouteNavigationTransition;
};

export type ResolvedStackTransition = {
  animate: boolean;
  duration: number;
  name: Exclude<RouteNavigationTransition, "platform">;
  platform: ResolvedStackPlatform;
};

export type StackTransitionDirection = "forward" | "backward";

const pagePositionClasses = [
  "van-stack-page-previous",
  "van-stack-page-current",
  "van-stack-page-next",
];

function detectPlatform(): ResolvedStackPlatform {
  const navigatorLike =
    typeof globalThis.navigator !== "undefined" ? globalThis.navigator : null;
  const userAgent = navigatorLike?.userAgent.toLowerCase() ?? "";
  if (userAgent.includes("android")) return "android";
  return "ios";
}

export function resolvePlatform(
  platform: StackPlatform | undefined,
): ResolvedStackPlatform {
  if (platform === "ios" || platform === "android") {
    return platform;
  }
  return detectPlatform();
}

function prefersReducedMotion() {
  return (
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function defaultDuration(platform: ResolvedStackPlatform) {
  return platform === "android" ? 220 : 320;
}

export function resolveTransition(
  options: StackTransitionOptions,
  routeNavigation: RouteNavigation | undefined,
): ResolvedStackTransition {
  const platform = resolvePlatform(options.platform);
  const requested =
    routeNavigation?.transition ?? options.transition ?? "platform";
  const name =
    requested === "platform"
      ? platform === "android"
        ? "android-fade-through"
        : "ios-slide"
      : requested;
  const animate =
    (routeNavigation?.animate ?? options.animate ?? true)
      ? !prefersReducedMotion() && name !== "none"
      : false;

  return {
    animate,
    duration: options.duration ?? defaultDuration(platform),
    name,
    platform,
  };
}

export function resolveRetention(
  options: StackTransitionOptions,
  routeNavigation: RouteNavigation | undefined,
): RouteNavigationRetention {
  return routeNavigation?.retention ?? options.retention ?? "previous";
}

export function setPagePosition(
  root: StackViewRoot,
  position: "previous" | "current" | "next",
) {
  removeClass(root, ...pagePositionClasses);
  addClass(root, `van-stack-page-${position}`);
}

export function setTransitionRoot(
  root: StackViewRoot,
  transition: ResolvedStackTransition,
  direction: StackTransitionDirection,
) {
  setInlineStyle(
    root,
    "--van-stack-transition-duration",
    `${transition.duration}ms`,
  );
  addClass(
    root,
    "van-stack-transition",
    `van-stack-transition-${direction}`,
    `van-stack-transition-${transition.name}-${direction}`,
  );
}

export function clearTransitionRoot(
  root: StackViewRoot,
  transition: ResolvedStackTransition,
  direction: StackTransitionDirection,
) {
  removeClass(
    root,
    "van-stack-transition",
    `van-stack-transition-${direction}`,
    `van-stack-transition-${transition.name}-${direction}`,
  );
  removeInlineStyle(root, "--van-stack-transition-duration");
}

export async function waitForTransition(
  root: StackViewRoot,
  transition: ResolvedStackTransition,
) {
  if (!transition.animate || transition.duration <= 0) {
    return;
  }

  if (
    typeof globalThis.document === "undefined" ||
    !("classList" in root) ||
    typeof globalThis.setTimeout !== "function"
  ) {
    return;
  }

  await new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, transition.duration);
  });
}
