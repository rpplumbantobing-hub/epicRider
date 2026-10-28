# STANDARD REGISTER — epicRider (ISOrider)

**Status dokumen:** Register metadata kandidat standar hasil Phase 1 (workstream WS-D), disinkronkan 2026-10-28 (rekonsiliasi pra-Phase 4) dengan metadata katalog yang dicatat owner di Master Control MC-V4 §7. **Tidak ada klaim kesesuaian, kepatuhan, atau sertifikasi apa pun** (MC-V4 §7; ISO_IMS_BLUEPRINT §5; rujukan historis "MC §9" = penomoran MC-V1 — lihat `CONTROL_REFERENCE_CROSSWALK.md`). Dokumen ini TIDAK menyatakan kesesuaian, kepatuhan, atau sertifikasi.
**Sumber daftar:** baseline kandidat owner (historical MC-V1 §9 — crosswalk `CONTROL_REFERENCE_CROSSWALK.md`; daftar kanonik kini hidup di register ini). ID STD-01..STD-10 konsisten dengan acceptance criteria REQ-071 ("STD-01..10").
**Sumber metadata edisi (pembaruan 2026-10-28):** katalog resmi ISO sebagaimana dicatat owner pada Master Control MC-V4 §7 dengan tanggal pemeriksaan **2026-10-28** — pernyataan lama "status penerbitan edisi 2026 tidak diketahui" untuk ISO 9001:2026, ISO 14001:2026 dan ISO 19011:2026 **sudah obsolete** (OBSOLETE_AND_SUPERSEDED_REGISTER §2). Catatan jujur: pemeriksaan katalog TIDAK diulang secara mandiri dari lingkungan pengembangan ini (akses iso.org tetap BLOCKED — F0-012); metadata edisi di bawah bersumber pada catatan pemeriksaan owner 2026-10-28, bukan verifikasi ulang oleh engineer.
**Bukti blocker verifikasi mandiri:** `PHASE_0_AUDIT_REPORT.md` evidence **F0-012** — dari lingkungan pengembangan/sandbox: `curl https://www.iso.org/standard/85590.html` → **HTTP 403**; `catalog.iso.org` → **HTTP 000** (connection failed). Juga tercatat di `ISO_IMS_BLUEPRINT.md` §1 dan ADR-002.
**Tanggal dokumen dibuat:** 2026-10-27 (Phase 1, WS-D). Disinkronkan: 2026-10-28 (metadata edisi per pemeriksaan katalog owner; MC-V4 §7).

---

## 1. Aturan pakai register

1. **Larangan keras:** standar **tanpa `VERIFIED date`** (dari sumber resmi) **TIDAK BOLEH dipakai untuk clause-mapping** (REQ-071; REQ-039). Gate ini mengikat mulai Phase 17 (IMS design). *(Pembaruan 2026-10-28: metadata edisi terbit per pemeriksaan katalog owner 2026-10-28 tercatat di §2 — metadata edisi BUKAN persetujuan mapping; kolom VERIFIED date/URL oleh verifier tetap kosong sampai prosedur §4 dijalankan dari lingkungan berakses.)*
2. Klasifikasi pada §2 adalah **klasifikasi KANDIDAT** yang diwarisi dari MC §9. Klasifikasi final (requirements standard / guidance / hukum-kontrak / best practice) baru berlaku setelah verifikasi per §4 dan dicatat di kolom hasil verifikasi.
3. **DILARANG menyalin teks standar berhak cipta** ke register, aplikasi, atau dokumen apa pun (MC-V4 §7; REQ-040). Register hanya menyimpan metadata: nomor, judul, edisi, status, URL sumber, tanggal verifikasi, owner.
4. Kolom "Status resmi (VERIFIED date/URL)" sengaja **KOSONG** (`—`) untuk semua baris — diisi hanya oleh verifier melalui prosedur §4 (dengan URL + tanggal + nama verifier). Mengisinya tanpa eksekusi §4 = pelanggaran aturan anti-halusinasi (MC-V4 §7/§11).
5. *(Diperbarui 2026-10-28)* Edisi bertahun **2026** (STD-01, STD-04, STD-08): per pemeriksaan katalog owner yang dicatat di MC-V4 §7 (tanggal pemeriksaan **2026-10-28**), **edisi ISO 9001:2026, ISO 14001:2026 dan ISO 19011:2026 tercatat sudah terbit (published)**. Pernyataan lama "status penerbitan TIDAK DIKETAHUI" untuk ketiganya sudah **obsolete** dan tidak boleh dipertahankan (OBSOLETE_AND_SUPERSEDED_REGISTER §2). Untuk standar lain: sebagian memiliki edisi terbit plus amendment, dan sebagian sedang under revision — register wajib menyatakan hal ini secara eksplisit tanpa mengarang rincian per-standar; cek ulang katalog resmi tetap wajib saat verifikasi §4 sebelum mapping/klaim apa pun.
6. Status "requirements/guidance" belum tentu sama dengan status "wajib hukum/kontrak" bagi pelanggan. Applicability per yurisdiksi/kontrak adalah keputusan bisnis/legal terpisah (OD-08, OD-09) — bukan kesimpulan engineer.
7. Perubahan isi register (edisi, status, klasifikasi) hanya boleh dilakukan setelah eksekusi prosedur §4 dan wajib mencatat tanggal, URL, dan nama verifier — kecuali sinkronisasi metadata bersumber eksplisit dari kontrol owner terbaru (seperti pembaruan 2026-10-28 ini), yang wajib mencantumkan sumber & tanggal pemeriksaan pemiliknya.

