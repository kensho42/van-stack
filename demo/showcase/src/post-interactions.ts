import type { GalleryPageData, GalleryPostData } from "./runtime/data";
import type { ShowcaseInteractionState } from "./runtime/interactions";

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export type ShowcasePostInteractionBinding = {
  getState: () => ShowcaseInteractionState | undefined;
  like: () => Promise<ShowcaseInteractionState>;
  load: () => Promise<ShowcaseInteractionState>;
  subscribe: (
    listener: (state: ShowcaseInteractionState) => void,
  ) => () => void;
  toggleBookmark: () => Promise<ShowcaseInteractionState>;
};

export type CreateShowcasePostInteractionBindingOptions = {
  fetch?: FetchLike;
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

function getInteractionApiPath(slug: string) {
  return `/api/showcase/posts/${slug}/interactions`;
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

function supportsShowcasePostInteractions(
  data: GalleryPageData,
): data is GalleryPostData {
  return (
    data.pageType === "post-detail" && interactiveModeIds.has(data.mode.id)
  );
}

export function createShowcasePostInteractionBinding(
  data: GalleryPageData,
  options?: CreateShowcasePostInteractionBindingOptions,
): ShowcasePostInteractionBinding | null {
  if (!supportsShowcasePostInteractions(data)) {
    return null;
  }

  const fetchImpl = getFetch(options?.fetch);
  const listeners = new Set<(state: ShowcaseInteractionState) => void>();
  let state = data.interactions;
  let pendingLoad: Promise<ShowcaseInteractionState> | null = null;

  const publish = (next: ShowcaseInteractionState) => {
    state = next;
    for (const listener of listeners) {
      listener(next);
    }

    return next;
  };

  const load = async () => {
    if (state) {
      return state;
    }

    if (!pendingLoad) {
      pendingLoad = requestInteractionState(fetchImpl, data.post.slug).then(
        (next) => publish(next),
      );
      pendingLoad.finally(() => {
        pendingLoad = null;
      });
    }

    return pendingLoad;
  };

  const mutate = async (action: "bookmark" | "like") => {
    const next = await requestInteractionState(fetchImpl, data.post.slug, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ action }),
    });

    return publish(next);
  };

  return {
    getState() {
      return state;
    },
    like() {
      return mutate("like");
    },
    load,
    subscribe(listener) {
      listeners.add(listener);
      if (state) {
        listener(state);
      }

      return () => {
        listeners.delete(listener);
      };
    },
    toggleBookmark() {
      return mutate("bookmark");
    },
  };
}
