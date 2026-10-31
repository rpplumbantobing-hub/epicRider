// Permission vocabulary — epicRider Phase 4.
// Subset Phase 4 dari `AUTHORIZATION_MODEL.md` §4.1–§4.3 (status PROPOSED pada
// dokumen model — vocabulary dipertahankan persis, tidak mengarang kode baru).
//
// Yang DIDEKLARASI namun BELUM dipakai runtime Phase 4:
// - identity.account.link / identity.account.recover → kanal WhatsApp belum
//   tersedia (OD-03); kebijakan linking didokumentasikan di ADR-022.
// - workspace.quota.read → seat/quota = OD-05 → Phase 5.

export const Permission = {
  // Identity (§4.1)
  IDENTITY_SESSION_LIST: "identity.session.list",
  IDENTITY_SESSION_REVOKE: "identity.session.revoke",
  IDENTITY_ACCOUNT_LINK: "identity.account.link",
  IDENTITY_ACCOUNT_RECOVER: "identity.account.recover",
  IDENTITY_PROFILE_READ: "identity.profile.read",
  IDENTITY_PROFILE_UPDATE: "identity.profile.update",
  // Workspace/Tenant (§4.2)
  WORKSPACE_CREATE: "workspace.create",
  WORKSPACE_READ: "workspace.read",
  WORKSPACE_UPDATE: "workspace.update",
  WORKSPACE_MEMBER_INVITE: "workspace.member.invite",
  WORKSPACE_MEMBER_SUSPEND: "workspace.member.suspend",
  WORKSPACE_MEMBER_REMOVE: "workspace.member.remove",
  WORKSPACE_MEMBER_LEAVE: "workspace.member.leave",
  WORKSPACE_QUOTA_READ: "workspace.quota.read",
  // Membership & Roles (§4.3)
  MEMBERSHIP_READ: "membership.read",
  MEMBERSHIP_ROLE_ASSIGN: "membership.role.assign",
  // Event & Assignment (§4.4) — reference-only di Phase 4 (runtime event = Phase 6)
  EVENT_READ: "event.read",
  // Entitlement & License (§4.5) — Phase 5-D: aksi lifecycle yang memiliki key
  // kanonik pada vocabulary model; key TIDAK diikat ke preset role Phase 4
  // (binding final menunggu ratifikasi owner — fallback owner PROPOSED, lihat
  // lifecycle-shared.ts dan ADR-025 §6).
  LICENSE_RENEW_INITIATE: "license.renew.initiate",
  // Extension (§4.6) — Phase 5-D: key kanonik aksi instance.
  EXTENSION_ASSIGN: "extension.assign",
  EXTENSION_REMOVE: "extension.remove",
  EXTENSION_RENEW_INITIATE: "extension.renew.initiate",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
