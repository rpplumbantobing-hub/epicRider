// @vitest-environment node
// ADR-027 regression: numeric base member quotas remain deferred until owner
// determination; the historical Phase 5-B miniRider=5 seed is removed by a
// forward migration, while the generic TierQuota model remains available.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");
const MIGRATIONS_DIR = path.join(ROOT, "prisma", "migrations");
const PHASE5B = "20261030124013_phase5b_licensing_domain_foundation";
const POLICY = "20261101220000_reconcile_deferred_member_quota";

const phase5bMigration = () =>
  readFileSync(path.join(MIGRATIONS_DIR, PHASE5B, "migration.sql"), "utf8");
const policyMigration = () =>
  readFileSync(path.join(MIGRATIONS_DIR, POLICY, "migration.sql"), "utf8");

describe("ADR-027 deferred member quota policy", () => {
  it("keeps the historical seed immutable and applies a narrow forward correction", () => {
    const historical = phase5bMigration();
    const forward = policyMigration();

    // Historical Phase 5-B evidence must remain untouched.
    expect(historical).toContain("('quota_mini_crew_seats', 'tier_mini_rider', 'crew_seats_per_workspace', 5, 'CREW_SEAT', NULL, 'ACTIVE'");

    // The forward migration must remove only that exact undeclared seed row.
    expect(forward).toContain('DELETE FROM "TierQuota"');
    expect(forward).toContain('"id" = \'quota_mini_crew_seats\'');
    expect(forward).toContain('"tierId" = \'tier_mini_rider\'');
    expect(forward).toContain('"quotaCode" = \'crew_seats_per_workspace\'');
    expect(forward).toContain('"limitValue" = 5');
    expect(forward).toContain('"unit" = \'CREW_SEAT\'');
    expect(forward).toContain('"ownerCountedInQuota" IS NULL');

    // The correction must not remove the generic TierQuota infrastructure.
    expect(forward).not.toContain("DROP TABLE");
    expect(forward).not.toContain("ALTER TABLE");
    expect(forward).not.toContain("DELETE FROM \"LicenseTier\"");
    expect(forward).not.toContain("DELETE FROM \"ExtensionType\"");

    // The additive purchased-capacity extension remains part of the Phase 5-B foundation.
    expect(historical).toContain("'exttype_seat_package', 'seat_package'");
  });

  it("does not encode a new numeric base quota for any tier", () => {
    const forward = policyMigration();

    expect(forward).not.toMatch(/INSERT\s+INTO\s+"TierQuota"/i);
    expect(forward).not.toMatch(/MAX_RIDER.*quota|ISO_RIDER.*quota/i);
    expect(forward).toContain("ADR-027");
  });
});
