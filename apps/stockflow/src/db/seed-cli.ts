import { resetDemoWorkspace } from "@/db";

async function main() {
  await resetDemoWorkspace();
  console.log("StockFlow demo inventory seeded cleanly.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

