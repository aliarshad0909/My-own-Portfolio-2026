import { readdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAB_ROOT = path.resolve(__dirname, "..");

function collectDirs(base) {
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "scripts" && d.name !== "concepts")
    .map((d) => path.join(base, d.name))
    .filter((dir) => existsSync(path.join(dir, "test.mjs")));
}

const dirs = [
  ...collectDirs(LAB_ROOT),
  ...collectDirs(path.join(LAB_ROOT, "concepts")),
];

let passed = 0;
let failed = 0;

for (const dir of dirs) {
  const rel = path.relative(LAB_ROOT, dir);
  const runDemo = spawnSync(process.execPath, ["index.mjs"], { cwd: dir, encoding: "utf8" });
  if (runDemo.status !== 0) {
    console.error(`FAIL DEMO: ${rel}\n${runDemo.stderr || runDemo.stdout}`);
    failed += 1;
    continue;
  }
  const runTest = spawnSync(process.execPath, ["--test", "test.mjs"], { cwd: dir, encoding: "utf8" });
  if (runTest.status !== 0) {
    console.error(`FAIL TEST: ${rel}\n${runTest.stderr || runTest.stdout}`);
    failed += 1;
    continue;
  }
  passed += 1;
}

console.log(`\nPROJECT-LAB VERIFICATION: ${passed}/${dirs.length} prototypes ran & passed node:test (${failed} failed)`);
process.exit(failed === 0 && dirs.length >= 76 ? 0 : 1);
