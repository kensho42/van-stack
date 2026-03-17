import { getDemoPost } from "../../../content";

export default function loader(input: { params: { slug: string } }) {
  const post = getDemoPost(input.params.slug);

  if (!post) {
    throw new Error(`Unknown demo post: ${input.params.slug}`);
  }

  return { post };
}
