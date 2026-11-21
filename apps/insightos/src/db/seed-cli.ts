import { getDb, getDbDriver } from "@/db";

async function main() {
  await getDb();
  console.log(`InsightOS database initialized and seeded successfully (driver: ${getDbDriver()}).`);
}

main().catch((err) => {
  console.error("Failed to seed InsightOS database:", err);
  process.exit(1);
});
