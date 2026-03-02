import { build, context } from "esbuild";

const watch = process.argv.includes("--watch");

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
};

if (watch) {
  const ctx = await context(buildOptions);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await build(buildOptions);
}
