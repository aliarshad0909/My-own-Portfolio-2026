/**
 * Test runner.
 *
 * Node's built-in test runner, with native TypeScript stripping and a small
 * resolution hook (scripts/alias-hook.mjs) that understands the "@/…" alias.
 * No test framework and no bundler, so the dependency list stays at
 * next/react/react-dom and `npm ci` keeps working from the committed lockfile.
 *
 * Requires Node 22.18 or newer for type stripping; package.json declares it.
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const testsDir = path.join(root, "tests");
const files = readdirSync(testsDir)
  .filter((f) => /\.test\.(ts|tsx|mjs)$/.test(f))
  .map((f) => path.join(testsDir, f));

if (files.length === 0) {
  console.error("No test files found in tests/");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ["--import", pathToHook(), "--disable-warning=ExperimentalWarning", "--test", ...files],
  { stdio: "inherit", cwd: root },
);
process.exit(result.status ?? 1);

function pathToHook() {
  // register() via a data: URL keeps this to one flag and no extra file on disk.
  const hook = path.join(root, "scripts", "alias-hook.mjs");
  const url = new URL(`file://${hook}`).href;
  return `data:text/javascript,import{register}from"node:module";import{pathToFileURL}from"node:url";register(${JSON.stringify(url)},pathToFileURL("./"));`;
}
