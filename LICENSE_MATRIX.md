# LICENSE MATRIX — epicRider

**Status dokumen:** TARGET STATE dari Master Control §2/§3/§6. Tidak ada baris yang merupakan bukti implementasi — seluruh sel masih `PROPOSED` sampai fitur teruji. Harga, billing, pajak, refund, payment gateway **sengaja tidak dicantumkan** (keputusan bisnis terbuka; Master Control §3 melarang mengarang nilai).

## 1. Batas tier (TARGET)

| Kemampuan | miniRider | maxRider | ISOrider | hiRider |
|---|---|---|---|---|
| Workspace berbasis event | ✅ | ✅ (core) | ✅ (core) | ✅ |
| Home / Event / Asset / Team / Profile | ✅ | ✅ | ✅ | ✅ |
| Technical rider (draft) terhubung event | ✅ | ✅ | ✅ | — (via workspace) |
| Media kit dari template terkait event | ✅ | ✅ | ✅ | — |
| Aset dasar + asset/set template | ✅ | ✅ (diperkaya) | ✅ | — |
| Konteks event aktif kru + safe switch | ✅ | ✅ | ✅ | ✅ |
| Halaman event: Chat, Rundown, Media Kit, update laporan | ✅ | ✅ | ✅ | — |
| Developer Equipment Store **di dalam aplikasi** | ✅ hanya ini | ❌ diblokir API | ❌ diblokir API | ❌ diblokir API |
| Store publik lisensi/extension | ✅ | ✅ | ✅ | ✅ |
| CRM/pelanggan | ❌ | ✅ | ✅ | — |
| Keuangan/komersial | ❌ | ✅ | ✅ | — |
| Rental lifecycle penuh, QR/barcode, print, scan, maintenance, readiness | ❌ | ✅ | ✅ | — |
| Role/permission dinamis, workflow, dashboard, risk/HSE | ❌ | ✅ | ✅ | — |
| IMS digital (mutu, sustainability, HSE, infosec, continuity, risk, audit, NCR/CAPA, review) | ❌ | ❌ | ✅ | — |
| Marketplace kru/rekrutmen | ❌ | ❌ | ❌ | ✅ |
| Multi-workspace mandiri | sesuai lisensi | sesuai lisensi | sesuai lisensi | ✅ |

## 2. Batas kuantitatif (TARGET)

| Item | Nilai | Sumber & status |
|---|---|---|
| Maks kru per workspace (baseline) | 5 | MC §2. Keputusan terbuka: apakah owner dihitung dalam kuota (OD-05) — wajib diputuskan sebelum billing/seat enforcement dikunci. |
| Paket seat tambahan | +10 kru per workspace (extension potensial) | MC §3 — harga `UNKNOWN / NEEDS DECISION` |
| Workspace tambahan | Extension potensial | MC §3 — harga `UNKNOWN` |
| Mobile/tablet app | Extension potensial | MC §3 — strategi teknis menunggu ADR (OD-02) |
| Landing page workspace | Extension potensial | MC §3 — harga `UNKNOWN` |

## 3. Kontrol entitlement (TARGET — server-side)

1. Entitlement diperiksa di server untuk setiap akses fitur/objek; penyembunyian menu di UI bukan kontrol keamanan (MC §5).
2. Developer Equipment Store diblokir juga di API untuk tier non-miniRider (MC §6).
3. Developer Portal tidak otomatis memberi hak ubah lisensi/billing/notifikasi; role terpisah, least privilege; semua perubahan harga/stok/diskon/publikasi/notifikasi teraudit (MC §6).
4. Notifikasi developer: verifikasi hak, pratinjau penerima, pembatasan pengiriman, audit log, dedup/idempotency, status pengiriman, anti-abuse (MC §2).

## 4. Status verifikasi

| Area | Status |
|---|---|
| Implementasi entitlement mana pun | `NOT FOUND` (tidak ada kode domain di repository) |
| Test isolasi tier | `NOT FOUND` |
| Keputusan kuota seat (owner dihitung?) | `UNKNOWN / NEEDS DECISION` (OD-05) |
| Keputusan harga/billing/payment | `UNKNOWN / NEEDS DECISION` (OD-06) |
