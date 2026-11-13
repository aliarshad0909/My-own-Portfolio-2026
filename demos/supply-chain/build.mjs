// Bundles the app into ./dist as static files, deployable to any static host.
import { build, context } from "esbuild";
import fs from "node:fs";

const serve = process.argv.includes("--serve");
const outdir = "dist";
const options = {
  entryPoints: ["src/main.tsx"],
  bundle: true, outdir, entryNames: "app", jsx: "automatic", target: ["es2020"],
  minify: !serve, sourcemap: serve,
  define: { "process.env.NODE_ENV": JSON.stringify(serve ? "development" : "production") },
  logLevel: "info",
};

fs.rmSync(outdir, { recursive: true, force: true });
fs.mkdirSync(outdir, { recursive: true });
fs.cpSync("public", outdir, { recursive: true });

if (serve) {
  const ctx = await context(options);
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: outdir, port: 5173 });
  console.log(`Dev server: http://localhost:${port}`);
} else {
  await build(options);
}
