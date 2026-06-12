import van from "vanjs-core";

const { article, button, h1, p, span } = van.tags;

export default function page(input: {
  data: { post: { title: string; likes: number } };
}) {
  return article(
    h1(input.data.post.title),
    button({ "data-like-button": "" }, "Like"),
    p(span({ "data-like-count": "" }, input.data.post.likes), " likes"),
  );
}
