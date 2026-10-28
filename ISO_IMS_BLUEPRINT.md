# ISO / IMS BLUEPRINT — epicRider (ISOrider)

> **Referensi MC §N:** rujukan Master Control pada dokumen ini memakai penomoran era Phase 0/1 (MC-V1, §1–§15 — arsip: `audit/superseded/phase1-era-control/`). Interpretasi ke anchor kanonik aktif: `CONTROL_REFERENCE_CROSSWALK.md`. Substansi dokumen tidak diubah (aturan F-06).

**Status dokumen:** Kandidat standar dari Master Control §9 + status verifikasi Phase 0. Dokumen ini TIDAK menyatakan kesesuaian/sertifikasi apa pun. ISOrider adalah platform pendukung IMS, bukan jaminan sertifikasi (MC §9).

---

## 1. Tabel kandidat standar & status verifikasi

Tanggal percobaan verifikasi mandiri: **2026-05-22**, dari lingkungan sandbox audit. **Disinkronkan 2026-10-28** (rekonsiliasi pra-Phase 4): metadata katalog yang dicatat owner pada Master Control MC-V4 §7 (pemeriksaan **2026-10-28**) mencatat edisi terbit **ISO 9001:2026, ISO 14001:2026 dan ISO 19011:2026 (published)** — pernyataan lama "edisi 2026 belum diketahui statusnya" untuk ketiganya **obsolete** (OBSOLETE_AND_SUPERSEDED_REGISTER §2). Standar lain: sebagian memiliki edisi terbit plus amendment, sebagian under revision (tanpa rincian yang dikarang). Pemeriksaan katalog TIDAK diulang mandiri dari lingkungan ini (akses tetap BLOCKED — F0-012); metadata edisi bersumber pada catatan owner, kolom VERIFIED oleh verifier tetap menunggu prosedur `STANDARD_REGISTER.md` §4.

| Standar (kandidat MC) | Peran kandidat | Status verifikasi | Catatan |
|---|---|---|---|
| ISO 9001:2026 | Requirements — QMS | `NOT VERIFIED — BLOCKED` (verifikasi mandiri) | **Edisi 2026 tercatat PUBLISHED per pemeriksaan katalog owner 2026-10-28 (MC-V4 §7)** — bukan verifikasi engineer; VERIFIED date/URL oleh verifier tetap menunggu §4 STANDARD_REGISTER sebelum dipakai untuk mapping |
| ISO 20121:2024 | Requirements — event sustainability management | `NOT VERIFIED` — BLOCKED | idem — cek katalog saat verifikasi |
| ISO 45001:2018 | Requirements — OH&S | `NOT VERIFIED` — BLOCKED | Perlu cek amendment terbaru |
| ISO 14001:2026 | Requirements — environmental | `NOT VERIFIED — BLOCKED` (verifikasi mandiri) | **Edisi 2026 tercatat PUBLISHED per pemeriksaan katalog owner 2026-10-28 (MC-V4 §7)** — idem STD-01 |
| ISO/IEC 27001:2022 (+amendment) | Requirements — ISMS | `NOT VERIFIED` — BLOCKED | Perlu cek amendment (mis. climate 2024); edisi terbit + amendment ada secara umum per MC-V4 §7 |
| ISO 22301:2019 (+amendment) | Requirements — BCMS | `NOT VERIFIED` — BLOCKED | Perlu cek amendment |
| ISO 31000:2018 | **Guidance** — risk management (bukan standar sertifikasi) | `NOT VERIFIED` — BLOCKED | Wajib tetap diklasifikasi guidance, bukan requirement sertifikasi |
| ISO 19011:2026 | Guidance — auditing management systems | `NOT VERIFIED — BLOCKED` (verifikasi mandiri) | **Edisi 2026 tercatat PUBLISHED per pemeriksaan katalog owner 2026-10-28 (MC-V4 §7)** — idem STD-01 |
| ISO 10013:2021 | Guidance — documented information | `NOT VERIFIED` — BLOCKED | — |
| ISO 10005:2018 | Guidance — quality plans | `NOT VERIFIED` — BLOCKED | — |

**Bukti blocker (reproduksi):**
```
curl -A "Mozilla/5.0..." https://www.iso.org/standard/85590.html  → HTTP 403
curl -A "Mozilla/5.0..." https://catalog.iso.org/obp/ui/en/...    → HTTP 000 (connection failed)
```
Katalog resmi ISO menolak akses dari lingkungan sandbox audit (kemungkinan bot-protection). Verifikasi harus diulang dari lingkungan dengan akses normal ke `www.iso.org` / `catalog.iso.org`.

## 2. Daftar verifikasi wajib (checklist fase berikutnya — eksekusi dari lingkungan dengan akses ISO)

Untuk SETIAP standar di tabel §1, catat:
1. Nomor & judul resmi terkini.
2. Edisi/amendment terbit terbaru + status resmi (published/under revision/withdrawn).
3. Klasifikasi: requirements standard vs guidance vs hukum/kontrak vs best practice.
4. URL sumber resmi + tanggal verifikasi + confidence.
5. Relevansi untuk target pelanggan epicRider (yurisdiksi Indonesia, industri event/rental) — keputusan bisnis (OD-08).
6. Kebutuhan terjemahan: pakai metadata/mapping berlisensi; DILARANG menyalin teks standar berhak cipta ke aplikasi (MC §9, REQ-040).

## 3. Peta arsitektur IMS (TARGET — dari MC §5, §10; belum terimplementasi)

**Core flow:** Process → Control → Workflow → Transaction → Evidence → Report/Improvement.

**Traceability chain (TARGET):**
requirement/clause/reference → obligation/risk → control → process → procedure → workflow → transaction → record → evidence → approval/signature → finding → NCR/CAPA → effectiveness check/closure.

**Hirarki dokumen terkendali (TARGET):**
Policy → Manual → Process Map/Process → Procedure/SOP → Work Instruction → Form/Checklist → Record/Evidence → Report/Review Output.

**Status implementasi:** semua elemen di atas `NOT FOUND` di repository (audit Phase 0). Fase implementasi: Phase 17–21 (ROADMAP).

## 4. Sustainability (TARGET — MC §9)
Workflow event/project mencakup: tujuan/target, energi, bahan bakar, transportasi, air, limbah, material, reuse/rental, emisi/GHG (bila metodologi tersedia), aksesibilitas, inklusi, dampak komunitas, pengadaan/vendor, bukti, pemilik aksi, metrik, improvement.
Kaidah: setiap metrik menyimpan sumber, satuan, metode, periode, kualitas data. **Dilarang mengarang angka karbon / faktor emisi tanpa metodologi terverifikasi.**

## 5. Batas klaim
- Dokumen ini bukan pernyataan kepatuhan.
- Tidak ada klaim bahwa fitur apa pun "sesuai ISO" tanpa bukti end-to-end per fase.
- Kesimpulan legal/compliance hanya dengan validasi ahli + hukum lokal yang diidentifikasi per yurisdiksi (terbuka — OD-09).
