// @vitest-environment node
// Unit test mesin transisi extension — epicRider Phase 5-D (ADR-025).
// Membuktikan dari lapisan PURE:
// - Matriks aksi instance (LICENSE_MATRIX §5) tepat: ASSIGN/ACTIVATE/SUSPEND/
//   EXPIRE/RENEW/REMOVE; semua pasangan lain fail-closed.
// - REMOVED terminal; RENEWED tidak memberi entitlement sampai ACTIVATE;
//   SUSPENDED/EXPIRED/REMOVED/PURCHASED/ASSIGNED tidak memberi entitlement.
// - Himpunan LIVE (PURCHASED/ASSIGNED/ACTIVE/SUSPENDED/RENEWED) menegakkan
//   aturan satu live instance per (workspace, type).
// - Action vs status dibedakan: status = state tersimpan; action = operasi
//   yang memetakan status → status (matriks eksplisit).

import { describe, expect, it } from "vitest";

import {
  EXTENSION_ACTION_AUTHORIZATION,
  ExtensionLifecycleAction,
} from "@/lib/licensing/lifecycle-shared";
import {
  EXTENSION_LIVE_STATUSES,
  EXTENSION_TRANSITIONS,
  evaluateExtensionTransition,
} from "@/lib/licensing/extension-lifecycle";
import { EXTENSION_INSTANCE_STATUSES } from "@/lib/licensing/vocabulary";

const ACTIONS = Object.values(ExtensionLifecycleAction);

describe("matriks transisi extension (LICENSE_MATRIX §5)", () => {
  it("tepat 6 aksi dengan from/to sesuai kontrak", () => {
    expect(Object.keys(EXTENSION_TRANSITIONS).sort()).toEqual([...ACTIONS].sort());
    expect(EXTENSION_TRANSITIONS.ASSIGN).toEqual({ from: ["PURCHASED"], to: "ASSIGNED" });
    expect(EXTENSION_TRANSITIONS.ACTIVATE).toEqual({ from: ["ASSIGNED", "RENEWED"], to: "ACTIVE" });
    expect(EXTENSION_TRANSITIONS.SUSPEND).toEqual({ from: ["ACTIVE"], to: "SUSPENDED" });
    expect(EXTENSION_TRANSITIONS.EXPIRE).toEqual({ from: ["ACTIVE", "SUSPENDED"], to: "EXPIRED" });
    expect(EXTENSION_TRANSITIONS.RENEW).toEqual({ from: ["SUSPENDED", "EXPIRED"], to: "RENEWED" });
    expect(EXTENSION_TRANSITIONS.REMOVE).toEqual({
      from: ["PURCHASED", "ASSIGNED", "ACTIVE", "SUSPENDED", "EXPIRED", "RENEWED"],
      to: "REMOVED",
    });
  });

  it("seluruh 49 pasangan (7 status × 7 aksi slot) ter-cover — hanya pasangan valid lolos", () => {
    const validPairs = new Set<string>();
    for (const action of ACTIONS) {
      for (const from of EXTENSION_TRANSITIONS[action].from) {
        validPairs.add(`${from}:${action}`);
      }
    }
    // ASSIGN 1 + ACTIVATE 2 + SUSPEND 1 + EXPIRE 2 + RENEW 2 + REMOVE 6 = 14
    expect(validPairs.size).toBe(14);

    let allowed = 0;
    for (const status of EXTENSION_INSTANCE_STATUSES) {
      for (const action of ACTIONS) {
        const result = evaluateExtensionTransition(action, status);
        if (validPairs.has(`${status}:${action}`)) {
          expect(result.ok).toBe(true);
          allowed += 1;
        } else {
          expect(result.ok).toBe(false);
          expect(result.to).toBeNull();
        }
      }
    }
    expect(allowed).toBe(14);
  });

  it("RENEWED tidak memberikan entitlement sampai ACTIVATE — RENEWED bukan status aktif", () => {
    expect(evaluateExtensionTransition(ExtensionLifecycleAction.ACTIVATE, "RENEWED").ok).toBe(true);
    // Dari RENEWED tidak ada jalur lain selain ACTIVATE dan REMOVE.
    expect(evaluateExtensionTransition(ExtensionLifecycleAction.RENEW, "RENEWED").ok).toBe(false);
    expect(evaluateExtensionTransition(ExtensionLifecycleAction.SUSPEND, "RENEWED").ok).toBe(false);
    expect(evaluateExtensionTransition(ExtensionLifecycleAction.EXPIRE, "RENEWED").ok).toBe(false);
    // RENEWED bukan bagian dari efek aktif: hanya tujuan ACTIVE yang berkontribusi.
    expect(EXTENSION_TRANSITIONS.RENEW.to).toBe("RENEWED");
    expect(EXTENSION_TRANSITIONS.RENEW.to === "ACTIVE").toBe(false);
  });

  it("REMOVED terminal — tidak ada aksi keluar; tidak menghapus data (status logis)", () => {
    for (const action of ACTIONS) {
      expect(evaluateExtensionTransition(action, "REMOVED").ok).toBe(false);
    }
    // REMOVE adalah transisi status (soft), bukan operasi hapus baris:
    // matriks hanya memetakan status → status.
    expect(EXTENSION_TRANSITIONS.REMOVE.to).toBe("REMOVED");
  });

  it("himpunan LIVE: PURCHASED/ASSIGNED/ACTIVE/SUSPENDED/RENEWED — EXPIRED & REMOVED bukan live", () => {
    expect([...EXTENSION_LIVE_STATUSES].sort()).toEqual(
      ["PURCHASED", "ASSIGNED", "ACTIVE", "SUSPENDED", "RENEWED"].sort()
    );
    expect(EXTENSION_LIVE_STATUSES).not.toContain("EXPIRED");
    expect(EXTENSION_LIVE_STATUSES).not.toContain("REMOVED");
  });

  it("status di luar vocabulary tidak pernah dilayani (fail closed)", () => {
    for (const action of ACTIONS) {
      expect(evaluateExtensionTransition(action, "UNKNOWN_STATE").ok).toBe(false);
    }
  });
});

describe("otorisasi aksi extension — kanonik vs fallback PROPOSED (ADR-025 §6)", () => {
  it("ASSIGN/RENEW/REMOVE memakai permission kanonik AUTHORIZATION_MODEL §4.6", () => {
    expect(EXTENSION_ACTION_AUTHORIZATION.ASSIGN.permission).toBe("extension.assign");
    expect(EXTENSION_ACTION_AUTHORIZATION.RENEW.permission).toBe("extension.renew.initiate");
    expect(EXTENSION_ACTION_AUTHORIZATION.REMOVE.permission).toBe("extension.remove");
  });

  it("ACTIVATE/SUSPEND/EXPIRE tanpa key kanonik — fallback owner PROPOSED, bukan kebijakan final", () => {
    for (const action of [
      ExtensionLifecycleAction.ACTIVATE,
      ExtensionLifecycleAction.SUSPEND,
      ExtensionLifecycleAction.EXPIRE,
    ] as const) {
      expect(EXTENSION_ACTION_AUTHORIZATION[action].permission).toBeNull();
      expect(EXTENSION_ACTION_AUTHORIZATION[action].ownerFallback).toBe("PROPOSED");
    }
  });
});
