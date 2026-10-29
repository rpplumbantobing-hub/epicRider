// POST /api/v1/auth/otp/verify — verifikasi kode OTP (REQ-021).
//
// Memverifikasi terhadap challenge PENDING terakhir untuk nomor tersebut.
// Hasil verifikasi = bukti kontrol nomor (domain). Penerbitan sesi via kanal
// WhatsApp = integration point provider (OD-03) — didokumentasikan di ADR-022;
// test membuktikan rantai domain penuh (issueSession).

import { NextRequest } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth/otp/otp-service";
import { toProblemResponse, problemResponse } from "@/lib/api/problems";
import { db } from "@/lib/db";

const bodySchema = z.object({
  target: z.string().min(7).max(20),
  code: z.string().min(4).max(10),
});

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());
    const result = await verifyOtp(db, {
      target: body.target,
      code: body.code,
      userAgent: req.headers.get("user-agent"),
    });
    if (!result.ok) {
      const status = result.reasonCode === "DENY_RATE_LIMITED" ? 429 : 401;
      return problemResponse(status, result.reasonCode, "Verifikasi gagal", {
        detail: result.detail,
        instance: "/api/v1/auth/otp/verify",
      });
    }
    // TIDAK ada sesi yang diterbitkan di sini (menunggu provider nyata — OD-03);
    // respons hanya menyatakan bukti kontrol nomor terverifikasi.
    return Response.json({ verified: true, target: result.target });
  } catch (error) {
    return toProblemResponse(error, "/api/v1/auth/otp/verify");
  }
}
