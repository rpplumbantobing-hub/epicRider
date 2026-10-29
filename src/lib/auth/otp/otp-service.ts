// OTP service — bukti kontrol nomor WhatsApp (REQ-021; ADR-009).
//
// Domain behavior yang dimiliki platform (vendor-netral):
//   1. requestOtp: rate limit per target & per IP → buat VerificationRequest
//      PENDING (hanya HASH kode yang disimpan; kode dikirim provider).
//   2. verifyOtp: cek expiry → counter percobaan → lockout → bandingkan hash
//      konstan-waktu → konsumsi SEKALI secara atomik (anti-replay).
//   3. Semua percobaan teraudit (REQ-054) TANPA kode/token di payload audit.
//
// Status aman produksi: tanpa provider terkonfigurasi (OD-03), requestOtp
// melempar PROVIDER_NOT_CONFIGURED — tidak pernah sukses palsu.

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { securityConfig } from "@/lib/config/security-config";
import { logAudit, AuditCategory, AuditOutcome } from "@/lib/audit/audit-service";
import { consumeRateLimit } from "@/lib/auth/rate-limiter";
import { ReasonCode } from "@/lib/authz/reason-codes";
import type { OtpDeliveryProvider } from "./provider";

const OTP_STATUS = {
  PENDING: "PENDING",
  CONSUMED: "CONSUMED",
  EXPIRED: "EXPIRED",
  BLOCKED: "BLOCKED",
} as const;

/** Normalisasi nomor ke E.164 minimal (digit, +, panjang wajar). */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  if (!/^\+?[1-9]\d{6,14}$/.test(trimmed)) return null;
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
}

/** Kode OTP numerik `codeLength` digit (rentang aman, leading zero aman). */
export function generateOtpCode(codeLength: number): string {
  const max = 10 ** codeLength;
  return String(randomInt(0, max)).padStart(codeLength, "0");
}

/** Hash SHA-256 (hex) — satu-satunya representasi kode yang disimpan. */
export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code, "utf8").digest("hex");
}

function constantTimeEqualsHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export interface OtpRequestResult {
  ok: true;
  /** Id VerificationRequest (untuk referensi; TIDAK mengandung kode). */
  requestId: string;
}

export type OtpFailure =
  | { ok: false; reasonCode: typeof ReasonCode.DENY_RATE_LIMITED; retryAfterSeconds: number }
  | { ok: false; reasonCode: typeof ReasonCode.DENY_INVALID_INVITE; detail: string };

/**
 * Meminta OTP untuk sebuah nomor. Rate limit ganda (target + IP) sebelum
 * pembuatan challenge; lockout aktif ditolak.
 */
