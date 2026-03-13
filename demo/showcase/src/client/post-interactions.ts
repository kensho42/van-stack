import type { GalleryPageData } from "../runtime/data";

type QueryRootLike = {
  querySelector: (selector: string) => unknown;
};

type ButtonLike = {
  onclick?: ((event?: unknown) => void) | null;
  textContent: string | null;
};

type TextLike = {
  textContent: string | null;
};

export type SessionStorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

const interactiveModeIds = new Set(["hydrated", "islands", "shell", "custom"]);

function getSessionStorage(storage: SessionStorageLike | undefined) {
  if (storage) {
    return storage;
  }
  if (typeof globalThis.sessionStorage !== "undefined") {
    return globalThis.sessionStorage;
  }

  return null;
}

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

function getLikeStorageKey(slug: string) {
  return `showcase:likes:${slug}`;
}

function getBookmarkStorageKey(slug: string) {
  return `showcase:bookmark:${slug}`;
}

function readStoredLikeCount(
  storage: SessionStorageLike | null,
  slug: string,
  fallback: string,
) {
  const stored = storage?.getItem(getLikeStorageKey(slug));
  const parsed = Number(stored ?? fallback);

  return Number.isFinite(parsed) ? parsed : Number(fallback) || 0;
}

function readStoredBookmark(storage: SessionStorageLike | null, slug: string) {
  return storage?.getItem(getBookmarkStorageKey(slug)) === "saved";
}

function setBookmarkCopy(button: ButtonLike, state: TextLike, saved: boolean) {
  button.textContent = saved ? "Remove bookmark" : "Save for later";
  state.textContent = saved ? "Saved for this session" : "Not saved";
}

export function mountShowcasePostInteractions(
  root: unknown,
  data: GalleryPageData,
  storage?: SessionStorageLike,
) {
  if (
    data.pageType !== "post-detail" ||
    !interactiveModeIds.has(data.mode.id) ||
    !isQueryRootLike(root)
  ) {
    return false;
  }

  const likeButton = root.querySelector("[data-like-button]");
  const likeCount = root.querySelector("[data-like-count]");
  const bookmarkButton = root.querySelector("[data-bookmark-button]");
  const bookmarkState = root.querySelector("[data-bookmark-state]");

  if (
    !isButtonLike(likeButton) ||
    !isTextLike(likeCount) ||
    !isButtonLike(bookmarkButton) ||
    !isTextLike(bookmarkState)
  ) {
    return false;
  }

  const sessionStorage = getSessionStorage(storage);
  let likes = readStoredLikeCount(
    sessionStorage,
    data.post.slug,
    likeCount.textContent ?? "0",
  );
  let bookmarked = readStoredBookmark(sessionStorage, data.post.slug);

  const sync = () => {
    likeCount.textContent = String(likes);
    setBookmarkCopy(bookmarkButton, bookmarkState, bookmarked);
  };

  likeButton.onclick = () => {
    likes += 1;
    sessionStorage?.setItem(getLikeStorageKey(data.post.slug), String(likes));
    sync();
  };

  bookmarkButton.onclick = () => {
    bookmarked = !bookmarked;
    sessionStorage?.setItem(
      getBookmarkStorageKey(data.post.slug),
      bookmarked ? "saved" : "idle",
    );
    sync();
  };

  sync();
  return true;
}
