// Error model API — epicRider Phase 4 (API_ARCHITECTURE §10, RFC 9457-style).
//
// Aturan keras (§10): TIDAK PERNAH mengekspos stack trace, path internal,
// fragmen SQL/ORM, nama dependency, nilai konfigurasi, atau secret di respons
// error. `code` = kontrak stabil (reason code AUTHORIZATION_MODEL §3 /
// katalog validasi); `traceId` = korelasi ke log server (REQ-095) tanpa data
// sensitif.

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { randomUUID } from "node:crypto";

/** Kode error selain reason-code otorisasi (katalog validasi Phase 4). */
export const ApiErrorCode = {
  VALIDATION_FAILED: "VALIDATION_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  PROVIDER_NOT_CONFIGURED: "PROVIDER_NOT_CONFIGURED",
  ALREADY_MEMBER: "ALREADY_MEMBER",
  CONFLICT: "CONFLICT",
} as const;

const PROBLEM_TYPE_BASE = "https://api.epicrider.example/problems";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly title: string,
    public readonly detail?: string
  ) {
    super(`${status} ${code}: ${title}`);
    this.name = "ApiError";
  }
}

export function newTraceId(): string {
  return randomUUID();
}

export function problemResponse(
  status: number,
  code: string,
  title: string,
  options: {
    detail?: string;
    instance?: string;
    traceId?: string;
    retryAfterSeconds?: number;
    errors?: Array<{ field: string; code: string; detail?: string }>;
  } = {}
): NextResponse {
  const traceId = options.traceId ?? newTraceId();
  const body: Record<string, unknown> = {
    type: `${PROBLEM_TYPE_BASE}/${code.toLowerCase()}`,
    title,
    status,
    detail: options.detail ?? title,
    instance: options.instance,
    code,
    traceId,
  };
  if (options.errors && options.errors.length > 0) {
    body.errors = options.errors;
  }
  const response = NextResponse.json(body, { status });
  if (options.retryAfterSeconds !== undefined) {
    response.headers.set("Retry-After", String(options.retryAfterSeconds));
  }
  return response;
}

/** Mengonversi error sembarang menjadi problem response yang aman. */
export function toProblemResponse(
  error: unknown,
  instance?: string
): NextResponse {
  if (error instanceof ApiError) {
    return problemResponse(error.status, error.code, error.title, {
      detail: error.detail,
      instance,
    });
  }
  if (error instanceof ZodError) {
    return problemResponse(422, ApiErrorCode.VALIDATION_FAILED, "Permintaan tidak valid", {
      detail: "Satu atau lebih field tidak lolos validasi.",
      instance,
      errors: error.issues.map((issue) => ({
        field: issue.path.join(".") || "(root)",
        code: issue.code,
        detail: issue.message,
      })),
    });
  }
  // Error tak terduga: JANGAN bocorkan pesan internal (TC-22 secrets exposure).
  const traceId = newTraceId();
  console.error(`[api] unexpected error traceId=${traceId} path=${instance ?? "?"}`);
  return problemResponse(500, ApiErrorCode.INTERNAL_ERROR, "Terjadi kesalahan server", {
    detail: "Coba lagi nanti. Gunakan traceId untuk korelasi bila melaporkan masalah.",
    instance,
    traceId,
  });
}
