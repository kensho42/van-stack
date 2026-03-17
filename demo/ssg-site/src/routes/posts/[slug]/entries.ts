import { demoPosts } from "../../../content";

export default function entries() {
  return demoPosts.map((post) => ({ slug: post.slug }));
}
