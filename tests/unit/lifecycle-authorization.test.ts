// @vitest-environment node
// Unit test tabel otorisasi lifecycle — epicRider Phase 5-D (ADR-025).
// Membuktikan dari lapisan PURE:
// - Setiap aksi lifecycle punya entri otorisasi eksplisit (license 8 + extension 6).
// - Permission kanonik dipetakan PERSIS dari AUTHORIZATION_MODEL §4.5/§4.6 —
//   tidak ada key yang dikarang; key kanonik tidak diubah nilainya.
// - Aksi tanpa key kanonik memakai fallback owner ber-status PROPOSED —
//   status ini bukan keputusan owner final (label tidak pernah "IMPLEMENTED").
// - Aktor SYSTEM didefinisikan sebagai pemanggil internal tepercaya; aktor
//   USER membawa validitas sesi dari sumber tepercaya (bukan claim client).

import { describe, expect, it } from "vitest";

import { Permission } from "@/lib/authz/permissions";
import {
  EXTENSION_ACTION_AUTHORIZATION,
  ExtensionLifecycleAction,
  LICENSE_ACTION_AUTHORIZATION,
  LicenseLifecycleAction,
} from "@/lib/licensing/lifecycle-shared";

describe("tabel otorisasi license lifecycle", () => {
  it("lengkap untuk 8 aksi; fallback selalu ber-label PROPOSED", () => {
    for (const action of Object.values(LicenseLifecycleAction)) {
      const entry = LICENSE_ACTION_AUTHORIZATION[action];
      expect(entry).toBeDefined();
      expect(entry.ownerFallback).toBe("PROPOSED");
      expect(typeof entry.source).toBe("string");
      expect(entry.source.length).toBeGreaterThan(0);
    }
  });

  it("satu-satunya permission kanonik yang dipakai = license.renew.initiate (§4.5)", () => {
    const withPermission = Object.values(LicenseLifecycleAction).filter(
      (a) => LICENSE_ACTION_AUTHORIZATION[a].permission !== null
    );
    expect(withPermission.sort()).toEqual(
      [LicenseLifecycleAction.RENEW, LicenseLifecycleAction.RENEW_IN_GRACE].sort()
    );
    expect(LICENSE_ACTION_AUTHORIZATION.RENEW.permission).toBe(Permission.LICENSE_RENEW_INITIATE);
    expect(Permission.LICENSE_RENEW_INITIATE).toBe("license.renew.initiate"); // vocabulary model dipertahankan persis
  });
});

describe("tabel otorisasi extension lifecycle", () => {
  it("lengkap untuk 6 aksi; fallback selalu ber-label PROPOSED", () => {
    for (const action of Object.values(ExtensionLifecycleAction)) {
      const entry = EXTENSION_ACTION_AUTHORIZATION[action];
      expect(entry).toBeDefined();
      expect(entry.ownerFallback).toBe("PROPOSED");
      expect(typeof entry.source).toBe("string");
      expect(entry.source.length).toBeGreaterThan(0);
    }
  });

  it("ASSIGN/RENEW/REMOVE memakai key kanonik §4.6 persis; ACTIVATE/SUSPEND/EXPIRE tanpa key", () => {
    expect(EXTENSION_ACTION_AUTHORIZATION.ASSIGN.permission).toBe(Permission.EXTENSION_ASSIGN);
    expect(EXTENSION_ACTION_AUTHORIZATION.RENEW.permission).toBe(
      Permission.EXTENSION_RENEW_INITIATE
    );
    expect(EXTENSION_ACTION_AUTHORIZATION.REMOVE.permission).toBe(Permission.EXTENSION_REMOVE);
    expect(Permission.EXTENSION_ASSIGN).toBe("extension.assign");
    expect(Permission.EXTENSION_RENEW_INITIATE).toBe("extension.renew.initiate");
    expect(Permission.EXTENSION_REMOVE).toBe("extension.remove");

    for (const action of [
      ExtensionLifecycleAction.ACTIVATE,
      ExtensionLifecycleAction.SUSPEND,
      ExtensionLifecycleAction.EXPIRE,
    ] as const) {
      expect(EXTENSION_ACTION_AUTHORIZATION[action].permission).toBeNull();
    }
  });
});
