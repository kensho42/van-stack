import { getShowcaseMode, type ShowcaseModeId } from "../content/modes";

export type ShowcaseTrack = {
  label: string;
  href: string;
  description: string;
};

const showcaseTracks = [
  {
    label: "Runtime Gallery",
    href: "/gallery",
    description:
      "Live runtime comparisons for hydrated, shell, custom, SSG, and adaptive behavior.",
  },
  {
    label: "Guided Walkthrough",
    href: "/walkthrough",
    description:
      "Annotated explanation pages that map the same blog app to each runtime capability.",
  },
] satisfies ShowcaseTrack[];

export function getShowcaseTracks() {
  return showcaseTracks;
}

export function getModeCallout(modeId: ShowcaseModeId) {
  const mode = getShowcaseMode(modeId);
  if (!mode) {
    throw new Error(`Unknown showcase mode: ${modeId}`);
  }

  return {
    title: `${mode.title} Mode`,
    body: mode.proves,
    href: mode.galleryPath,
  };
}
