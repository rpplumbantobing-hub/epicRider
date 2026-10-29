// Invitation service — epicRider Phase 4 (DMC §3.3; REQ-051; gated prompt §6.2).
//
// Keamanan undangan:
//  - token: 32 byte acak kriptografis; HANYA hash SHA-256 yang disimpan;
//  - workspace + role yang ditawarkan terikat SERVER-SIDE (token tidak bisa
//    mengubah role);
//  - expiry (PROPOSED, configurable) + revocation;
//  - konsumsi SATU KALI secara atomik (updateMany status=PENDING → ACCEPTED);
//  - penerimaan WAJIB oleh identitas terautentikasi yang cocok dengan target
//    undangan (kepemilikan URL saja TIDAK cukup — gated prompt §6.2);
//  - semua peristiwa teraudit (created/accepted/revoked/expired/denied).
//
// Delivery: TIDAK ada provider email/SMS dipilih — link ditampilkan SEKALI
// kepada inviter untuk disampaikan manual (gated prompt §6.5: pisahkan domain
// invitation dari delivery provider).

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { securityConfig } from "@/lib/config/security-config";
import { logAudit, AuditCategory, AuditOutcome } from "@/lib/audit/audit-service";
import { ReasonCode, InvitationStatus } from "@/lib/authz/reason-codes";
import { RoleKey } from "@/lib/authz/roles";
import { Permission } from "@/lib/authz/permissions";
import { ApiError, ApiErrorCode } from "@/lib/api/problems";
import { consumeRateLimit } from "@/lib/auth/rate-limiter";

