/**
 * Test runner.
 *
 * The lib modules use the "@/…" path alias, which Node cannot resolve on its
 * own, so each test file is bundled with esbuild (alias + TypeScript) into a
 * temporary directory and then handed to Node's built-in test runner. No
 * test framework, no transpile step to configure, and the same alias rules
 * the Next.js build uses.
 */
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const testsDir = path.join(root, "tests");
const files = readdirSync(testsDir).filter((f) => /\.test\.(ts|tsx|mjs)$/.test(f));
if (files.length === 0) {
  console.error("No test files found in tests/");
  process.exit(1);
}

const out = mkdtempSync(path.join(tmpdir(), "studio-tests-"));
try {
  await build({
    entryPoints: files.map((f) => path.join(testsDir, f)),
    outdir: out,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    alias: { "@": root },
    // Node provides these; bundling them would be wrong.
    external: ["node:*", "react", "react-dom", "next", "next/*"],
    logLevel: "error",
    outExtension: { ".js": ".mjs" },
  });
  const bundled = readdirSync(out).filter((f) => f.endsWith(".mjs")).map((f) => path.join(out, f));
  const result = spawnSync(process.execPath, ["--test", ...bundled], { stdio: "inherit" });
  process.exit(result.status ?? 1);
} finally {
  rmSync(out, { recursive: true, force: true });
}
