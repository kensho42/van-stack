import { van } from "van-stack/render";

import { getShowcaseInitialLikeCount } from "../content/blog";
import {
  buildShowcaseGalleryPath,
  getShowcaseMode,
  getSiblingShowcaseModes,
  type ShowcaseLiveModeId,
  type ShowcaseModeId,
} from "../content/modes";
import { createShowcasePostInteractionBinding } from "../post-interactions";
import type { GalleryPostData } from "../runtime/data";
import { renderBookmarkToggle } from "./bookmark-toggle";
import { renderLikeCounter } from "./like-counter";

const { a, div, h2, li, p, section, span, strong, ul } = van.tags;
const interactiveModeIds = new Set<ShowcaseModeId>([
  "hydrated",
  "islands",
  "shell",
  "custom",
  "chunked",
]);

export type ShowcaseComparisonTarget = {
  collection: "posts" | "authors" | "categories" | "tags";
  slug: string;
  label: string;
};

export function getModeCallout(modeId: ShowcaseModeId) {
  const mode = getShowcaseMode(modeId);
  if (mode) {
    return {
      title: `${mode.title} Mode`,
      body: mode.proves,
      href: mode.galleryPath,
    };
  }

  throw new Error(`Unknown showcase mode: ${modeId}`);
}

export function renderModePill(modeId: ShowcaseLiveModeId) {
  const mode = getShowcaseMode(modeId);
  if (!mode) {
    throw new Error(`Unknown showcase mode: ${modeId}`);
  }

  return span({ class: `mode-pill mode-pill--${mode.id}` }, mode.title);
}

export function modeHasReaderPulse(modeId: ShowcaseModeId) {
  return interactiveModeIds.has(modeId);
}

export function renderRuntimePanel(modeId: ShowcaseLiveModeId) {
  const mode = getShowcaseMode(modeId);
  if (!mode) {
    throw new Error(`Unknown showcase mode: ${modeId}`);
  }

  return section(
    { class: "runtime-panel" },
    div(
      { class: "runtime-panel__head" },
      renderModePill(modeId),
      strong(mode.deliveryLabel),
    ),
    p(mode.summary),
    p({ class: "showcase-subtle" }, mode.dataBoundary),
  );
}

export function renderReaderPulse(data: GalleryPostData) {
  const { interactions, mode, post } = data;
  const modeId = mode.id;

  if (!modeHasReaderPulse(modeId)) {
    return null;
  }

  if (!getShowcaseMode(modeId)) {
    throw new Error(`Unknown showcase mode: ${modeId}`);
  }

  const liveControls = createRemountedReaderPulse(data);
  const likeCounterOptions = liveControls
    ? {
        likes: liveControls.likes,
        onLike: liveControls.like,
      }
    : {
        interactions,
      };
  const bookmarkToggleOptions = liveControls
    ? {
        bookmarked: liveControls.bookmarked,
        onToggle: liveControls.toggleBookmark,
      }
    : {
        interactions,
      };

  return section(
    { class: "showcase-section-block", "data-post-slug": post.slug },
    h2("Reader pulse"),
    p(getReaderPulseSummary(modeId, Boolean(liveControls))),
    div(
      { class: "taxonomy-row" },
      a(
        {
          href: buildShowcaseGalleryPath(modeId, "posts", post.slug),
          "data-van-stack-ignore": "",
        },
        "Open this story fresh",
      ),
    ),
    div(
      { class: "card-grid card-grid--tight" },
      renderLikeCounter(post, likeCounterOptions),
      renderBookmarkToggle(bookmarkToggleOptions),
    ),
  );
}

type StateLike<T> = {
  val: T;
};

type ReaderPulseControls = {
  bookmarked: StateLike<boolean>;
  likes: StateLike<number>;
  like: () => Promise<void>;
  toggleBookmark: () => Promise<void>;
};

function isBrowserEnvironment() {
  return (
    typeof globalThis.window !== "undefined" &&
    typeof globalThis.document !== "undefined"
  );
}

function getReaderPulseSummary(
  modeId: ShowcaseLiveModeId,
  isLiveRemount: boolean,
) {
  if (modeId === "islands") {
    return "This page keeps navigation on the server and enhances only the marked post controls.";
  }

  if (modeId === "hydrated" && isLiveRemount) {
    return "The server painted this article first. The hydrated browser entry then remounted the route and took over these controls.";
  }

  return "This interaction persists for the current browser session without changing the underlying editorial route.";
}

function createRemountedReaderPulse(
  data: GalleryPostData,
): ReaderPulseControls | null {
  if (data.mode.id !== "hydrated" || !isBrowserEnvironment()) {
    return null;
  }

  const binding = createShowcasePostInteractionBinding(data);
  if (!binding) {
    return null;
  }

  const initialState = binding.getState() ??
    data.interactions ?? {
      likes: getShowcaseInitialLikeCount(data.post),
      bookmarked: false,
    };
  const likes = van.state(initialState.likes) as StateLike<number>;
  const bookmarked = van.state(initialState.bookmarked) as StateLike<boolean>;

  binding.subscribe((state) => {
    likes.val = state.likes;
    bookmarked.val = state.bookmarked;
  });

  return {
    likes,
    bookmarked,
    async like() {
      await binding.like();
    },
    async toggleBookmark() {
      await binding.toggleBookmark();
    },
  };
}

export function renderSiblingModeLinks(
  currentModeId: ShowcaseLiveModeId,
  target: ShowcaseComparisonTarget,
) {
  return section(
    { class: "runtime-panel runtime-panel--comparison" },
    h2("Compare this route in other modes"),
    p(
      { class: "showcase-subtle" },
      "Keep the same entity and switch only the delivery contract.",
    ),
    ul(
      ...getSiblingShowcaseModes(currentModeId).map((mode) =>
        li(
          a(
            {
              href: buildShowcaseGalleryPath(
                mode.id,
                target.collection,
                target.slug,
              ),
              "data-van-stack-ignore": "",
            },
            `${mode.title}: ${target.label}`,
          ),
        ),
      ),
    ),
  );
}
