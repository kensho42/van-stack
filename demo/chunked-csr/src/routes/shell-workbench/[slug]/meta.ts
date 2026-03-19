export default function meta(input: { data: unknown }) {
  const data = input.data as {
    slug: string;
    summary: string;
    title: string;
  };

  return {
    title: data.title,
    description: data.summary,
    canonical: `/shell-workbench/${data.slug}`,
  };
}