export interface InvitationSummary {
  id: string;
  workspaceId: string;
  workspaceName: string;
  contactTarget: string;
  roleKey: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function constantTimeEqualsHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

/** Buat undangan (permission: workspace.member.invite — dijaga route). */
export async function createInvitation(
  db: PrismaClient,
  params: {
    actorUserId: string;
    workspaceId: string;
    actorMembershipId: string;
    contactTarget: string;
    roleKey: string;
    userAgent?: string | null;
  }
): Promise<{ invitation: InvitationSummary; /** Token mentah — ditampilkan SEKALI. */ token: string }> {
  // Rate limit per aktor (anti-abuse — REQ-054).
  const limit = consumeRateLimit(
    `invite:actor:${params.actorUserId}`,
    securityConfig.rateLimit.invitationCreatePerActorMax,
    securityConfig.rateLimit.invitationCreateWindowSeconds
  );
  if (!limit.allowed) {
    throw new ApiError(429, ReasonCode.DENY_RATE_LIMITED, "Terlalu banyak undangan", "Coba lagi nanti.");
  }

  const email = normalizeEmail(params.contactTarget);
  if (!isValidEmail(email)) {
    throw new ApiError(422, ApiErrorCode.VALIDATION_FAILED, "Email tujuan tidak valid");
  }
  if (params.roleKey !== RoleKey.MEMBER && params.roleKey !== RoleKey.OWNER) {
    throw new ApiError(422, ApiErrorCode.VALIDATION_FAILED, "Role tidak dikenal");
  }
  // Menawarkan role selain member = kapabilitas role assignment (PROPOSED rule).
  if (params.roleKey === RoleKey.OWNER) {
    throw new ApiError(
      422,
      ApiErrorCode.VALIDATION_FAILED,
      "Menawarkan role owner melalui undangan tidak didukung Phase 4", "Transfer kepemilikan workspace = keputusan owner (OD-122); gunakan role member.");
  }

  const role = await db.role.findUnique({
    where: { workspaceId_key: { workspaceId: params.workspaceId, key: params.roleKey } },
  });
  if (!role) {
    throw new ApiError(422, ApiErrorCode.VALIDATION_FAILED, "Role tidak tersedia di workspace ini");
  }

  const token = randomBytes(securityConfig.invitation.tokenBytes).toString("base64url");
  const expiresAt = new Date(
    Date.now() + securityConfig.invitation.expiryDays * 24 * 60 * 60 * 1000
  );

  const invitation = await db.invitation.create({
    data: {
      workspaceId: params.workspaceId,
      roleId: role.id,
      contactTarget: email,
      tokenHash: sha256Hex(token),
      status: InvitationStatus.PENDING,
      expiresAt,
      createdById: params.actorMembershipId,
    },
  });
  const workspace = await db.workspace.findUniqueOrThrow({
    where: { id: params.workspaceId },
  });

  await logAudit(db, {
    category: AuditCategory.INVITATION,
    action: "invitation.created",
    outcome: AuditOutcome.SUCCESS,
    actorUserId: params.actorUserId,
    tenantWorkspaceId: params.workspaceId,
    targetType: "Invitation",
    targetId: invitation.id,
    metadata: { roleKey: params.roleKey, expiryDays: securityConfig.invitation.expiryDays },
    userAgent: params.userAgent ?? null,
  });

  return {
    invitation: {
      id: invitation.id,
      workspaceId: params.workspaceId,
      workspaceName: workspace.name,
      contactTarget: email,
      roleKey: params.roleKey,
      status: invitation.status,
      expiresAt,
      createdAt: invitation.createdAt,
    },
    token,
  };
}

/** Daftar undangan workspace (permission: workspace.member.invite — dijaga route). */
export async function listInvitations(
  db: PrismaClient,
  workspaceId: string
): Promise<InvitationSummary[]> {
  const invitations = await db.invitation.findMany({
    where: { workspaceId, status: InvitationStatus.PENDING },
    include: { workspace: true, role: true },
    orderBy: { createdAt: "desc" },
  });
  return invitations.map((i) => ({
    id: i.id,
    workspaceId: i.workspaceId,
    workspaceName: i.workspace.name,
    contactTarget: i.contactTarget,
    roleKey: i.role.key,
    status: i.expiresAt.getTime() <= Date.now() ? InvitationStatus.EXPIRED : i.status,
    expiresAt: i.expiresAt,
    createdAt: i.createdAt,
  }));
}

/** Cabut undangan (permission: workspace.member.invite — dijala route). */
export async function revokeInvitation(
  db: PrismaClient,
  params: { actorUserId: string; workspaceId: string; invitationId: string; userAgent?: string | null }
): Promise<void> {
  const invitation = await db.invitation.findFirst({
    where: { id: params.invitationId, workspaceId: params.workspaceId, status: InvitationStatus.PENDING },
  });
  if (!invitation) {
    throw new ApiError(404, "NOT_FOUND", "Undangan tidak ditemukan");
  }
  await db.invitation.update({
    where: { id: invitation.id },
    data: { status: InvitationStatus.REVOKED, revokedAt: new Date() },
  });
  await logAudit(db, {
    category: AuditCategory.INVITATION,
    action: "invitation.revoked",
    outcome: AuditOutcome.SUCCESS,
    actorUserId: params.actorUserId,
    tenantWorkspaceId: params.workspaceId,
    targetType: "Invitation",
    targetId: invitation.id,
    userAgent: params.userAgent ?? null,
  });
}

/** Undangan PENDING yang ditujukan kepada user (via email terverifikasi). */
export async function listMyPendingInvitations(
  db: PrismaClient,
  params: { userId: string; email: string | null }
): Promise<InvitationSummary[]> {
  if (!params.email) return [];
  const email = normalizeEmail(params.email);
  const invitations = await db.invitation.findMany({
    where: { contactTarget: email, status: InvitationStatus.PENDING },
    include: { workspace: true, role: true },
    orderBy: { createdAt: "desc" },
  });
  return invitations
    .filter((i) => i.expiresAt.getTime() > Date.now())
    .map((i) => ({
      id: i.id,
      workspaceId: i.workspaceId,
      workspaceName: i.workspace.name,
      contactTarget: i.contactTarget,
      roleKey: i.role.key,
      status: i.status,
      expiresAt: i.expiresAt,
      createdAt: i.createdAt,
    }));
}

/** Inti penerimaan undangan: validasi status/expiry/identitas + konsumsi atomik. */
async function consumeInvitationForUser(
  db: PrismaClient,
  params: {
    actorUserId: string;
    actorEmail: string | null;
    userAgent?: string | null;
    /** Resolusi undangan (sudah di-lookup oleh pemanggil). */
    invitation: NonNullable<Awaited<ReturnType<PrismaClient["invitation"]["findUnique"]>>>;
    /** Nama aksi audit untuk jalur pemanggil (token/by-id). */
    viaLabel: string;
  }
): Promise<{ workspaceId: string; workspaceName: string }> {
  const invitation = params.invitation;
  if (invitation.status !== InvitationStatus.PENDING) {
    await logAudit(db, {
      category: AuditCategory.INVITATION,
      action: "invitation.accept.denied",
      outcome: AuditOutcome.DENIED,
      actorUserId: params.actorUserId,
      reasonCode: ReasonCode.DENY_INVALID_INVITE,
      userAgent: params.userAgent ?? null,
    });
    throw new ApiError(404, ReasonCode.DENY_INVALID_INVITE, "Undangan tidak valid");
  }

  // Kedaluwarsa (lazy)?
  if (invitation.expiresAt.getTime() <= Date.now()) {
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.EXPIRED },
    });
    await logAudit(db, {
      category: AuditCategory.INVITATION,
      action: "invitation.accept.expired",
      outcome: AuditOutcome.DENIED,
      actorUserId: params.actorUserId,
      tenantWorkspaceId: invitation.workspaceId,
      reasonCode: ReasonCode.DENY_INVALID_INVITE,
      targetType: "Invitation",
      targetId: invitation.id,
      userAgent: params.userAgent ?? null,
    });
    throw new ApiError(410, ReasonCode.DENY_INVALID_INVITE, "Undangan kedaluwarsa");
  }

  // Identitas penerima harus cocok dengan target undangan (anti wrong-recipient).
  if (!params.actorEmail || !constantTimeEqualsHex(normalizeEmail(params.actorEmail), invitation.contactTarget)) {
    await logAudit(db, {
      category: AuditCategory.INVITATION,
      action: `invitation.accept.wrong_recipient.${params.viaLabel}`,
      outcome: AuditOutcome.DENIED,
      actorUserId: params.actorUserId,
      tenantWorkspaceId: invitation.workspaceId,
      reasonCode: ReasonCode.DENY_NOT_MEMBER,
      targetType: "Invitation",
      targetId: invitation.id,
      userAgent: params.userAgent ?? null,
    });
    throw new ApiError(403, ReasonCode.DENY_NOT_MEMBER, "Undangan ini ditujukan untuk akun lain");
  }

  const result = await db.$transaction(async (tx) => {
    // Konsumsi SEKALI atomik: hanya sukses bila masih PENDING (anti-replay).
    const consumed = await tx.invitation.updateMany({
      where: { id: invitation.id, status: InvitationStatus.PENDING },
      data: { status: InvitationStatus.ACCEPTED, usedAt: new Date(), acceptedAt: new Date() },
    });
    if (consumed.count === 0) {
      throw new ApiError(409, ReasonCode.DENY_REPLAY, "Undangan sudah digunakan");
    }

    // Sudah member hidup? → throw = ROLLBACK transaksi (konsumsi undangan di
    // atas ikut dibatalkan — undangan tetap PENDING untuk dicabut admin).
    const existing = await tx.membership.findFirst({
      where: {
        workspaceId: invitation.workspaceId,
        userId: params.actorUserId,
        status: { in: ["INVITED", "ACTIVE", "SUSPENDED"] },
      },
    });
    if (existing) {
      throw new ApiError(409, ApiErrorCode.ALREADY_MEMBER, "Anda sudah menjadi anggota workspace ini");
    }

    const membership = await tx.membership.create({
      data: { workspaceId: invitation.workspaceId, userId: params.actorUserId, status: "ACTIVE" },
    });
    await tx.membershipRoleAssignment.create({
      data: { membershipId: membership.id, roleId: invitation.roleId, grantedBy: params.actorUserId },
    });
    const workspace = await tx.workspace.findUniqueOrThrow({
      where: { id: invitation.workspaceId },
    });
    return { membership, workspace };
  });

  await logAudit(db, {
    category: AuditCategory.INVITATION,
    action: "invitation.accepted",
    outcome: AuditOutcome.SUCCESS,
    actorUserId: params.actorUserId,
    tenantWorkspaceId: invitation.workspaceId,
    targetType: "Invitation",
    targetId: invitation.id,
    userAgent: params.userAgent ?? null,
  });
  await logAudit(db, {
    category: AuditCategory.MEMBERSHIP,
    action: "membership.created.via_invitation",
    outcome: AuditOutcome.SUCCESS,
    actorUserId: params.actorUserId,
    tenantWorkspaceId: invitation.workspaceId,
    targetType: "Membership",
    targetId: result.membership.id,
    userAgent: params.userAgent ?? null,
  });

  return { workspaceId: result.workspace.id, workspaceName: result.workspace.name };
}

