import { getDb, getDbDriver } from "@/db";

async function main() {
  await getDb();
  console.log(`SupportOS database initialized and seeded successfully (driver: ${getDbDriver()}).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to seed SupportOS database:", err);
    process.exit(1);
  });
