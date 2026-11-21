import { getDb, getDbDriver, resetDemoWorkspace } from "@/db";

async function main() {
  const shouldReset = process.argv.includes("--reset");
  await getDb();
  if (shouldReset) {
    await resetDemoWorkspace();
    console.log(`[bookos] Reset & seeded demo data via ${getDbDriver()}.`);
  } else {
    console.log(`[bookos] Verified schema & seeded demo data via ${getDbDriver()}.`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("[bookos] Seed failed:", err);
  process.exit(1);
});
