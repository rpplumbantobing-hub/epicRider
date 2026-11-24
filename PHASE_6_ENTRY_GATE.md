# PHASE 6 ENTRY GATE — epicRider

**Tanggal:** 2026-11-24  
**Baseline:** `main` @ `bec9911862470796354e3175486b36d1b9d4a75e`  
**Status gate:** **PASS WITH LIMITATIONS — AUTHORIZED TO START THE DEFINED SCOPE**  
**Owner authorization:** Explicit owner authorization received 2026-11-24: Phase 6 may start after this Entry Gate and Acceptance Pack are prepared and verified. This is authorization to execute the bounded Phase 6 scope below; it is **not** ratification of any OPEN OD or PROPOSED ADR.

## 1. Tujuan dan batas otoritas

Gate ini memverifikasi kesiapan Phase 6 berdasarkan repository canonical, bukan sekadar keberadaan dokumen. Phase 6 pada ROADMAP adalah **Home/dashboard & event foundation**. Gate ini mengizinkan implementasi pada scope yang tidak membutuhkan keputusan owner baru. Scope yang bergantung pada keputusan terbuka tetap ditunda atau diblokir secara lokal; jangan mengarang keputusan untuk melanjutkannya.

Sumber status fase tetap `ROADMAP.md`. Dokumen ini tidak mengubah MASTER_CONTROL, tidak mengesahkan ADR yang PROPOSED, dan tidak menutup OD.

## 2. Baseline dan bukti preflight

