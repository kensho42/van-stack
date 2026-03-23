import { getWorkbenchPageData } from "../../shared/workbench";

export default function loader(input: { params: Record<string, string> }) {
  return getWorkbenchPageData(input.params.slug);
}
