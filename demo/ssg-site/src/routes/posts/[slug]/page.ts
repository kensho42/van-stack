import { van } from "van-stack/render";

const { a, article, h1, p } = van.tags;

export default function page(input: {
  data: {
    post: {
      slug: string;
      title: string;
      summary: string;
      body: string;
    };
  };
}) {
  const { post } = input.data;

  return article(
    h1(post.title),
    p(post.summary),
    p(post.body),
    p(a({ href: "/" }, "Back to the export index")),
  );
}
