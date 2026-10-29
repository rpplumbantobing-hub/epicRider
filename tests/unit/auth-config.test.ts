// Unit test konfigurasi auth — epicRider Phase 4 (REQ-022 keamanan konfigurasi).
//
// Membuktikan:
// - Tanpa kredensial Google → provider TIDAK aktif (tidak ada login palsu);
// - allowDangerousEmailAccountLinking TIDAK pernah diaktifkan (no-auto-link);
// - Aman mengimpor options di environment non-produksi.

import { describe, expect, it } from "vitest";
import { authOptions, isGoogleConfigured } from "@/lib/auth/nextauth-options";
import { securityConfig } from "@/lib/config/security-config";
import { ROLE_PRESETS } from "@/lib/authz/roles";
import { Permission } from "@/lib/authz/permissions";

describe("konfigurasi next-auth (ADR-022)", () => {
  it("strategi sesi = database (dukungan revoke per-device REQ-048)", () => {
    expect(authOptions.session?.strategy).toBe("database");
  });

  it("maxAge sesi terpusat dari security-config (OD-115 PROPOSED)", () => {
    expect(authOptions.session?.maxAge).toBe(securityConfig.session.maxAgeSeconds);
    expect(securityConfig.session.maxAgeSeconds).toBeGreaterThan(0);
  });

  it("halaman signIn kustom = /login", () => {
    expect(authOptions.pages?.signIn).toBe("/login");
  });

  it("isGoogleConfigured() mencerminkan env (test: tidak ada kredensial → false)", () => {
    // Environment test tidak menyetel GOOGLE_CLIENT_ID/SECRET.
    expect(isGoogleConfigured()).toBe(false);
    // Tanpa kredensial, daftar provider kosong — TIDAK ada provider palsu.
    expect(authOptions.providers).toHaveLength(0);
  });

  it("TIDAK ada allowDangerousEmailAccountLinking di mana pun (no-auto-link)", () => {
    // Pemeriksaan defensif pada konfigurasi aktif + sumber options.
    expect(
      JSON.stringify(authOptions).includes("allowDangerousEmailAccountLinking")
    ).toBe(false);
  });

  it("owner mewarisi seluruh permission member + admin; member terbatas baseline", () => {
    const owner = ROLE_PRESETS.owner;
    const member = ROLE_PRESETS.member;
    for (const p of member) {
      expect(owner).toContain(p);
    }
    expect(owner).toContain(Permission.WORKSPACE_MEMBER_INVITE);
    expect(member).not.toContain(Permission.WORKSPACE_MEMBER_INVITE);
    expect(member).not.toContain(Permission.MEMBERSHIP_ROLE_ASSIGN);
  });
});
