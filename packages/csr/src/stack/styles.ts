import { stackPresentationSentinel } from "./constants";

export function ensureStackStyles() {
  if (
    typeof globalThis.document === "undefined" ||
    typeof globalThis.document.createElement !== "function"
  ) {
    return;
  }

  if (
    globalThis.document.querySelector?.(
      "style[data-van-stack-stack-presentation]",
    )
  ) {
    return;
  }

  const style = globalThis.document.createElement("style");
  style.setAttribute("data-van-stack-stack-presentation", "");
  style.textContent = `/* ${stackPresentationSentinel} */
[data-van-stack-stack-root] {
  position: relative;
  overflow: hidden;
  touch-action: pan-y;
}
[data-van-stack-native-edge-capture] {
  overscroll-behavior-x: none;
}
[data-van-stack-view] {
  box-sizing: border-box;
  width: 100%;
  min-width: 100%;
  background: var(--van-stack-page-background, Canvas);
  backface-visibility: hidden;
}
.van-stack-page-current {
  position: relative;
  z-index: 2;
  pointer-events: auto;
  transform: translate3d(0, 0, 0);
  opacity: 1;
}
.van-stack-page-previous,
.van-stack-page-next {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}
.van-stack-page-previous {
  transform: translate3d(-20%, 0, 0);
}
.van-stack-page-next {
  transform: translate3d(100%, 0, 0);
}
.van-stack-transition-backward .van-stack-page-current {
  z-index: 1;
}
.van-stack-transition-backward .van-stack-page-next {
  z-index: 2;
}
.van-stack-transition [data-van-stack-view],
.van-stack-swipe-active [data-van-stack-view] {
  will-change: transform, opacity;
}
.van-stack-transition-ios-slide-forward .van-stack-page-current,
.van-stack-transition-ios-slide-forward .van-stack-page-previous,
.van-stack-transition-ios-slide-backward .van-stack-page-current,
.van-stack-transition-ios-slide-backward .van-stack-page-next {
  transition: transform var(--van-stack-transition-duration, 320ms) cubic-bezier(.32,.72,0,1);
}
.van-stack-transition-android-fade-through-forward .van-stack-page-current,
.van-stack-transition-android-fade-through-forward .van-stack-page-next,
.van-stack-transition-android-fade-through-backward .van-stack-page-current,
.van-stack-transition-android-fade-through-backward .van-stack-page-previous,
.van-stack-transition-fade-forward .van-stack-page-current,
.van-stack-transition-fade-forward .van-stack-page-next,
.van-stack-transition-fade-backward .van-stack-page-current,
.van-stack-transition-fade-backward .van-stack-page-previous,
.van-stack-transition-cover-forward .van-stack-page-current,
.van-stack-transition-cover-forward .van-stack-page-next,
.van-stack-transition-cover-backward .van-stack-page-current,
.van-stack-transition-cover-backward .van-stack-page-previous {
  transition:
    transform var(--van-stack-transition-duration, 240ms) ease,
    opacity var(--van-stack-transition-duration, 240ms) ease;
}
.van-stack-swipe-shadow,
.van-stack-swipe-opacity {
  position: absolute;
  pointer-events: none;
}
.van-stack-swipe-shadow {
  top: 0;
  bottom: 0;
  left: -10px;
  width: 10px;
  background: linear-gradient(
    to right,
    rgb(0 0 0 / 0%) 0%,
    rgb(0 0 0 / 0%) 45%,
    rgb(0 0 0 / 1%) 75%,
    rgb(0 0 0 / 6%) 100%
  );
}
.van-stack-swipe-opacity {
  inset: 0;
  background: rgb(0 0 0 / 10%);
}
@media (prefers-reduced-motion: reduce) {
  .van-stack-transition [data-van-stack-view] {
    transition-duration: 0ms !important;
    animation-duration: 0ms !important;
  }
}`;
  globalThis.document.head?.appendChild(style);
}