export async function requestOtp(
  db: PrismaClient,
  params: { target: string; ip?: string | null; userAgent?: string | null },
  provider: OtpDeliveryProvider
): Promise<OtpRequestResult | OtpFailure> {
  const target = normalizePhone(params.target);
  if (!target) {
    return { ok: false, reasonCode: ReasonCode.DENY_INVALID_INVITE, detail: "Nomor tidak valid." };
  }

  const cfg = securityConfig.otp;

  // Rate limit per target (anti-flooding — TC-05).
  const targetLimit = consumeRateLimit(
    `otp:target:${target}`,
    cfg.resendPerTargetMax,
    cfg.resendPerTargetWindowSeconds
  );
  if (!targetLimit.allowed) {
    await logAudit(db, {
      category: AuditCategory.ABUSE,
      action: "otp.request.rate_limited",
      outcome: AuditOutcome.DENIED,
      reasonCode: ReasonCode.DENY_RATE_LIMITED,
      targetType: "VerificationRequest",
      metadata: { channel: "WHATSAPP" }, // tanpa nomor penuh? nomor = identifier
      userAgent: params.userAgent ?? null,
    });
    return { ok: false, reasonCode: ReasonCode.DENY_RATE_LIMITED, retryAfterSeconds: targetLimit.retryAfterSeconds };
  }

  // Rate limit per IP.
  if (params.ip) {
    const ipLimit = consumeRateLimit(
      `otp:ip:${params.ip}`,
      cfg.requestPerIpMax,
      cfg.requestPerIpWindowSeconds
    );
    if (!ipLimit.allowed) {
      await logAudit(db, {
        category: AuditCategory.ABUSE,
        action: "otp.request.rate_limited_ip",
        outcome: AuditOutcome.DENIED,
        reasonCode: ReasonCode.DENY_RATE_LIMITED,
        userAgent: params.userAgent ?? null,
      });
      return { ok: false, reasonCode: ReasonCode.DENY_RATE_LIMITED, retryAfterSeconds: ipLimit.retryAfterSeconds };
    }
  }

  // Lockout aktif untuk target?
  const blocked = await db.verificationRequest.findFirst({
    where: { target, status: OTP_STATUS.BLOCKED, blockedUntil: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (blocked) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((blocked.blockedUntil!.getTime() - Date.now()) / 1000)
    );
    return { ok: false, reasonCode: ReasonCode.DENY_RATE_LIMITED, retryAfterSeconds };
  }

  // Buat kode + challenge (hash-only storage).
  const code = generateOtpCode(cfg.codeLength);
  const expiresAt = new Date(Date.now() + cfg.expirySeconds * 1000);
  const request = await db.verificationRequest.create({
    data: {
      channel: "WHATSAPP",
      target,
      tokenHash: hashOtpCode(code),
      status: OTP_STATUS.PENDING,
      maxAttempts: cfg.maxAttempts,
      expiresAt,
    },
  });

  // Kirim via provider (inject — produksi throw PROVIDER_NOT_CONFIGURED
  // sebelum titik ini; resolve di route handler).
  await provider.send(target, code);

  await logAudit(db, {
    category: AuditCategory.AUTH,
    action: "otp.request.success",
    outcome: AuditOutcome.SUCCESS,
    targetType: "VerificationRequest",
    targetId: request.id,
    metadata: { channel: "WHATSAPP", provider: provider.name, expirySeconds: cfg.expirySeconds },
    userAgent: params.userAgent ?? null,
  });

  return { ok: true, requestId: request.id };
}

export type OtpVerifyResult =
  | { ok: true; target: string }
  | { ok: false; reasonCode: string; detail: string };

/**
 * Verifikasi kode terhadap challenge PENDING TERAKHIR untuk target.
 * - Kode benar → konsumsi atomik sekali pakai (replay berikutnya ditolak).
 * - Kode salah → percobaan dihitung; melebihi maxAttempts → BLOCKED + lockout.
 * - Challenge kedaluwarsa → status EXPIRED, ditolak.
 */
export async function verifyOtp(
  db: PrismaClient,
  params: { target: string; code: string; userAgent?: string | null }
): Promise<OtpVerifyResult> {
  const target = normalizePhone(params.target);
  if (!target) {
    return { ok: false, reasonCode: ReasonCode.DENY_INVALID_INVITE, detail: "Nomor tidak valid." };
  }

  const request = await db.verificationRequest.findFirst({
    where: { target, status: OTP_STATUS.PENDING },
    orderBy: { createdAt: "desc" },
  });
  if (!request) {
    await logAudit(db, {
      category: AuditCategory.AUTH,
      action: "otp.verify.failed",
      outcome: AuditOutcome.DENIED,
      reasonCode: ReasonCode.DENY_INVALID_INVITE,
      userAgent: params.userAgent ?? null,
    });
    return { ok: false, reasonCode: ReasonCode.DENY_INVALID_INVITE, detail: "Tidak ada permintaan aktif." };
  }

  // Kedaluwarsa? (lazy expiry)
  if (request.expiresAt.getTime() <= Date.now()) {
    await db.verificationRequest.update({
      where: { id: request.id },
      data: { status: OTP_STATUS.EXPIRED },
    });
    await logAudit(db, {
      category: AuditCategory.AUTH,
      action: "otp.verify.expired",
      outcome: AuditOutcome.DENIED,
      reasonCode: ReasonCode.DENY_INVALID_INVITE,
      targetType: "VerificationRequest",
      targetId: request.id,
      userAgent: params.userAgent ?? null,
    });
    return { ok: false, reasonCode: ReasonCode.DENY_INVALID_INVITE, detail: "Kode kedaluwarsa." };
  }

  // Percobaan melebihi batas?
  if (request.attemptCount >= request.maxAttempts) {
    await db.verificationRequest.update({
      where: { id: request.id },
      data: { status: OTP_STATUS.BLOCKED, blockedUntil: new Date(Date.now() + securityConfig.otp.lockoutSeconds * 1000) },
    });
    await logAudit(db, {
      category: AuditCategory.ABUSE,
      action: "otp.verify.blocked",
      outcome: AuditOutcome.DENIED,
      reasonCode: ReasonCode.DENY_RATE_LIMITED,
      targetType: "VerificationRequest",
      targetId: request.id,
      userAgent: params.userAgent ?? null,
    });
    return { ok: false, reasonCode: ReasonCode.DENY_RATE_LIMITED, detail: "Terlalu banyak percobaan." };
  }

  const matches = constantTimeEqualsHex(hashOtpCode(params.code.trim()), request.tokenHash);

  if (!matches) {
    const attemptCount = request.attemptCount + 1;
    const willBlock = attemptCount >= request.maxAttempts;
    await db.verificationRequest.update({
      where: { id: request.id },
      data: {
        attemptCount,
        lastAttemptAt: new Date(),
        ...(willBlock
          ? { status: OTP_STATUS.BLOCKED, blockedUntil: new Date(Date.now() + securityConfig.otp.lockoutSeconds * 1000) }
          : {}),
      },
    });
    await logAudit(db, {
      category: AuditCategory.AUTH,
      action: "otp.verify.failed",
      outcome: AuditOutcome.DENIED,
      reasonCode: willBlock ? ReasonCode.DENY_RATE_LIMITED : ReasonCode.DENY_INVALID_INVITE,
      targetType: "VerificationRequest",
      targetId: request.id,
      metadata: { attemptCount }, // hanya counter — TANPA kode
      userAgent: params.userAgent ?? null,
    });
    return {
      ok: false,
      reasonCode: willBlock ? ReasonCode.DENY_RATE_LIMITED : ReasonCode.DENY_INVALID_INVITE,
      detail: willBlock ? "Terlalu banyak percobaan." : "Kode salah.",
    };
  }

  // Konsumsi SEKALI secara atomik: hanya sukses bila masih PENDING (race-safe).
  const consumed = await db.verificationRequest.updateMany({
    where: { id: request.id, status: OTP_STATUS.PENDING },
    data: { status: OTP_STATUS.CONSUMED, usedAt: new Date() },
  });
  if (consumed.count === 0) {
    await logAudit(db, {
      category: AuditCategory.ABUSE,
      action: "otp.verify.replay",
      outcome: AuditOutcome.DENIED,
      reasonCode: ReasonCode.DENY_REPLAY,
      targetType: "VerificationRequest",
      targetId: request.id,
      userAgent: params.userAgent ?? null,
    });
    return { ok: false, reasonCode: ReasonCode.DENY_REPLAY, detail: "Kode sudah dipakai." };
  }

  await logAudit(db, {
    category: AuditCategory.AUTH,
    action: "otp.verify.success",
    outcome: AuditOutcome.SUCCESS,
    targetType: "VerificationRequest",
    targetId: request.id,
    userAgent: params.userAgent ?? null,
  });
  return { ok: true, target };
}
