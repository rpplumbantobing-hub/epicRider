// Role model preset — epicRider Phase 4 (AUTHORIZATION_MODEL §5; OD-122 OPEN).
//
// Preset MINIMUM sesuai gated prompt §6.3: "implement the smallest
// role/permission model needed for this phase and mark defaults PROPOSED".
// miniRider baseline: `owner` + `member` (AUTHORIZATION_MODEL §5.2:
// "miniRider baseline is expected to need only owner + member — PROPOSED,
// pending OD-122").
//
// Aturan inheritance (AUTHORIZATION_MODEL §5.4):
// 1. Eksplisit, dalam konteks yang sama: owner mewarisi baseline member.
// 2. Tidak ada eskalasi lintas konteks: role workspace TIDAK pernah membawa
//    capability platform (developer role) dan sebaliknya (REQ-052).
// License ≠ role (MC §2; prompt §8) — tanpa entitlement runtime di Phase 4.

import { Permission } from "./permissions";

export const RoleKey = {
  OWNER: "owner",
  MEMBER: "member",
} as const;
export type RoleKey = (typeof RoleKey)[keyof typeof RoleKey];

/** Baseline `member` (kru): liat workspace + daftar anggota + keluar. */
const MEMBER_PERMISSIONS: readonly Permission[] = [
  Permission.WORKSPACE_READ,
  Permission.MEMBERSHIP_READ,
  Permission.WORKSPACE_MEMBER_LEAVE,
];

/** `owner`: baseline member + administrasi membership/undangan/role. */
const OWNER_PERMISSIONS: readonly Permission[] = [
  ...MEMBER_PERMISSIONS,
  Permission.WORKSPACE_UPDATE,
  Permission.WORKSPACE_MEMBER_INVITE,
  Permission.WORKSPACE_MEMBER_SUSPEND,
  Permission.WORKSPACE_MEMBER_REMOVE,
  Permission.MEMBERSHIP_ROLE_ASSIGN,
];

/** Peta preset role → permission efektif (inheritance eksplisit di atas). */
export const ROLE_PRESETS: Record<RoleKey, readonly Permission[]> = {
  [RoleKey.MEMBER]: MEMBER_PERMISSIONS,
  [RoleKey.OWNER]: OWNER_PERMISSIONS,
};

/** Kunci role preset yang dikenal (untuk seeding per workspace). */
export const SYSTEM_ROLE_KEYS: readonly RoleKey[] = [RoleKey.OWNER, RoleKey.MEMBER];

/** Permission efektif dari himpunan kunci role (union). */
export function permissionsForRoles(roleKeys: readonly string[]): Set<Permission> {
  const result = new Set<Permission>();
  for (const key of roleKeys) {
    const preset = ROLE_PRESETS[key as RoleKey];
    if (preset) {
      for (const permission of preset) result.add(permission);
    }
    // Role kustom/non-preset TIDAK didefinisikan di Phase 4 (OD-122) —
    // deny-by-default: kunci tak dikenal tidak memberikan apa pun.
  }
  return result;
}

/**
 * Permission platform (developer role) — TIDAK PERNAH menyentuh workspace.
 * Fungsi ini eksplisit mengembalikan himpunan kosong untuk operasi workspace:
 * pemisahan konteks REQ-052 (DENY_CROSS_CONTEXT_ROLE).
 */
export function workspacePermissionsForDeveloperRole(): Set<Permission> {
  return new Set<Permission>();
}