## 2. Register standar (STD-01..STD-10)

| STD-ID | Standar & edisi (kandidat MC) | Peran untuk ISOrider | Klasifikasi KANDIDAT (final menunggu verifikasi) | Status resmi (VERIFIED date/URL) | Status verifikasi Phase 1 | Sumber resmi untuk verifikasi | Owner verifikasi |
|---|---|---|---|---|---|---|---|
| STD-01 | ISO 9001 — quality management *(edisi **2026** — tercatat PUBLISHED per pemeriksaan katalog owner 2026-10-28, MC-V4 §7; verifikasi mandiri oleh verifier §4 tetap menunggu akses katalog — jangan kunci edisi tanpa VERIFIED date)* | Acuan modul mutu ISOrider: proses, kontrol mutu, dokumentasi, improvement | Requirements standard (kandidat dari MC) — belum final | `—` (KOSONG; menunggu verifier §4) | **PUBLISHED per catatan katalog owner 2026-10-28 (MC-V4 §7); verifikasi mandiri NOT VERIFIED — BLOCKED** (F0-012) | Katalog ISO: cari "ISO 9001" di https://www.iso.org (bagian standards/catalogue) atau https://catalog.iso.org; catat URL spesifik (pola `https://www.iso.org/standard/<id>.html`) saat verifikasi | Verifier ditunjuk owner (kandidat OD-160); usulan: IMS lead + konfirmasi owner |
| STD-02 | ISO 20121:2024 *(edisi per MC; belum diverifikasi)* | Acuan event sustainability management (relevan industri event) | Requirements standard (kandidat dari MC) — belum final | `—` | **NOT VERIFIED — BLOCKED** (F0-012) | idem pola STD-01 (pencarian katalog resmi) | idem |
| STD-03 | ISO 45001:2018 *(edisi per MC; cek amendment/corrigenda terbaru saat verifikasi)* | Acuan OH&S/K3 untuk modul HSE | Requirements standard (kandidat dari MC) — belum final | `—` | **NOT VERIFIED — BLOCKED** (F0-012) | idem | idem |
| STD-04 | ISO 14001 — environmental management *(edisi **2026** — tercatat PUBLISHED per pemeriksaan katalog owner 2026-10-28, MC-V4 §7; verifikasi mandiri oleh verifier §4 tetap menunggu akses katalog)* | Acuan modul lingkungan/sustainability | Requirements standard (kandidat dari MC) — belum final | `—` (KOSONG; menunggu verifier §4) | **PUBLISHED per catatan katalog owner 2026-10-28 (MC-V4 §7); verifikasi mandiri NOT VERIFIED — BLOCKED** (F0-012) | idem | idem |
| STD-05 | ISO/IEC 27001:2022 (+amendment yang relevan — daftar amendment belum diverifikasi) | Acuan ISMS/keamanan informasi | Requirements standard (kandidat dari MC) — belum final | `—` | **NOT VERIFIED — BLOCKED** (F0-012; edisi terbit + amendment tercatat ada secara umum per MC-V4 §7 — rincian dicek katalog saat verifikasi) | idem; catat juga amendment yang tercatat resmi di katalog | idem |
| STD-06 | ISO 22301:2019 (+amendment yang relevan — belum diverifikasi) | Acuan BCMS/business continuity | Requirements standard (kandidat dari MC) — belum final | `—` | **NOT VERIFIED — BLOCKED** (F0-012; sebagian standar memiliki edisi terbit + amendment / under revision per MC-V4 §7 — cek katalog saat verifikasi, jangan mengarang rincian) | idem | idem |
| STD-07 | ISO 31000:2018 | Kerangka risk management; **bukan standar sertifikasi** (MC §9) | Guidance (kandidat; MC §9 sudah memperingatkan jangan diperlakukan sebagai standar sertifikasi) — klasifikasi final tetap dicatat saat verifikasi | `—` | **NOT VERIFIED — BLOCKED** (F0-012) | idem | idem |
| STD-08 | ISO 19011 — auditing management systems *(edisi **2026** — tercatat PUBLISHED per pemeriksaan katalog owner 2026-10-28, MC-V4 §7; verifikasi mandiri oleh verifier §4 tetap menunggu akses katalog)* | Acuan program audit internal IMS (Audit Mode Phase 18/20) | Guidance (kandidat dari MC) — belum final | `—` (KOSONG; menunggu verifier §4) | **PUBLISHED per catatan katalog owner 2026-10-28 (MC-V4 §7); verifikasi mandiri NOT VERIFIED — BLOCKED** (F0-012) | idem | idem |
| STD-09 | ISO 10013:2021 | Acuan documented information untuk struktur manual/proses/SOP | Guidance (kandidat dari MC) — belum final | `—` | **NOT VERIFIED — BLOCKED** (F0-012) | idem | idem |
| STD-10 | ISO 10005:2018 | Acuan quality plans (rencana mutu per event/proyek) | Guidance (kandidat dari MC) — belum final | `—` | **NOT VERIFIED — BLOCKED** (F0-012) | idem | idem |

