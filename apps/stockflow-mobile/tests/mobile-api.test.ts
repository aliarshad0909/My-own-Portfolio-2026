import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ApiError, StockFlowApiClient, normalizeBaseUrl } from "../src/api/client.ts";

describe("StockFlow Mobile API Client", () => {
  it("normalizes trailing slashes on configured API URLs", () => {
    assert.equal(normalizeBaseUrl("https://stock.aliarshad.co/// "), "https://stock.aliarshad.co");
    assert.equal(normalizeBaseUrl("http://192.168.1.50:3020/"), "http://192.168.1.50:3020");
  });

  it("constructs client and tracks Bearer token state", () => {
    const client = new StockFlowApiClient("http://localhost:3020/");
    assert.equal(client.getBaseUrl(), "http://localhost:3020");
    assert.equal(client.getToken(), null);
    client.setToken("sf_test_token");
    assert.equal(client.getToken(), "sf_test_token");
    client.setBaseUrl("https://stock.aliarshad.co/");
    assert.equal(client.getBaseUrl(), "https://stock.aliarshad.co");
  });

  it("surfaces structured ApiError with HTTP status", () => {
    const err = new ApiError("Unauthorized", 401);
    assert.equal(err.message, "Unauthorized");
    assert.equal(err.status, 401);
    assert.ok(err instanceof Error);
  });

  it("syncs end-to-end with live StockFlow server when STOCKFLOW_TEST_URL is provided", async (t) => {
    const liveUrl = process.env.STOCKFLOW_TEST_URL;
    if (!liveUrl) {
      t.skip("Set STOCKFLOW_TEST_URL=http://127.0.0.1:3020 to run live backend sync test.");
      return;
    }

    const client = new StockFlowApiClient(liveUrl);
    const health = await client.checkHealth();
    assert.equal(health.ok, true);
    assert.equal(health.service, "stockflow-inventory");

    const login = await client.loginDemo();
    assert.ok(login.token.length > 20);
    assert.equal(login.user.email, "ops@stockflow.studio");

    const dashboard = await client.getDashboard();
    assert.ok(dashboard.kpis.totalProducts >= 8);
    assert.ok(dashboard.kpis.warehouseCount >= 3);

    const matched = await client.lookupByBarcode("8901234500101");
    assert.ok(matched, "Seeded EAN-13 barcode should resolve");
    assert.equal(matched.sku, "SF-AUD-101");

    const firstWh = matched.warehouseStock[0];
    assert.ok(firstWh, "Product should have warehouse stock");

    const beforeQty = firstWh.quantityOnHand;
    const adj = await client.adjustStock({
      productId: matched.id,
      warehouseId: firstWh.warehouseId,
      type: "receipt",
      quantityDelta: 3,
      reference: "MOB-TEST-01",
      note: "Automated mobile client sync test",
    });
    assert.equal(adj.newQuantityOnHand, beforeQty + 3);
    assert.equal(adj.movement.source, "mobile");

    const alerts = await client.getAlerts();
    assert.ok(Array.isArray(alerts.lowStock));

    await client.resetDemo();
    const afterReset = await client.lookupByBarcode("8901234500101");
    assert.equal(
      afterReset?.warehouseStock.find((w) => w.warehouseCode === firstWh.warehouseCode)?.quantityOnHand,
      beforeQty,
    );

    await client.logout();
    assert.equal(client.getToken(), null);
  });
});
