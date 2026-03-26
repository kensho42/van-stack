import { createPostsIndexData } from "../../../../runtime/data";

export default function loader() {
  return createPostsIndexData("hydrated");
}
