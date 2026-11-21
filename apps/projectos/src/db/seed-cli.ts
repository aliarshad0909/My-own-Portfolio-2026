import { getDb, getDbDriver } from "@/db";

async function main() {
  await getDb();
  console.log(`[projectos] Database initialized & seeded cleanly using driver: ${getDbDriver()}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[projectos] Seed failed:", err);
  process.exit(1);
});