**Catatan kolom "Sumber resmi":** URL spesifik per standar (nomor dokumen di katalog) **belum dapat dicatat** karena katalog tidak dapat diakses dari lingkungan pengembangan (F0-012). Entri di atas hanya menunjuk **entry point katalog resmi**; URL spesifik + tanggal + verifier dicatat pada saat eksekusi §4. Jangan mengarang nomor/URL spesifik sebelum itu.

## 3. Klasifikasi — definisi & kewajiban pemisahan

Wajib dibedakan (MC §9) dan dicatat per standar saat verifikasi:

| Klasifikasi | Arti operasional untuk epicRider |
|---|---|
| **Requirements standard** | Berisi persyaratan yang dapat diaudit/disertifikasi; mapping klausul diperlukan untuk desain kontrol ISOrider. |
| **Guidance standard** | Rekomendasi/panduan; TIDAK untuk diaudit sebagai persyaratan; tidak boleh dijual/diklaim sebagai "compliance". |
| **Legal / regulatory** | Kewajiban hukum per yurisdiksi (mis. UU PDP, peraturan K3 lokal). Identifikasi HANYA dengan validasi ahli hukum (OD-09); engineer dilarang menyimpulkan. |
| **Best practice / internal** | Praktik yang diadopsi organisasi pelanggan tanpa kewajiban eksternal. |

Status hukum/kontraktual suatu standar bagi pelanggan tertentu adalah **keputusan bisnis/legal** (OD-08 untuk scope per segmen; OD-09 untuk kewajiban hukum lokal) dan tidak diputuskan di dokumen ini.

## 4. Prosedur verifikasi (wajib dieksekusi dari lingkungan dengan akses normal ke ISO)

**Prasyarat:** akses jaringan yang tidak memblokir `www.iso.org` dan `catalog.iso.org` (bukan sandbox pengembangan — lihat F0-012). Penunjukan verifier + penyediaan lingkungan akses = kandidat keputusan **OD-160** (lihat `NON_FUNCTIONAL_REQUIREMENTS.md` §OD-16x).

Checklist step-by-step — ulangi untuk SETIAP STD-01..STD-10:

1. ☐ **Tes akses dulu:** buka/curl halaman katalog resmi ISO. Jika masih 403/000 → hentikan, catat `BLOCKED` beserta bukti, jangan lanjut (jangan mencari sumber tidak resmi sebagai pengganti).
2. ☐ **Cari standar** di katalog resmi (pencarian nomor + judul). Jangan memakai ringkasan pihak ketiga sebagai sumber status.
3. ☐ **Catat dari halaman resmi katalog:**
   - ☐ Nomor & judul resmi terkini.
   - ☐ **Edisi terbit terbaru** + tahun; **amendment/corrigenda** yang terdaftar (untuk STD-03, STD-05, STD-06).
   - ☐ **Status resmi:** published / under development / under revision / withdrawn / stage (mis. WD–FDIS bila masih proses).
   - ☐ URL spesifik halaman katalog (pola `https://www.iso.org/standard/<id>.html` atau `catalog.iso.org`) + tanggal akses.