| Pemeriksaan | Bukti yang dibaca | Hasil |
|---|---|---|
| Canonical main | `bec9911862470796354e3175486b36d1b9d4a75e` | PASS — baseline tetap |
| Phase 2 | `PHASE_2_ACCEPTANCE.md`, `PHASE_2_DEPENDENCY_MATRIX.md`, `ADR_REGISTER.md` | PARTIAL; owner ratification dan OD-01/OD-02 tetap terbuka |
| Phase 3 | `PHASE_3_ACCEPTANCE.md` + CI #66 | DONE/CLOSED; lint, typecheck, 354/354 tests, build pass |
| Phase 4 | `PHASE_4_ACCEPTANCE.md` + PR #1 post-merge CI | DONE/CLOSED with recorded limitations |
| Phase 5 | `PHASE_5_CLOSURE_REPORT.md` + 361/361 canonical re-run | DONE/CLOSED |
| Current CI baseline | [PR #10 CI run #70](https://github.com/rpplumbantobing-hub/epicRider/actions/runs/45324419935) | Success on the documentation-only candidate; source/runtime tree unchanged |
| Phase 6 artifacts | Recursive tree inspection | No Phase 6 gate/acceptance/implementation files existed before this pack |
| Runtime Event foundation | `prisma/schema.prisma`, `src/app/api/v1`, `src/lib` | No Event/EventAssignment Prisma models, event API routes, event services or event UI routes found |
| Existing foundations | Workspace/Membership schema, guards, policy, audit, i18n, workspace pages and integration tests | Reusable; preserve, extend additively |
| Existing public home | `src/app/page.tsx` renders public Showcase | Must remain intact; workspace Home is a separate workspace-scoped route |

The current main source/runtime baseline has already passed the canonical CI workflow. This is baseline evidence only; it does not prove Phase 6 behavior.

## 3. Scope authorized

### 3.1 In scope

1. Workspace-scoped Home/dashboard for a selected workspace.
2. Event foundation: create a basic event, list events visible to the actor, read event detail.
3. Event assignment foundation: owner assigns an ACTIVE workspace membership to an event; owner can revoke an assignment.
4. Event context indicator and safe switcher for members with multiple assignments.
5. Core navigation shell: Home, Event, Asset, Team, Profile. Reuse existing Team/membership and Profile/account capabilities; Asset may only show a truthful not-yet-available state until Phase 8.
6. Real-data summaries only: event counts/upcoming events, current membership count, and license/tier summary only if an existing authorized server-side read path can provide it. No fabricated tasks/assets/quotas.
7. Indonesian default + English dictionary parity, responsive web UI, full relevant UI states, server-side authorization, audit and regression tests.

### 3.2 Explicitly out of scope

- Technical rider/templates — Phase 7.
- Asset CRUD, asset sets/templates, QR/barcode and asset lifecycle — Phase 8 and later.
- Media kit/templates — Phase 9.
- Event chat, rundown, field reports and notification workflows — Phase 10.
- Dynamic workspace roles, a new `event manager` role or custom role editor — OD-122 OPEN.
- Seat quota numbers/enforcement — OD-05 remains partially decided; owner is excluded, but base quotas remain TBD.
- Production database selection or production migration strategy — OD-01 / ADR-006 OPEN.
- Android/iOS/Windows delivery decisions — OD-02 / ADR-007 OPEN.
- Offline-first queue/sync claims — OD-07 OPEN.
- Pricing, payment, billing, renewal/grace/expiry decisions — OD-06 / OD-108 OPEN.
- Full event lifecycle transitions (schedule/activate/complete/close/cancel/archive) — lifecycle is still PROPOSED and candidate C-3 in `DATA_MODEL_CONCEPT.md`; no ADR ID may be invented.
- Double-assignment conflict policy — OD-130 OPEN. Do not block, rank, auto-resolve or label schedule conflicts as a decided policy.
- Chat/rundown permissions or data models — Phase 10.
- Any new product tier or changes to miniRider/maxRider/ISOrider taxonomy.

## 4. Provisional implementation boundaries (not owner decisions)

These are narrow technical boundaries to let the bounded foundation proceed without pretending unresolved policy is settled:

1. **Event state:** a newly created event may be represented as `DRAFT` only, matching the proposed DMC vocabulary. Do not implement state transitions. This does not ratify the full event lifecycle.
2. **Assignment state:** implement only the minimum active/revoked relation (`ASSIGNED` / `REVOKED`) if needed for create/revoke. Do not implement OFFERED/DECLINED/COMPLETED or schedule-overlap semantics.
3. **Roles:** reuse only existing `owner` and `member` roles. The minimum Phase 6 binding is provisional: owner may create events/manage assignments and read workspace events; member may read only assigned events and switch among their own assignments. No new role is created; OD-122 remains OPEN.
4. **Ownership:** Event is workspace-owned. EventAssignment links an existing Membership to an Event; never link User directly to Event and never treat membership as assignment.
5. **Tenant integrity:** enforce workspace consistency at database constraints where supported and again in services/guards. Do not rely on UI filtering.
6. **Event access:** workspace owner is the manager exception described in `AUTHORIZATION_MODEL.md`; non-owner members require an active assignment for every event read. Verify on every request, including detail and context switch.
7. **Context:** selected workspace/event comes from the route/resource path and is revalidated server-side. Client state, query string or headers alone never grant access.
8. **Idempotency:** `API_ARCHITECTURE.md` D-2 is PROPOSED, not ratified. New resource-create endpoints must not claim replay safety unless implemented and tested. Reuse an existing generic mechanism if one is found; otherwise document the exact gap and stop the affected mutation before inventing a TTL, retention rule or global framework. Do not silently omit the gap from acceptance.
9. **Concurrency:** do not introduce update flows requiring unratified If-Match semantics unless the complete conflict behavior is implemented and tested. No last-write-wins.
10. **Audit:** reuse Phase 4 `logAudit`; event and assignment actions must be auditable, and denials are first-class. Do not log tokens, secrets or sensitive payloads.

## 5. Dashboard truthfulness and requirement decomposition

- Show only data returned by tenant-scoped server queries.
- Do not show task counts or asset counts as real values; those domains are not implemented in Phase 6/8/10.
- Do not invent numeric quota. If displayed, show the active member count and state that the tier quota is not yet set; owner exclusion remains governed by ADR-027.
- License/tier information may be shown only if the actor is authorized and the existing entitlement/license data can be read through a safe server-side path. Otherwise omit it or show an honest unavailable state.
- A zero-event workspace must show a real empty state and a next action.
- REQ-003 includes five core pages, but full Asset functionality belongs to Phase 8. Phase 6 may deliver the navigation shell and a clearly unavailable Asset page; **REQ-003 remains PARTIAL** until its full acceptance is met. Do not mark REQ-003 VERIFIED in Phase 6.

## 6. Entry criteria

| # | Criterion | Result |
|---|---|---|
| 1 | Phase 5 closed and no Phase 5 blocker to Phase 6 | PASS |
| 2 | Owner explicitly authorized Phase 6 after gate preparation/verification | PASS |
| 3 | Current canonical main and source/runtime baseline identified | PASS |
| 4 | Reusable identity, membership, authorization, entitlement, audit and i18n foundations inspected | PASS |
| 5 | Phase 6 requirements/use cases and later-phase boundaries identified | PASS |
| 6 | Open decisions and non-ratified ADRs explicitly protected | PASS |
| 7 | No existing Phase 6 implementation/gate artifacts to conflict with | PASS |
| 8 | CI baseline evidence available | PASS |
| 9 | Implementation plan, acceptance criteria, traceability and z.ai prompt prepared in this pack | PASS after PR CI and merge verification |

## 7. Stop conditions

Stop only the affected sub-scope and report evidence if implementation requires:
- owner approval of a new event lifecycle or an unregistered decision;
- a new role or role preset decision beyond the bounded owner/member binding above;
- production DB/client/offline decisions;
- OD-130 overlap policy;
- a new security exception, cross-tenant data path, destructive migration or unreviewed dependency;
- unimplemented idempotency behavior that cannot be delivered without an unapproved retention/TTL decision.

Do not work around a stop condition by inventing an OD/ADR ID or weakening authorization. Other independent in-scope work may continue if it does not depend on the blocked item.

## 8. Gate verdict

**PASS WITH LIMITATIONS — Phase 6 is authorized to start on the bounded scope in §3.1 and §4 once this pack is merged and its PR CI passes.** The unresolved items in §3.2 and §7 remain deferred/blocked sub-scopes, not implied approvals.

After merge, update `ROADMAP.md` to Phase 6 `IN PROGRESS`. Phase 6 is not DONE until every mandatory criterion in `PHASE_6_ACCEPTANCE.md` has evidence and known limitations are reported.
