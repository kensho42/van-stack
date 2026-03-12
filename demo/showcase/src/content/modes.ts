export type ShowcaseModeId =
  | "hydrated"
  | "shell"
  | "custom"
  | "ssg"
  | "adaptive";

export type ShowcaseMode = {
  id: ShowcaseModeId;
  title: string;
  summary: string;
  proves: string;
  galleryPath: string;
  walkthroughPath: string;
};

export const showcaseModes = [
  {
    id: "hydrated",
    title: "Hydrated",
    summary: "Start from SSR HTML, then continue the blog on the client.",
    proves:
      "Shows server-first rendering with app handoff for the same post detail view.",
    galleryPath: "/gallery/hydrated/posts/runtime-gallery-tour",
    walkthroughPath: "/walkthrough/hydrated",
  },
  {
    id: "shell",
    title: "Shell",
    summary: "Boot from a minimal shell and load blog data through transport.",
    proves:
      "Shows route-driven loading without needing SSR HTML as the starting point.",
    galleryPath: "/gallery/shell/posts/runtime-gallery-tour",
    walkthroughPath: "/walkthrough/shell",
  },
  {
    id: "custom",
    title: "Custom",
    summary: "Keep data ownership inside the app while still using the router.",
    proves:
      "Shows app-owned resolution and component interactions for the blog detail page.",
    galleryPath: "/gallery/custom/posts/runtime-gallery-tour",
    walkthroughPath: "/walkthrough/custom",
  },
  {
    id: "ssg",
    title: "SSG",
    summary: "Materialize blog routes into static pages ahead of time.",
    proves:
      "Shows that the same content model can be emitted as prebuilt blog pages.",
    galleryPath: "/gallery/ssg/posts/runtime-gallery-tour",
    walkthroughPath: "/walkthrough/ssg",
  },
  {
    id: "adaptive",
    title: "Adaptive",
    summary:
      "Swap between replace and stack presentation for the same reading flow.",
    proves:
      "Shows how navigation presentation changes the reader experience without changing content.",
    galleryPath: "/gallery/adaptive/posts/adaptive-threads-in-practice",
    walkthroughPath: "/walkthrough/adaptive",
  },
] satisfies ShowcaseMode[];

export function getShowcaseMode(id: ShowcaseModeId) {
  return showcaseModes.find((mode) => mode.id === id);
}
