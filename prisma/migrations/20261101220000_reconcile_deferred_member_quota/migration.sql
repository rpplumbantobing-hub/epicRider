-- Phase 5 quota-policy reconciliation — ADR-027.
--
-- The Phase 5-B migration is historical and MUST NOT be edited. It seeded a
-- concrete miniRider=5 member quota before the owner had decided the numeric
-- base quota. ADR-027 defers numeric base quotas for all three tiers while
-- retaining the generic TierQuota model and additive seat-package extension.
--
-- This forward migration removes ONLY the exact historical seed row. It does
-- not remove the TierQuota table, alter its schema, or delete any other quota
-- configuration. Future owner-approved base quotas can be inserted later.
DELETE FROM "TierQuota"
WHERE "id" = 'quota_mini_crew_seats'
  AND "tierId" = 'tier_mini_rider'
  AND "quotaCode" = 'crew_seats_per_workspace'
  AND "limitValue" = 5
  AND "unit" = 'CREW_SEAT'
  AND "ownerCountedInQuota" IS NULL;
