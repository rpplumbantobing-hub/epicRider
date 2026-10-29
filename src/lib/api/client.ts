// Helper fetch client-side — epicRider Phase 4.
// Menangani problem-details (RFC 9457-style) dari API: 401 → arahkan ke login;
// error lain → lempar dengan pesan yang aman ditampilkan (tanpa detail internal).

"use client";

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new ApiClientError(0, "NETWORK_ERROR", "Koneksi bermasalah.");
  }

  if (response.status === 401) {
    // Sesi tidak valid → ke halaman masuk (dengan tujuan kembali).
    if (typeof window !== "undefined") {
      const next = encodeURIComponent(window.location.pathname);
      window.location.assign(`/login?next=${next}&expired=1`);
    }
    throw new ApiClientError(401, "DENY_NO_SESSION", "Sesi tidak valid.");
  }

  if (!response.ok) {
    let code = "INTERNAL_ERROR";
    let detail = "Terjadi kesalahan.";
    try {
      const problem = (await response.json()) as {
        code?: string;
        detail?: string;
      };
      code = problem.code ?? code;
      detail = problem.detail ?? detail;
    } catch {
      // respons non-JSON — pakai default
    }
    throw new ApiClientError(response.status, code, detail);
  }

  return (await response.json()) as T;
}
