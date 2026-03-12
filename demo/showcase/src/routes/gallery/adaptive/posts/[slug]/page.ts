import { van } from "van-stack/render";

import {
  getPostByline,
  getPostEyebrow,
} from "../../../../../components/blog";
import { getModeCallout } from "../../../../../components/chrome";
import type { GalleryPostData } from "../../../../../runtime/data";

const { article, aside, h1, h2, li, p, section, ul } = van.tags;

export default function page(input: { data: unknown }) {
  const data = input.data as GalleryPostData;
  const callout = getModeCallout("adaptive");

  return article(
    p(getPostEyebrow(data.post)),
    h1(data.post.title),
    p(getPostByline(data.post)),
    p(data.post.summary),
    aside(h2(callout.title), p(callout.body)),
    p("Adaptive navigation can choose between replace and stack presentation."),
    section(
      h2("Related posts"),
      ul(...data.related.map((post) => li(post.title))),
    ),
  );
}
