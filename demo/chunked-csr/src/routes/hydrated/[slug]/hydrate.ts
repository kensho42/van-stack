import { van } from "van-stack/render";

export default function hydrate(input: { root: unknown }) {
  if (!(input.root instanceof Element)) {
    return;
  }

  const marker = input.root.querySelector("[data-hydrated-note]");
  if (!(marker instanceof HTMLElement)) {
    return;
  }

  van.hydrate(marker, (dom: HTMLElement) => {
    dom.dataset.hydrated = "true";
    return dom;
  });
}
