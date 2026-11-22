import { getDb, resetDemoWorkspace } from "@/db";

async function main() {
  await getDb();
  await resetDemoWorkspace();
  console.log("PeopleOS demo HR database seeded successfully.");
}

main().catch((err) => {
  console.error("Failed to seed PeopleOS database:", err);
  process.exit(1);
});
