// POST /api/v1/auth/otp/request — minta OTP WhatsApp (REQ-021; ADR-009).
//
// Status produksi yang JUJUR: vendor belum dipilih (OD-03 OPEN) → 503
// PROVIDER_NOT_CONFIGURED (gagal aman; TIDAK ADA sukses palsu). Alur domain
// penuh dibuktikan di test dengan test double.

import { NextRequest } from "next/server";
import { z } from "zod";
import { requestOtp } from "@/lib/auth/otp/otp-service";
import { resolveOtpDeliveryProvider } from "@/lib/auth/otp/provider";
import { toProblemResponse, problemResponse, ApiErrorCode } from "@/lib/api/problems";
import { ReasonCode } from "@/lib/authz/reason-codes";
import { db } from "@/lib/db";

const bodySchema = z.object({
  target: z.string().min(7).max(20),
});

function clientIp(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());

    // Resolve provider TERLEBIH DAHULU: produksi tanpa vendor → gagal aman
    // sebelum challenge apa pun dibuat.
    let provider;
    try {
      provider = resolveOtpDeliveryProvider();
    } catch {
      return problemResponse(
        503,
        ApiErrorCode.PROVIDER_NOT_CONFIGURED,
        "Kanal WhatsApp belum dikonfigurasi",
        {
          detail:
            "Vendor verifikasi WhatsApp belum ditetapkan (OD-03). Permintaan kode tidak dapat diproses.",
          instance: "/api/v1/auth/otp/request",
        }
      );
    }

    const result = await requestOtp(
      db,
      {
        target: body.target,
        ip: clientIp(req),
        userAgent: req.headers.get("user-agent"),
      },
      provider
    );

    if (!result.ok) {
      const status = result.reasonCode === ReasonCode.DENY_RATE_LIMITED ? 429 : 422;
      return problemResponse(status, result.reasonCode, "Permintaan ditolak", {
        detail: "detail" in result ? result.detail : "Coba lagi nanti.",
        instance: "/api/v1/auth/otp/request",
        retryAfterSeconds:
          result.reasonCode === ReasonCode.DENY_RATE_LIMITED
            ? result.retryAfterSeconds
            : undefined,
      });
    }

    // Respons TIDAK pernah memuat kode OTP.
    return Response.json({ requestId: result.requestId }, { status: 202 });
  } catch (error) {
    return toProblemResponse(error, "/api/v1/auth/otp/request");
  }
}
