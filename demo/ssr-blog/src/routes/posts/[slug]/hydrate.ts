import { van } from "van-stack/render";

export default function hydrate(input: {
  root: Element;
  data: { post: { likes: number } };
}) {
  const likes = van.state(input.data.post.likes);
  const likeButton = input.root.querySelector("[data-like-button]");
  const likeCount = input.root.querySelector("[data-like-count]");

  if (!(likeButton instanceof HTMLButtonElement)) {
    throw new Error("Missing like button hydration marker.");
  }

  if (!(likeCount instanceof HTMLSpanElement)) {
    throw new Error("Missing like count hydration marker.");
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
