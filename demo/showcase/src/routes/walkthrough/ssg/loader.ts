import { getShowcaseSsgPage } from "../../../runtime/ssg-cache";

export default async function loader() {
  const sample = await getShowcaseSsgPage(
    "/gallery/ssg/posts/runtime-gallery-tour",
  );

  return {
    sampleHtml: sample?.html ?? "",
  };
}
