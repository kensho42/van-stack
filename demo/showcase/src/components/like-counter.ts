import { van } from "van-stack/render";

import type { ShowcasePostInteractionBinding } from "../post-interactions";
import type { ShowcaseInteractionState } from "../runtime/interactions";

const { button, p, section, span, strong } = van.tags;

type StateLike<T> = {
  val: T;
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

type LikeCounterPost = {
  readTimeMinutes: number;
};

type LikeCounterRenderOptions = {
  interactions?: ShowcaseInteractionState;
  likes?: StateLike<number>;
  onLike?: (() => Promise<void> | void) | undefined;
};

function getInitialLikeCount(post: LikeCounterPost) {
  return post.readTimeMinutes + 2;
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

export function renderLikeCounter(
  post: LikeCounterPost,
  options?: LikeCounterRenderOptions,
) {
  const likeCount = options?.likes;

  return section(
    { class: "runtime-panel" },
    p({ class: "showcase-eyebrow" }, "Reaction"),
    strong("Session likes"),
    p(
      span(
        { "data-like-count": "" },
        likeCount
          ? () => String(likeCount.val)
          : String(options?.interactions?.likes ?? getInitialLikeCount(post)),
      ),
      " readers found this helpful",
    ),
    button(
      {
        "data-like-button": "",
        type: "button",
        ...(options?.onLike ? { onclick: options.onLike } : {}),
      },
      "Like this post",
    ),
  );
}

export async function hydrateLikeCounter(
  root: unknown,
  binding: ShowcasePostInteractionBinding,
) {
  if (!isQueryRootLike(root)) {
    return false;
  }

  const likeButton = root.querySelector("[data-like-button]");
  const likeCount = root.querySelector("[data-like-count]");

  if (!isButtonLike(likeButton) || !isTextLike(likeCount)) {
    return false;
  }

  binding.subscribe((state) => {
    likeCount.textContent = String(state.likes);
  });
  await binding.load();

  likeButton.onclick = async () => {
    await binding.like();
  };

  return true;
}
