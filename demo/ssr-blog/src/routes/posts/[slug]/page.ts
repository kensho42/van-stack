import { van } from "van-stack/render";

const { article, h1 } = van.tags;

export default function page(input: { data: { post: { title: string } } }) {
  return article(h1(input.data.post.title));
}
