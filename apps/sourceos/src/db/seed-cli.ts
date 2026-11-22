import { getDb, getDbDriver } from "@/db";

async function main() {
  await getDb();
  console.log(`SourceOS database migrated and seeded successfully (driver: ${getDbDriver()}).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to seed SourceOS database:", err);
    process.exit(1);
  });
