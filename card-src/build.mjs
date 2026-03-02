import { build, context } from "esbuild";
import { readFileSync } from "node:fs";

const watch = process.argv.includes("--watch");
const packageJson = JSON.parse(readFileSync(new URL("./package.json", import.meta.url)));
const cardVersion = packageJson.version;

const buildOptions = {
  entryPoints: ["webasto-connect-card.js"],
  bundle: true,
  format: "esm",
  target: ["es2020"],
  minify: true,
  sourcemap: false,
  outfile: "../custom_components/webastoconnect/card/webasto-connect-card.js",
  logLevel: "info",
  loader: {
    ".json": "json",
  },
  banner: {
    js: `globalThis.__WEBASTO_CONNECT_CARD_VERSION__ = "${cardVersion}";`,
  },
};

if (watch) {
  const ctx = await context(buildOptions);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await build(buildOptions);
}
