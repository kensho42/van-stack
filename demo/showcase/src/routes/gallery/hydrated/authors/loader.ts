import { createAuthorsIndexData } from "../../../../runtime/data";

export default function loader() {
  return createAuthorsIndexData("hydrated");
}
