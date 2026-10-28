# ADR-019 — Build/type quality gates: hapus `ignoreBuildErrors`, aktifkan `reactStrictMode`, tambahkan typecheck

## Status

**ACCEPTED** (owner decision via Phase 3 prompt §5.1 — "Jangan menggunakan `ignoreBuildErrors: true`, disable lint/typecheck global"; 2026-10-28). Menyelesaikan sisi konfigurasi dari **OD-04** (kebijakan `ignoreBuildErrors`/`reactStrictMode`); sisa aspek OD-04 lain (pengetatan bertahap eslint/tsconfig) tetap terbuka sebagai rekomendasi.

## Context

- `next.config.ts` sejak scaffold: `typescript.ignoreBuildErrors: true` + `reactStrictMode: false` (audit Phase 0: risiko R; OD-04 OPEN).
- Lint tersedia (`eslint .`) tapi ±30 rule dimatikan; tidak ada script typecheck; tidak ada test framework.
- Owner prompt Phase 3 melarang eksplisit konfigurasi penyamar error.

## Options

1. Pertahankan `ignoreBuildErrors: true` hingga kode bebas error → menyamar error, melanggar instruksi owner. **REJECTED.**
2. Hapus flag + aktifkan strict mode + tambahkan `typecheck` script yang benar-benar menjalankan `tsc --noEmit` sebagai gate terpisah. **ACCEPTED.**

## Decision

1. Hapus `typescript.ignoreBuildErrors` dari `next.config.ts`.
2. `reactStrictMode: true`.
3. Script baru: `typecheck` = `tsc --noEmit` (harus exit 0 pada baseline Phase 3).
4. `lint` tetap gate; quality gates lint+typecheck+test masuk CI (`.github/workflows/ci.yml`).
5. Pengetatan eslint rule / `noImplicitAny` tidak dipaksa di Phase 3 (baseline tercatat di `PHASE_3_CURRENT_STATE_AUDIT.md` §3; pengetatan bertahap = rekomendasi ke depan, bukan klaim selesai).

## Consequences

- Error TS tidak lagi tersamar di build; compile-level evidence tersedia via `typecheck` meski build produksi tidak dieksekusi di sandbox (larangan platform — tercatat jujur sebagai NOT RUN).
- Risiko: error TS lama yang tadinya tersamar bisa muncul → wajib diperbaiki atau dicatat eksplisit sebelum acceptance.

## Evidence

- `next.config.ts` (sebelum/sesudah — git diff); `bun run typecheck` hasil aktual di `PHASE_3_REPORT.md`.
- Prompt owner: `upload/epicRider_Phase_3_Prompt_zai.md` §5.1; audit OD-04 di `OPEN_DECISIONS.md` §1.