4. ☐ **Khusus STD-01, STD-04, STD-08 (kandidat edisi "2026"):** cek eksplisit apakah edisi tahun tersebut **sudah terbit** atau **masih dalam proses** (nomor edisi/tahun bisa berbeda dari kandidat MC). Catat hasil apa adanya; jangan mengunci edisi sebelum konfirmasi (kandidat keputusan **OD-161** menentukan kebijakan mapping bila masih in-process).
5. ☐ **Tetapkan klasifikasi final** (requirements / guidance / legal / best-practice, §3) + satu kalimat alasan berbasis halaman resmi (bukan kutipan teks standar).
6. ☐ **Catat verifier** (nama/role), tanggal verifikasi, dan tingkat confidence.
7. ☐ **Update register ini** (kolom "Status resmi" + status verifikasi) **dan** `ISO_IMS_BLUEPRINT.md` §1 dalam perubahan yang sama.
8. ☐ **Relevansi per segmen pelanggan** (yurisdiksi Indonesia, industri event/rental) dicatat sebagai input keputusan bisnis **OD-08** — bukan keputusan verifier.
9. ☐ **Sanity check hak cipta:** pastikan tidak ada teks standar verbatim yang masuk register/aplikasi (REQ-040; MC §9). Referensi hanya metadata.

**Output wajib per standar:** satu baris status berisi `VERIFIED — <tanggal> — <URL> — <edisi/status> — <verifier>` ATAU tetap `NOT VERIFIED — <alasan>`.

## 5. Penanggung jawab

| Peran | Tanggung jawab |
|---|---|
| **Owner (produk)** | Menunjuk verifier & memastikan lingkungan akses tersedia (kandidat OD-160); memutuskan scope standar per segmen (OD-08); menyetujui hasil verifikasi sebelum register dianggap final. |
| **Verifier (usulan: IMS lead)** | Mengeksekusi checklist §4 per standar; mencatat bukti (URL, tanggal, status edisi/amendment); mengupdate register + ISO_IMS_BLUEPRINT. |
| **Engineer/agent** | **Tidak boleh** mengklaim status/edisi standar tanpa baris VERIFIED di register; **tidak boleh** melakukan clause-mapping terhadap standar tanpa VERIFIED date (REQ-071, REQ-039). |
| **Ahli hukum/sustainability (bila diperlukan)** | Validasi klasifikasi legal dan applicability lokal (OD-09, OD-105) — bukan bagian verifikasi teknis katalog. |

## 6. Konsekuensi status BLOCKED terhadap roadmap

- Phase 17–21 (IMS) **tidak boleh** membuka desain clause-mapping dengan edisi yang belum terverifikasi (ADR-002; ROADMAP dependency #1; OD-08 ditambah catatan blocker teknis di `OPEN_DECISIONS.md`).
- Sampai verifikasi selesai, segala kebutuhan desain IMS boleh merujuk **struktur generik** dari MC (core flow, hirarki dokumen, traceability chain) yang tidak bergantung teks standar tertentu.
- Re-verifikasi minimal dilakukan: (a) saat pertama kali register dipakai untuk mapping, (b) sebelum rilis fitur yang mengklaim dukungan standar tertentu, (c) saat ada indikasi amendment/revisi baru.

---

*Riwayat: dibuat Phase 1 (WS-D, 2026-10-27) dari kandidat MC §9; semua status verifikasi diwariskan `NOT VERIFIED` dari Phase 0 (F0-012, ADR-002) tanpa perubahan. Disinkronkan 2026-10-28 (rekonsiliasi pra-Phase 4): metadata edisi ISO 9001:2026 / ISO 14001:2026 / ISO 19011:2026 = PUBLISHED per catatan pemeriksaan katalog owner 2026-10-28 (MC-V4 §7) — bukan verifikasi mandiri engineer; kolom VERIFIED date/URL tetap kosong menunggu prosedur §4. Tidak ada teks standar yang dikutip di dokumen ini; tidak ada klaim applicability/conformity/certification.*
