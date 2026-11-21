import { getDb, getDbDriver } from "@/db";

async function main() {
  await getDb();
  console.log(`[orexa] Database initialized and seeded via driver=${getDbDriver()}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[orexa] Seed failed:", err);
  process.exit(1);
});
