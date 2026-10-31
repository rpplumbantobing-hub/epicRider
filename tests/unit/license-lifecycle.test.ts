// @vitest-environment node
// Unit test mesin transisi lisensi — epicRider Phase 5-D (ADR-025).
// Membuktikan dari lapisan PURE (tanpa I/O, tanpa DB, tanpa jam dinding):
// - Matriks 8 transisi kanonik (DMC §6.2; REQ-098) tepat — pasangan lain
//   ditolak fail-closed, termasuk EXPIRED → ACTIVE dan PURCHASED → DOWNGRADED.
// - Seluruh status vocabulary dapat dicapai (tidak ada status dead/unreachable)
//   dan RENEWAL_DUE punya pemetaan transisi yang jelas.
// - Efek entitlement deterministik: hanya transisi bertiba di ACTIVE yang
//   meng-grant (ENTITLEMENT_MODEL §4; OD-108 OPEN — tanpa semantik grace baru).
// - Mesin ini MURNI: keputusan = f(status, action) — tidak ada scheduler,
//   tidak ada pembacaan jam dinding di modul (verify-only; OD-108).

import { describe, expect, it } from "vitest";

import {
  LICENSE_ACTION_AUTHORIZATION,
  LicenseLifecycleAction,
} from "@/lib/licensing/lifecycle-shared";
import {
  LICENSE_TRANSITIONS,
  evaluateLicenseTransition,
  licenseTransitionEntitlementEffect,
} from "@/lib/licensing/license-lifecycle";
import { LICENSE_STATUSES } from "@/lib/licensing/vocabulary";

const ACTIONS = Object.values(LicenseLifecycleAction);

describe("matriks transisi lisensi — 8 aksi kanonik (DMC §6.2; REQ-098)", () => {
  it("tepat 8 aksi dengan from/to sesuai kontrak", () => {
    expect(Object.keys(LICENSE_TRANSITIONS).sort()).toEqual([...ACTIONS].sort());
    expect(LICENSE_TRANSITIONS.ACTIVATE).toEqual({ from: ["PURCHASED"], to: "ACTIVE" });
    expect(LICENSE_TRANSITIONS.RENEW).toEqual({ from: ["RENEWAL_DUE"], to: "ACTIVE" });
    expect(LICENSE_TRANSITIONS.TERM_END).toEqual({ from: ["ACTIVE"], to: "RENEWAL_DUE" });
    expect(LICENSE_TRANSITIONS.GRACE_ENTER).toEqual({ from: ["RENEWAL_DUE"], to: "GRACE" });
    expect(LICENSE_TRANSITIONS.RENEW_IN_GRACE).toEqual({ from: ["GRACE"], to: "ACTIVE" });
    expect(LICENSE_TRANSITIONS.GRACE_END).toEqual({ from: ["GRACE"], to: "EXPIRED" });
    expect(LICENSE_TRANSITIONS.DOWNGRADE).toEqual({ from: ["ACTIVE"], to: "DOWNGRADED" });
    expect(LICENSE_TRANSITIONS.REACTIVATE).toEqual({ from: ["DOWNGRADED"], to: "ACTIVE" });
  });

  it("seluruh pasangan valid diterima dengan tujuan yang benar", () => {
    for (const action of ACTIONS) {
      const rule = LICENSE_TRANSITIONS[action];
      for (const from of rule.from) {
        const result = evaluateLicenseTransition(action, from);
        expect(result.ok).toBe(true);
        expect(result.to).toBe(rule.to);
      }
    }
  });

  it("seluruh 48 pasangan (6 status × 8 aksi) ter-cover; hanya pasangan valid yang lolos", () => {
    const validPairs = new Set<string>();
    for (const action of ACTIONS) {
      for (const from of LICENSE_TRANSITIONS[action].from) {
        validPairs.add(`${from}:${action}`);
      }
    }
    // 8 aksi × satu status asal masing-masing (setiap aksi punya tepat satu from).
    expect(validPairs.size).toBe(8);

    let allowed = 0;
    for (const status of LICENSE_STATUSES) {
      for (const action of ACTIONS) {
        const result = evaluateLicenseTransition(action, status);
        if (validPairs.has(`${status}:${action}`)) {
          expect(result.ok).toBe(true);
          allowed += 1;
        } else {
          expect(result.ok).toBe(false);
          expect(result.to).toBeNull();
        }
      }
    }
    expect(allowed).toBe(8);
  });

  it("EXPIRED → ACTIVE langsung DITOLAK (tidak ditambahkan karena intuitif)", () => {
    expect(evaluateLicenseTransition(LicenseLifecycleAction.ACTIVATE, "EXPIRED").ok).toBe(false);
    expect(evaluateLicenseTransition(LicenseLifecycleAction.RENEW, "EXPIRED").ok).toBe(false);
    expect(evaluateLicenseTransition(LicenseLifecycleAction.REACTIVATE, "EXPIRED").ok).toBe(false);
    expect(evaluateLicenseTransition(LicenseLifecycleAction.RENEW_IN_GRACE, "EXPIRED").ok).toBe(false);
  });

  it("PURCHASED → DOWNGRADED DITOLAK (ambiguitas owner belum diselesaikan)", () => {
    expect(evaluateLicenseTransition(LicenseLifecycleAction.DOWNGRADE, "PURCHASED").ok).toBe(false);
  });

  it("status di luar vocabulary tidak pernah dilayani (fail closed)", () => {
    for (const action of ACTIONS) {
      const result = evaluateLicenseTransition(action, "SUPERSEDED");
      expect(result.ok).toBe(false);
    }
  });
});

