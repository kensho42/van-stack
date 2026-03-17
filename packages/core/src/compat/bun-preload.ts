export {};

throw new Error(
  "van-stack/compat/bun-preload is unsupported because Bun runtime plugins do not intercept bare package imports during `bun run`. Use `bun run --tsconfig-override ./node_modules/van-stack/compat/bun-tsconfig.json <entry>` instead.",
);
