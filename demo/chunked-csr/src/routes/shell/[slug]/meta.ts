export default function meta(input: { data: unknown }) {
  const data = input.data as {
    mode: string;
    slug: string;
    summary: string;
    title: string;
  };

  return {
    title: data.title,
    description: data.summary,
    canonical: `/${data.mode}/${data.slug}`,
  };
}
