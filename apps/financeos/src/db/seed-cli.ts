import { getDb } from "./index";

async function main() {
  await getDb();
  console.log("FinanceOS database initialized and seeded cleanly.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
