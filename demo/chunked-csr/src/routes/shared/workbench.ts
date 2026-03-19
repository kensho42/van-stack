import { van } from "van-stack/render";

const workbenchPanels = {
  overview: {
    title: "Workbench overview",
    summary:
      "The workspace panel changes by route while the shell sidebar stays mounted.",
    note: "Use this route to verify slot-scoped shell navigations in the chunked CSR demo.",
  },
  analytics: {
    title: "Analytics panel",
    summary:
      "Parallel slot branches let the workbench content change without reconstructing the surrounding shell.",
    note: "The sidebar remains the same slot route while the workspace branch resolves a different page module.",
  },
  audits: {
    title: "Audit queue",
    summary:
      "The route path changes, the workspace content changes, and the sidebar slot can stay untouched.",
    note: "This mirrors a control-plane UI where a navigation rail should keep its own DOM and local state.",
  },
} as const;

const workbenchLinks = [
  {
    href: "/shell-workbench/overview",
    label: "Overview",
  },
  {
    href: "/shell-workbench/analytics",
    label: "Analytics",
  },
  {
    href: "/shell-workbench/audits",
    label: "Audits",
  },
] as const;

type WorkbenchSlug = keyof typeof workbenchPanels;

export type WorkbenchPageData = {
  note: string;
  slug: WorkbenchSlug;
  summary: string;
  title: string;
};

export function getWorkbenchPageData(slug: string): WorkbenchPageData {
  const normalizedSlug = (
    slug in workbenchPanels ? slug : "overview"
  ) as WorkbenchSlug;
  const panel = workbenchPanels[normalizedSlug];

  return {
    slug: normalizedSlug,
    title: panel.title,
    summary: panel.summary,
    note: panel.note,
  };
}

export function renderWorkbenchSidebar() {
  const { a, aside, h2, li, p, small, ul } = van.tags;

  return aside(
    {
      class: "chunked-workbench-sidebar",
      "data-shell-slot": "sidebar",
    },
    h2("Control plane"),
    p("This sidebar is served from a pathless @sidebar slot."),
    ul(
      ...workbenchLinks.map((link) =>
        li(a({ href: link.href }, link.label), small(link.href)),
      ),
    ),
  );
}

export function renderWorkbenchLanding() {
  const { a, article, h1, p } = van.tags;

  return article(
    { class: "chunked-workbench-landing" },
    h1("Shell slot workbench"),
    p(
      "This branch demonstrates a persistent @sidebar slot with workspace-only route updates.",
    ),
    a({ href: "/shell-workbench/overview" }, "Open the workbench"),
  );
}

export function renderWorkbenchPage(data: WorkbenchPageData) {
  const { article, h1, p, section, small } = van.tags;

  return article(
    {
      class: "chunked-workbench-page",
      "data-workbench-slug": data.slug,
    },
    h1(data.title),
    p(data.summary),
    section(
      p(data.note),
      small(`Slot-scoped route: /shell-workbench/${data.slug}`),
    ),
  );
}
