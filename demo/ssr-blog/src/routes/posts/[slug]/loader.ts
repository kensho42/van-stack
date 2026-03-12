export default async function loader(input: { params: { slug: string } }) {
  return {
    post: {
      slug: input.params.slug,
      title: `Post: ${input.params.slug}`,
    },
  };
}