describe("keterjangkauan status & pemetaan RENEWAL_DUE", () => {
  it("seluruh status vocabulary dapat dicapai — tidak ada status dead/unreachable", () => {
    const reachable = new Set<string>(["PURCHASED"]); // status awal
    let grew = true;
    while (grew) {
      grew = false;
      for (const action of ACTIONS) {
        const rule = LICENSE_TRANSITIONS[action];
        if (rule.from.every((from) => reachable.has(from)) && !reachable.has(rule.to)) {
          reachable.add(rule.to);
          grew = true;
        }
      }
    }
    expect([...reachable].sort()).toEqual([...LICENSE_STATUSES].sort());
  });

  it("RENEWAL_DUE punya pemetaan transisi yang jelas: RENEW → ACTIVE, GRACE_ENTER → GRACE", () => {
    expect(evaluateLicenseTransition(LicenseLifecycleAction.RENEW, "RENEWAL_DUE")).toEqual({
      ok: true,
      to: "ACTIVE",
      reasonCode: null,
    });
    expect(evaluateLicenseTransition(LicenseLifecycleAction.GRACE_ENTER, "RENEWAL_DUE")).toEqual({
      ok: true,
      to: "GRACE",
      reasonCode: null,
    });
    // Jalur lain dari RENEWAL_DUE tidak ada.
    expect(evaluateLicenseTransition(LicenseLifecycleAction.TERM_END, "RENEWAL_DUE").ok).toBe(false);
    expect(evaluateLicenseTransition(LicenseLifecycleAction.DOWNGRADE, "RENEWAL_DUE").ok).toBe(false);
  });

  it("EXPIRED terminal — tidak ada aksi keluar apa pun", () => {
    for (const action of ACTIONS) {
      expect(evaluateLicenseTransition(action, "EXPIRED").ok).toBe(false);
    }
  });
});

describe("efek entitlement transisi (ENTITLEMENT_MODEL §4)", () => {
  it("hanya transisi bertiba di ACTIVE yang meng-grant entitlement", () => {
    for (const action of ACTIONS) {
      const expected =
        LICENSE_TRANSITIONS[action].to === "ACTIVE"
          ? "ENTITLEMENT_GRANTED"
          : "ENTITLEMENT_NOT_GRANTED";
      expect(licenseTransitionEntitlementEffect(action)).toBe(expected);
    }
    expect(licenseTransitionEntitlementEffect(LicenseLifecycleAction.GRACE_ENTER)).toBe(
      "ENTITLEMENT_NOT_GRANTED"
    );
    expect(licenseTransitionEntitlementEffect(LicenseLifecycleAction.DOWNGRADE)).toBe(
      "ENTITLEMENT_NOT_GRANTED"
    );
  });
});

describe("otorisasi aksi — tabel eksplisit IMPLEMENTED vs PROPOSED (ADR-025 §6)", () => {
  it("RENEW & RENEW_IN_GRACE memakai permission kanonik license.renew.initiate", () => {
    expect(LICENSE_ACTION_AUTHORIZATION.RENEW.permission).toBe("license.renew.initiate");
    expect(LICENSE_ACTION_AUTHORIZATION.RENEW_IN_GRACE.permission).toBe("license.renew.initiate");
  });

  it("aksi tanpa key kanonik TIDAK dikarang permission-nya — ratifikasi owner ber-status PROPOSED (label keputusan menunggu, bukan jalur otorisasi — remediasi PR #4)", () => {
    for (const action of [
      LicenseLifecycleAction.ACTIVATE,
      LicenseLifecycleAction.TERM_END,
      LicenseLifecycleAction.GRACE_ENTER,
      LicenseLifecycleAction.GRACE_END,
      LicenseLifecycleAction.DOWNGRADE,
      LicenseLifecycleAction.REACTIVATE,
    ] as const) {
      expect(LICENSE_ACTION_AUTHORIZATION[action].permission).toBeNull();
      expect(LICENSE_ACTION_AUTHORIZATION[action].ownerRatificationStatus).toBe("PROPOSED");
    }
  });
});
