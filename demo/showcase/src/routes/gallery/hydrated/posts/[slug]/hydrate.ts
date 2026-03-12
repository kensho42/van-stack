import { van } from "van-stack/render";

export default function hydrate(input: {
  root: Element;
  data: { post: { title: string } };
}) {
  const likes = van.state(3);
  const likeButton = input.root.querySelector("[data-like-button]");
  const likeCount = input.root.querySelector("[data-like-count]");

  if (!(likeButton instanceof HTMLButtonElement)) {
    throw new Error(`Missing like button for ${input.data.post.title}.`);
  }

  if (!(likeCount instanceof HTMLSpanElement)) {
    throw new Error(`Missing like count for ${input.data.post.title}.`);
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
