// Unit test policy layer — epicRider Phase 4 (REQ-026 matriks permission;
// REQ-023 tenant; REQ-025 pemisahan konsep; REQ-050 assignment; REQ-052
// cross-context role). Evaluator murni — tanpa I/O.

import { describe, expect, it } from "vitest";
import { evaluatePolicy, type PolicyRequest } from "@/lib/authz/policy";
import { ReasonCode } from "@/lib/authz/reason-codes";
import { Permission } from "@/lib/authz/permissions";

const base: PolicyRequest = {
  session: "VALID",
  actorUserId: "user-1",
  workspaceId: "ws-1",
  membershipStatus: "ACTIVE",
  roleKeys: ["owner"],
  permission: Permission.WORKSPACE_MEMBER_INVITE,
};

describe("evaluatePolicy — rantai evaluasi otorisasi", () => {
  it("ALLOW untuk owner dengan permission yang cocok", () => {
    expect(evaluatePolicy(base)).toEqual({
      decision: "ALLOW",
      reasonCode: ReasonCode.ALLOW,
    });
  });

  it("owner mewarisi baseline member (inheritance eksplisit §5.4)", () => {
    const decision = evaluatePolicy({
      ...base,
      roleKeys: ["owner"],
      permission: Permission.WORKSPACE_MEMBER_LEAVE, // baseline member
    });
    expect(decision.decision).toBe("ALLOW");
  });

  it("DENY_NO_SESSION tanpa sesi (prasyarat evaluasi pertama)", () => {
    expect(evaluatePolicy({ ...base, session: "ABSENT", actorUserId: null })).toEqual({
      decision: "DENY",
      reasonCode: ReasonCode.DENY_NO_SESSION,
    });
  });

  it("DENY_SESSION_EXPIRED / DENY_SESSION_REVOKED untuk sesi tidak valid", () => {
    expect(evaluatePolicy({ ...base, session: "EXPIRED" })).toEqual({
      decision: "DENY",
      reasonCode: ReasonCode.DENY_SESSION_EXPIRED,
    });
    expect(evaluatePolicy({ ...base, session: "REVOKED" })).toEqual({
      decision: "DENY",
      reasonCode: ReasonCode.DENY_SESSION_REVOKED,
    });
  });

  it("DENY_TENANT_MISMATCH tanpa konteks tenant (workspace-scoped)", () => {
    expect(evaluatePolicy({ ...base, workspaceId: null })).toEqual({
      decision: "DENY",
      reasonCode: ReasonCode.DENY_TENANT_MISMATCH,
    });
  });

  it("DENY_NOT_MEMBER untuk non-member dan status INVITED", () => {
    expect(evaluatePolicy({ ...base, membershipStatus: null, roleKeys: [] })).toEqual({
      decision: "DENY",
      reasonCode: ReasonCode.DENY_NOT_MEMBER,
    });
    expect(evaluatePolicy({ ...base, membershipStatus: "INVITED", roleKeys: [] })).toEqual({
      decision: "DENY",
      reasonCode: ReasonCode.DENY_NOT_MEMBER,
    });
  });

  it("DENY_MEMBERSHIP_SUSPENDED / DENY_MEMBERSHIP_REMOVED mengikuti status (REQ-049)", () => {
    expect(evaluatePolicy({ ...base, membershipStatus: "SUSPENDED" })).toEqual({
      decision: "DENY",
      reasonCode: ReasonCode.DENY_MEMBERSHIP_SUSPENDED,
    });
    expect(evaluatePolicy({ ...base, membershipStatus: "REMOVED" })).toEqual({
      decision: "DENY",
      reasonCode: ReasonCode.DENY_MEMBERSHIP_REMOVED,
    });
    expect(evaluatePolicy({ ...base, membershipStatus: "LEFT" })).toEqual({
      decision: "DENY",
      reasonCode: ReasonCode.DENY_NOT_MEMBER,
    });
  });

  it("DENY_PERMISSION_MISSING untuk member tanpa permission admin (deny-by-default)", () => {
    expect(
      evaluatePolicy({
        ...base,
        roleKeys: ["member"],
        permission: Permission.WORKSPACE_MEMBER_INVITE,
      })
    ).toEqual({ decision: "DENY", reasonCode: ReasonCode.DENY_PERMISSION_MISSING });
  });

  it("role TIDAK dikenal tidak memberi apa pun (deny-by-default, OD-122)", () => {
    expect(evaluatePolicy({ ...base, roleKeys: ["superadmin-buat-sendiri"] })).toEqual({
      decision: "DENY",
      reasonCode: ReasonCode.DENY_PERMISSION_MISSING,
    });
    expect(evaluatePolicy({ ...base, roleKeys: [] })).toEqual({
      decision: "DENY",
      reasonCode: ReasonCode.DENY_PERMISSION_MISSING,
    });
  });

  it("DENY_ASSIGNMENT_MISSING untuk akses event tanpa assignment (REQ-050; inner boundary)", () => {
    // Catatan: `event.read` BELUM ada di preset role Phase 4 (runtime event =
    // Phase 6) — gerbang assignment diuji dengan permission yang dimiliki
    // aktor atas objek berscope-event (pola guard Phase 6 kelak).
    const decision = evaluatePolicy({
      ...base,
      permission: Permission.MEMBERSHIP_READ, // dimiliki owner
      eventContext: { assignmentRequired: true, hasAssignment: false },
    });
    expect(decision).toEqual({
      decision: "DENY",
      reasonCode: ReasonCode.DENY_ASSIGNMENT_MISSING,
    });
    // Dengan assignment → ALLOW.
    const withAssignment = evaluatePolicy({
      ...base,
      permission: Permission.MEMBERSHIP_READ,
      eventContext: { assignmentRequired: true, hasAssignment: true },
    });
    expect(withAssignment.decision).toBe("ALLOW");
  });

  it("DENY_OBJECT_STATE untuk operasi atas membership terminal", () => {
    const decision = evaluatePolicy({
      ...base,
      permission: Permission.WORKSPACE_MEMBER_SUSPEND,
      objectState: "REMOVED",
    });
    expect(decision).toEqual({ decision: "DENY", reasonCode: ReasonCode.DENY_OBJECT_STATE });
  });

  it("matriks aktor×status×permission (REQ-023/026) — seluruh sel cross-tenant ditolak", () => {
    const statuses = ["INVITED", "SUSPENDED", "REMOVED", "LEFT"] as const;
    const permissions = [
      Permission.WORKSPACE_MEMBER_INVITE,
      Permission.WORKSPACE_MEMBER_SUSPEND,
      Permission.WORKSPACE_MEMBER_REMOVE,
      Permission.MEMBERSHIP_ROLE_ASSIGN,
      Permission.WORKSPACE_UPDATE,
    ];
    for (const status of statuses) {
      for (const permission of permissions) {
        const decision = evaluatePolicy({
          ...base,
          membershipStatus: status,
          roleKeys: ["owner"],
          permission,
        });
        expect(decision.decision).toBe("DENY");
      }
    }
  });
});
