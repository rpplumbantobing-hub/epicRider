# UX/UI STANDARD — epicRider

> **Referensi MC §N:** rujukan Master Control pada dokumen ini memakai penomoran era Phase 0/1 (MC-V1, §1–§15 — arsip: `audit/superseded/phase1-era-control/`). Interpretasi ke anchor kanonik aktif: `CONTROL_REFERENCE_CROSSWALK.md`. Substansi dokumen tidak diubah (aturan F-06).

**Sumber:** Master Control §7 (quality gate lintas fase) + hasil audit kondisi nyata Phase 0. Dokumen ini adalah **standar target yang mengikat setiap fase implementasi**. Audit UX/UI faktual per fase wajib dicatat (apa yang diuji vs tidak diuji).

---

## 1. Status audit UX/UI Phase 0 (CURRENT STATE, 2026-05-22)

| Area | Temuan | Status |
|---|---|---|
| Layar yang ada | 1 halaman `/` berisi logo placeholder (scaffold) | `VERIFIED` (screenshot `audit/evidence/current-home-*.png`) |
| Navigasi/hierarki aplikasi | Tidak ada | `NOT FOUND` |
| Komponen UI library | shadcn/ui lengkap (~52 komponen) terpasang, belum dipakai | `VERIFIED` (terpasang) / `NOT TESTED` (dipakai) |
| Responsive desktop/tablet/mobile | Hanya 1 layar statis teruji render pada 1440/768/390 px tanpa error; tidak ada layout aplikasi untuk dinilai | `NOT TESTED` (aplikasi) |
| Touch target, keyboard/focus, kontras | Tidak ada elemen interaktif aplikasi; tidak dinilai | `NOT TESTED` |
| State loading/empty/error/success/permission/offline | Tidak ada | `NOT FOUND` |
| i18n string | Semua string scaffold hard-coded Inggris (metadata, title); konfigurasi next-intl tidak ada | `NOT FOUND` (implementasi i18n) |
| Mobile distribution (PWA/wrapper/native/store) | Tidak ada manifest PWA/native project/signing | `NOT FOUND` |
| Console error saat render | Tidak ada error di console (hanya info dev standard) | `VERIFIED` |

Kesimpulan: tidak ada penilaian kualitas visual "baik/buruk" yang bisa dibuat karena belum ada UI produk. Audit detail menyusul per fase.

## 2. Standar desain (TARGET — mengikat semua fase)

### 2.1 Prinsip visual (MC §7)
1. Visual premium, modern, rapi, konsisten; hierarchy informasi kuat; layout bernapas; tipografi & warna terkontrol; tanpa ornamen berlebihan.
2. Interaksi intuitif: istilah konsisten (kamus istilah dibuat di Phase 1), navigasi prediktif, tugas utama minimal langkah wajar, konfirmasi untuk aksi berisiko, status proses selalu jelas.
3. Design tokens + komponen konsisten (basis: design system Phase 3); larang per-screen style menyimpang.

### 2.2 Responsive & perangkat (MC §7, §8)
1. Kanal utama web: desktop ≥1280, tablet 768–1024, mobile 360–430 px — semua fungsional.
2. Touch target minimum 44×44 px; formulir mudah di layar kecil; evaluasi fitur lapangan (event, rundown, checklist, bukti, inspeksi, laporan) untuk jaringan buruk.

### 2.3 Aksesibilitas (TARGET: WCAG 2.2 AA sejauh praktis & teruji)
- Kontras teks memenuhi AA; seluruh fungsi keyboard-operable dengan focus state jelas.
- Label programatik untuk semua input; heading berurutan; error ter-associasi dengan field; semantic HTML; `prefers-reduced-motion` dihormati.
- Bukti uji (automated + manual keyboard) wajib sebelum fase terkait dinyatakan DONE.

### 2.4 State lengkap (MC §7)
Setiap layar penting wajib mendefinisikan dan mengimplementasikan:
`loading`, `empty`, `error`, `success`, `permission denied`, `offline/sync pending` (bila relevan), `data stale` (bila relevan).

### 2.5 Anti-mockup (MC §7 — larangan keras)
1. Tidak ada tombol/link tanpa aksi end-to-end; tidak ada placeholder yang menyamar sebagai fitur selesai.
2. Chart/data bisnis palsu wajib berlabel demo jelas — lebih baik tidak ditampilkan.
3. Klaim usability tanpa evaluasi terdokumentasi dilarang.

### 2.6 Progressive disclosure (MC §7)
Default sederhana untuk pemula; kedalaman (keyboard, bulk, advanced filter) untuk operator ahli.

### 2.7 i18n UI (MC §5)
Bahasa Indonesia default; tidak ada hard-coded string UI; semua copy melalui locale files (siap EN).

### 2.8 Footer & layout kerangka (aturan platform)
- Footer (bila ada) wajib menempel di bawah viewport saat konten pendek dan terdorong natural saat konten panjang (pola `min-h-screen flex flex-col` + `mt-auto`), menghormati safe-area mobile.
- Padding/gap konsisten (`p-4/p-6`, `gap-4/gap-6`); daftar panjang ber-scroll dengan max-height dan scrollbar custom.

## 3. Gate per fase
Setiap fase implementasi wajib melampirkan: screenshot state utama, hasil responsive check (3 breakpoint), keyboard check, dan status uji aksesibilitas — sebelum klaim DONE. Laporan fase mencantumkan apa yang DIUJI vs TIDAK DIUJI.
