/**
 * Registers the "@/…" resolution hook for standalone scripts run with
 * `node --import ./scripts/alias-hook-register.mjs <script>`.
 * The test runner registers the same hook inline; this file is the reusable
 * entry point for scripts (CSV export, SEO audit) outside the test runner.
 */
import { register } from "node:module";
register(new URL("./alias-hook.mjs", import.meta.url), import.meta.url);
