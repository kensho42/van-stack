import { van } from "van-stack/render";

import { renderGalleryPage } from "../route-helpers/gallery";
import type { GalleryPageData } from "../runtime/data";

const { div, h1, p } = van.tags;

export function getClientRoot(document: Document) {
  const root = document.querySelector(
    "[data-showcase-client-root], [data-van-stack-app-root]",
  );

  if (!(root instanceof Element)) {
    throw new Error("No showcase client root was found in the document.");
  }

  return root;
}

export function renderClientPage(root: Element, data: GalleryPageData) {
  root.replaceChildren();
  van.add(root, renderGalleryPage(data));
}

export function renderClientLoading(
  root: Element,
  title: string,
  body: string,
) {
  root.replaceChildren();
  van.add(root, div({ class: "showcase-client-state" }, h1(title), p(body)));
}