/**
 * Menerima undangan VIA TOKEN (alur tautan): butuh identitas terautentikasi
 * yang cocok dengan target; konsumsi satu-kali atomik.
 */
export async function acceptInvitation(
  db: PrismaClient,
  params: { actorUserId: string; actorEmail: string | null; token: string; userAgent?: string | null }
): Promise<{ workspaceId: string; workspaceName: string }> {
  const tokenHash = sha256Hex(params.token.trim());
  const invitation = await db.invitation.findUnique({ where: { tokenHash } });
  if (!invitation) {
    await logAudit(db, {
      category: AuditCategory.INVITATION,
      action: "invitation.accept.denied",
      outcome: AuditOutcome.DENIED,
      actorUserId: params.actorUserId,
      reasonCode: ReasonCode.DENY_INVALID_INVITE,
      userAgent: params.userAgent ?? null,
    });
    throw new ApiError(404, ReasonCode.DENY_INVALID_INVITE, "Undangan tidak valid");
  }
  return consumeInvitationForUser(db, { ...params, invitation, viaLabel: "token" });
}

/**
 * Menerima undangan VIA ID dari daftar "undangan saya" (identitas sudah
 * dicocokkan server-side dengan target — pemeriksaan identitas tetap
 * diulang di inti konsumsi). Token mentah tidak disimpan (hash-only) — jalur
 * ini memungkinkan penerimaan langsung dari daftar tanpa tautan.
 */
export async function acceptInvitationById(
  db: PrismaClient,
  params: { actorUserId: string; actorEmail: string | null; invitationId: string; userAgent?: string | null }
): Promise<{ workspaceId: string; workspaceName: string }> {
  const invitation = await db.invitation.findUnique({ where: { id: params.invitationId } });
  if (!invitation) {
    throw new ApiError(404, ReasonCode.DENY_INVALID_INVITE, "Undangan tidak valid");
  }
  return consumeInvitationForUser(db, { ...params, invitation, viaLabel: "id" });
}
