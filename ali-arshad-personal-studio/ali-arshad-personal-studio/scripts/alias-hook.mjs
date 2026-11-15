/**
 * Module resolution hook that teaches Node the "@/…" path alias from
 * tsconfig.json, so test files can import application modules the same way
 * the application does.
 *
 * This exists so the test suite needs no bundler and no extra dependency:
 * Node 22.18+ strips TypeScript types natively, and this hook supplies the
 * only other thing that was missing. Keeping the dependency list to
 * next/react/react-dom also keeps `npm ci` honest — adding a build tool just
 * to run tests would have desynchronised package-lock.json.
 */
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** TypeScript imports are extensionless or ".ts"; resolve both to a real file. */
function resolveFile(base) {
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")];
  return candidates.find((c) => existsSync(c));
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const target = resolveFile(path.join(appRoot, specifier.slice(2)));
    if (target) return { url: pathToFileURL(target).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
