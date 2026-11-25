import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lintPostgresMigration } from "./index.mjs";

describe("schema-migration-linter", () => {
  it("blocks non-concurrent indexes and approves safe concurrent DDL", () => {
    assert.equal(lintPostgresMigration("CREATE INDEX idx_a ON users(email);").safe, false);
    assert.equal(lintPostgresMigration("CREATE INDEX CONCURRENTLY idx_a ON users(email);").safe, true);
  });
});
