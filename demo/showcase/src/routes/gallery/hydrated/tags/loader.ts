import { createTagsIndexData } from "../../../../runtime/data";

export default function loader() {
  return createTagsIndexData("hydrated");
}
