import type { GalleryPageData } from "../runtime/data";

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

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export type MountShowcasePostInteractionsOptions = {
  fetch?: FetchLike;
};

type ShowcaseInteractionState = {
  bookmarked: boolean;
  likes: number;
};

const interactiveModeIds = new Set(["hydrated", "islands", "shell", "custom"]);

function getFetch(fetchImpl: FetchLike | undefined) {
  if (fetchImpl) {
    return fetchImpl;
  }
  if (typeof fetch === "function") {
    return fetch;
  }

  throw new Error(
    "No fetch implementation is available for post interactions.",
  );
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

function getInteractionApiPath(slug: string) {
  return `/api/showcase/posts/${slug}/interactions`;
}

function setBookmarkCopy(button: ButtonLike, state: TextLike, saved: boolean) {
  button.textContent = saved ? "Remove bookmark" : "Save for later";
  state.textContent = saved ? "Saved for this session" : "Not saved";
}

async function requestInteractionState(
  fetchImpl: FetchLike,
  slug: string,
  init?: RequestInit,
) {
  const response = await fetchImpl(getInteractionApiPath(slug), init);
  if (!response.ok) {
    throw new Error(
      `Showcase interaction request failed for ${slug}: ${response.status}`,
    );
  }

  return (await response.json()) as ShowcaseInteractionState;
}

export async function mountShowcasePostInteractions(
  root: unknown,
  data: GalleryPageData,
  options?: MountShowcasePostInteractionsOptions,
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

  const fetchImpl = getFetch(options?.fetch);
  let state = data.interactions
    ? data.interactions
    : await requestInteractionState(fetchImpl, data.post.slug);

  const sync = () => {
    likeCount.textContent = String(state.likes);
    setBookmarkCopy(bookmarkButton, bookmarkState, state.bookmarked);
  };

  likeButton.onclick = async () => {
    state = await requestInteractionState(fetchImpl, data.post.slug, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ action: "like" }),
    });
    sync();
  };

  bookmarkButton.onclick = async () => {
    state = await requestInteractionState(fetchImpl, data.post.slug, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ action: "bookmark" }),
    });
    sync();
  };

  sync();
  return true;
}
