# Swipe-Back Short-View Flicker Design

## Problem

During an interactive swipe-back, Van Stack vertically translates the retained destination view so that it remains visually aligned while the window still has the outgoing view's scroll position. At the end of a committed gesture, Van Stack restores the destination view's saved scroll position and removes the temporary gesture styles.

When the outgoing scroll position is beyond the destination view's natural height, iOS can paint the style cleanup before its compositor has visibly applied the restored window scroll. The destination view then exposes the wrong vertical region for one frame. The ordinary Back path does not show this flicker because it restores scroll before its backward transition rather than during gesture cleanup.

## Root Cause

`restoreSwipeBackScroll` treats a synchronous `window.scrollY` match immediately after `window.scrollTo` as proof that visual scroll restoration has settled. It calls the gesture style cleanup in the same JavaScript task. A matching layout scroll offset does not guarantee that the visual viewport has crossed a paint boundary on iOS.

The existing asynchronous restoration path already retains the destination translation while waiting for the target offset, but the synchronous path bypasses that frame boundary.

## Design

Keep the existing swipe, stack retention, scroll restoration, and history ordering. Change only gesture cleanup timing:

1. Request the saved destination scroll as today.
2. If animation-frame scheduling is available, observe the restored offset from an animation-frame callback even when `window.scrollY` already reports the target synchronously.
3. Keep the destination view's vertical compensation until that callback confirms the target offset.
4. Clear gesture styles once, then continue the existing history update.
5. Preserve the synchronous fallback when `requestAnimationFrame` or `scrollTo` is unavailable.

This introduces no public API or documented behavior change. It only strengthens the existing guarantee that committed swipe-back transitions remain visually continuous while restoring scroll.

## Rejected Alternatives

### Restore scroll earlier during gesture settling

Starting restoration before the horizontal settle completes would broaden the behavioral change and could alter the perceived gesture motion. It is unnecessary for a cleanup-ordering bug.

### Add a minimum-height workaround in Thirr

Forcing destination pages to remain as tall as outgoing pages would hide the symptom in one consumer while leaving Van Stack incorrect. It would also create unnecessary blank layout space.

### Move each stack view to an independent scroll container

Per-view scroll containers would avoid window-scroll coordination, but they would be a substantial navigation and layout architecture change far beyond this defect.

## Testing

Add a focused regression test to the CSR stack presentation suite that models:

- a tall outgoing view;
- a shorter retained destination view;
- an outgoing scroll offset beyond the destination view's natural extent;
- a synchronous `scrollTo` implementation;
- an available animation-frame queue.

The test must fail before the runtime change by showing that compensation is cleared immediately. After the change, it must prove that:

- the saved destination scroll is requested;
- vertical compensation remains until an animation frame confirms the restored offset;
- gesture styles are then removed;
- history navigation occurs exactly once after cleanup.

Run the focused CSR test during the red-green cycle, then complete the repository-required `bun run test`, `bun run check`, and `bun run build` verification.
