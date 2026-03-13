import type { RouteHydrateInput } from "van-stack/csr";
import { van } from "van-stack/render";

export default function hydrate(input: RouteHydrateInput) {
  const post = input.data as { post: { title: string } };

  if (!(input.root instanceof Element)) {
    throw new Error(`Missing hydrate root for ${post.post.title}.`);
  }

  const likes = van.state(3);
  const likeButton = input.root.querySelector("[data-like-button]");
  const likeCount = input.root.querySelector("[data-like-count]");

  if (!(likeButton instanceof HTMLButtonElement)) {
    throw new Error(`Missing like button for ${post.post.title}.`);
  }

  if (!(likeCount instanceof HTMLSpanElement)) {
    throw new Error(`Missing like count for ${post.post.title}.`);
  }

  van.hydrate(likeButton, (dom: HTMLButtonElement) => {
    dom.onclick = () => {
      likes.val += 1;
    };
    return dom;
  });

  van.hydrate(likeCount, (dom: HTMLSpanElement) => {
    dom.textContent = String(likes.val);
    return dom;
  });
}
