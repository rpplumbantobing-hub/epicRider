// Reason code otorisasi — epicRider Phase 4.
// Vocabulary terkontrol dari `AUTHORIZATION_MODEL.md` §3 (PROPOSED; owner
// ratifikasi menunggu). Subset yang DIEVALUASI di Phase 4 + deklarasi penuh
// (kode Phase 5+ dideklarasikan agar kontrak stabil, namun belum dievaluasi —
// runtime entitlement = Phase 5).

export const ReasonCode = {
  ALLOW: "ALLOW",
  DENY_NO_SESSION: "DENY_NO_SESSION",
  DENY_SESSION_EXPIRED: "DENY_SESSION_EXPIRED",
  DENY_SESSION_REVOKED: "DENY_SESSION_REVOKED",
  DENY_TENANT_MISMATCH: "DENY_TENANT_MISMATCH",
  DENY_NOT_MEMBER: "DENY_NOT_MEMBER",
  DENY_MEMBERSHIP_SUSPENDED: "DENY_MEMBERSHIP_SUSPENDED",
  DENY_MEMBERSHIP_REMOVED: "DENY_MEMBERSHIP_REMOVED",
  DENY_PERMISSION_MISSING: "DENY_PERMISSION_MISSING",
  DENY_ASSIGNMENT_MISSING: "DENY_ASSIGNMENT_MISSING",
  DENY_TIER_ENTITLEMENT_MISSING: "DENY_TIER_ENTITLEMENT_MISSING", // dievaluasi Phase 5
  DENY_LICENSE_STATE: "DENY_LICENSE_STATE", // dievaluasi Phase 5
  DENY_EXTENSION_MISSING: "DENY_EXTENSION_MISSING", // dievaluasi Phase 5
  DENY_OBJECT_STATE: "DENY_OBJECT_STATE",
  DENY_QUOTA_EXCEEDED: "DENY_QUOTA_EXCEEDED", // seat/quota = OD-05 → Phase 5
  DENY_STORE_TIER: "DENY_STORE_TIER", // Phase 11
  DENY_SCOPE: "DENY_SCOPE", // auditor scope = REQ-053 (Phase 4+)
  DENY_CROSS_CONTEXT_ROLE: "DENY_CROSS_CONTEXT_ROLE",
  DENY_SELF_APPROVAL: "DENY_SELF_APPROVAL", // OD-136
  DENY_INVALID_INVITE: "DENY_INVALID_INVITE",
  DENY_RATE_LIMITED: "DENY_RATE_LIMITED",
  DENY_REPLAY: "DENY_REPLAY",
} as const;

export type ReasonCode = (typeof ReasonCode)[keyof typeof ReasonCode];

/** Status membership (DMC §3.3; REQ-049). */
export const MembershipStatus = {
  INVITED: "INVITED",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  REMOVED: "REMOVED",
  LEFT: "LEFT",
} as const;
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];

/** Status undangan (DMC §3.3; REQ-051). */
export const InvitationStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
} as const;
export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];
