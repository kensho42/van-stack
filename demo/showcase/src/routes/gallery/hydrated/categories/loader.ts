import { createCategoriesIndexData } from "../../../../runtime/data";

export default function loader() {
  return createCategoriesIndexData("hydrated");
}
