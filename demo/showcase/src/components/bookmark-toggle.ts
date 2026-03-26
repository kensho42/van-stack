import { van } from "van-stack/render";

import type { ShowcasePostInteractionBinding } from "../post-interactions";
import type { ShowcaseInteractionState } from "../runtime/interactions";

const { button, p, section, strong } = van.tags;

type StateLike<T> = {
  val: T;
};

type BookmarkToggleRenderOptions = {
  bookmarked?: StateLike<boolean>;
  interactions?: ShowcaseInteractionState;
  onToggle?: (() => Promise<void> | void) | undefined;
};

type QueryRootLike = {
  querySelector: (selector: string) => unknown;
};

type ButtonLike = {
  onclick?: ((event?: unknown) => Promise<void> | void) | null;
  textContent: string | null;
};

type TextLike = {
  textContent: string | null;
};

function isQueryRootLike(value: unknown): value is QueryRootLike {
  return Boolean(
    value && typeof value === "object" && "querySelector" in value,
  );
}

function isButtonLike(value: unknown): value is ButtonLike {
  return Boolean(
    value &&
      typeof value === "object" &&
      "textContent" in value &&
      "onclick" in value,
  );
}

function isTextLike(value: unknown): value is TextLike {
  return Boolean(value && typeof value === "object" && "textContent" in value);
}

function setBookmarkCopy(
  buttonElement: ButtonLike,
  stateElement: TextLike,
  saved: boolean,
) {
  buttonElement.textContent = saved ? "Remove bookmark" : "Save for later";
  stateElement.textContent = saved ? "Saved for this session" : "Not saved";
}

export function renderBookmarkToggle(options?: BookmarkToggleRenderOptions) {
  const bookmarked = options?.bookmarked;

  return section(
    { class: "runtime-panel" },
    p({ class: "showcase-eyebrow" }, "Save state"),
    strong("Reading list"),
    p(
      { "data-bookmark-state": "" },
      bookmarked
        ? () => (bookmarked.val ? "Saved for this session" : "Not saved")
        : options?.interactions?.bookmarked
          ? "Saved for this session"
          : "Not saved",
    ),
    button(
      {
        "data-bookmark-button": "",
        type: "button",
        ...(options?.onToggle ? { onclick: options.onToggle } : {}),
      },
      bookmarked
        ? () => (bookmarked.val ? "Remove bookmark" : "Save for later")
        : options?.interactions?.bookmarked
          ? "Remove bookmark"
          : "Save for later",
    ),
  );
}

export async function hydrateBookmarkToggle(
  root: unknown,
  binding: ShowcasePostInteractionBinding,
) {
  if (!isQueryRootLike(root)) {
    return false;
  }

  const bookmarkButton = root.querySelector("[data-bookmark-button]");
  const bookmarkState = root.querySelector("[data-bookmark-state]");

  if (!isButtonLike(bookmarkButton) || !isTextLike(bookmarkState)) {
    return false;
  }

  binding.subscribe((state) => {
    setBookmarkCopy(bookmarkButton, bookmarkState, state.bookmarked);
  });
  await binding.load();

  bookmarkButton.onclick = async () => {
    await binding.toggleBookmark();
  };

  return true;
}
