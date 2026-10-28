# LICENSE / ENTITLEMENT MATRIX — epicRider

## 1. License tiers

Only:
- miniRider
- maxRider
- ISOrider

hiRider is NOT a license.

## 2. Tier inheritance

| Capability | miniRider | maxRider | ISOrider |
|---|---:|---:|---:|
| Core event workspace | ✓ | ✓ | ✓ |
| Home/Event/Asset/Team/Profile | ✓ | ✓ | ✓ |
| Technical rider | ✓ | ✓ | ✓ |
| Media kit | ✓ | ✓ | ✓ |
| Basic asset management | ✓ | ✓ | ✓ |
| CRM | — | ✓ | ✓ |
| Finance/commercial | — | ✓ | ✓ |
| Full asset/rental lifecycle | — | ✓ | ✓ |
| Advanced operational controls | — | ✓ | ✓ |
| IMS capability | — | — | ✓ |

These are target entitlements, not implementation evidence.

## 3. hiRider

hiRider is a portal/capability.

It supports:
- recruitment openings;
- candidate discovery;
- candidate profiles;
- skills;
- portfolio;
- application;
- shortlist;
- accept/reject/withdraw;
- assignment workflow.

It does NOT grant a license.

## 4. Store — tiga surface terpisah (koreksi owner 2026-10-28, ADR-018; F-03)

### License & Extension Shop
Surface **publik** di landing page untuk pembelian/perpanjangan lisensi dan extension epicRider.

Access rule:
- Melayani **calon pelanggan tanpa lisensi** (pembelian lisensi pertama) dan alur renewal yang disepakati.
- Harga/pajak/gateway/refund tidak diarang (OD-06).

### Public Store
Developer commerce storefront (produk developer).

Access rule:
**basic miniRider license required.**

Bukan jalur pembelian lisensi pertama — jalur tersebut ada di License & Extension Shop.

### Developer Equipment Store
miniRider only.

maxRider: denied.
ISOrider: denied (denial di-API diaudit — REQ-010).

## 5. Extension

Extension is additive to a tier, e.g.:
- additional workspace;
- additional seats;
- workspace landing;
- mobile/client extension.

Extension lifecycle:
`CATALOG → PURCHASED/ASSIGNED → ACTIVE → SUSPENDED/EXPIRED → RENEWED/REMOVED`

## 6. Enforcement

Effective access:
`Tier + Extension + Capability + Role/Permission + Context + Object State`

All sensitive checks server-side.
