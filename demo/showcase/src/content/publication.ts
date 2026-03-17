export type ShowcasePublication = {
  description: string;
  issue: string;
  name: string;
  tagline: string;
};

export const showcasePublication = {
  name: "Northstar Journal",
  tagline:
    "A full editorial product used to compare runtime delivery and adaptive navigation.",
  description:
    "Northstar Journal is the evaluator-facing blog app used to compare SSG, SSR, hydrated, islands, shell, custom, and adaptive stack presentation on the same editorial graph.",
  issue: "Spring 2026 Evaluator Edition",
} satisfies ShowcasePublication;
