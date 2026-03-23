import { renderWorkbenchPage } from "../../shared/workbench";

export default function page(input: { data: unknown }) {
  return renderWorkbenchPage(
    input.data as Parameters<typeof renderWorkbenchPage>[0],
  );
}
