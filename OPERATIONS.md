# OPERATIONS — epicRider

> **Referensi MC §N:** rujukan Master Control pada dokumen ini memakai penomoran era Phase 0/1 (MC-V1, §1–§15 — arsip: `audit/superseded/phase1-era-control/`). Interpretasi ke anchor kanonik aktif: `CONTROL_REFERENCE_CROSSWALK.md`. Substansi dokumen tidak diubah (aturan F-06).

## 1. CURRENT STATE — audit Phase 0 (2026-05-22)

| Aspek | Fakta | Status |
|---|---|---|
| Menjalankan dev | `bun run dev` → Next.js dev server port 3000, log ke `dev.log` (`package.json` baris 6) | `VERIFIED` |
| Produksi | Script `build` + `start` ada (`package.json` baris 7–8, output standalone) tetapi belum pernah dijalankan/dibuktikan pada Phase 0 | `NOT RUN` |
| CI/CD | Tidak ada (tanpa `.github/workflows`, tanpa pipeline config) | `NOT FOUND` |
| Deployment target | Tidak ada konfigurasi deployment (tanpa Dockerfile, IaC, platform config) | `NOT FOUND` |
| Database | SQLite file `db/custom.db` (sandbox); script `db:push/generate/migrate/reset` tersedia | `VERIFIED` (konfigurasi); backup: `NOT FOUND` |
| Backup/restore | Tidak ada prosedur/automation | `NOT FOUND` |
| Monitoring/logging | Log dev lokal `dev.log` saja; tidak ada monitoring/alerting/structured logging | `NOT FOUND` |
| Environments | Hanya lokal sandbox; `.env` 1 key (`DATABASE_URL`); tidak ada staging/production | `NOT FOUND` |
| Gateway | `Caddyfile` satu-port (sandbox) dengan routing `XTransformPort` | `VERIFIED` (sandbox-only) |
| Support/on-call | Tidak ada | `NOT FOUND` |

## 2. TARGET STATE — kebutuhan operasional (PROPOSED; dirinci saat mendekati launch)

1. **Deployment/release:** proses rilis terdokumentasi (build → test → deploy), rollback path; target lingkungan (hosting) = keputusan terbuka (OD-10), belum diputuskan — jangan mengarang pilihan.
2. **Backup/recovery:** backup otomatis DB terjadwal + uji restore berkala; retention policy. Untuk SQLite sandbox: minimal snapshot file saat prosedur berisiko.
3. **Monitoring:** health check, error tracking, uptime; log terstruktur tanpa secret.
4. **Environments:** pemisahan dev/staging/production; secrets management (tanpa secret di repo — MC §4).
5. **Migration ops:** semua schema change via migration terkontrol, reversible bila layak, mempertimbangkan data lama (MC §5); `db:push --accept-data-loss` TIDAK boleh dipakai di lingkungan dengan data nyata — dicatat sebagai risk R-05.
6. **Support:** kanal support, SLA internal, proses incident (menyatu dengan incident reporting maxRider di fase operasional).
7. **DR/continuity:** sejalan dengan ISOrider business continuity (Phase 19/25); dirinci nanti.

## 3. Command referensi yang valid saat ini (bukti Phase 0)

| Command | Fungsi | Catatan |
|---|---|---|
| `bun run dev` | Dev server :3000 | Sudah berjalan di sandbox |
| `bun run lint` | ESLint | Exit 0 pada 2026-05-22 |
| `bun run db:push` | Push schema Prisma (DESTRUCTIVE bila schema drift) | Jangan jalankan pada data nyata |
| `bun run build` / `start` | Build & start produksi | `NOT RUN` pada Phase 0 |

## 4. Perhatian operasional hasil audit
- Seluruh kode uncommitted → risiko kehilangan kerja; komit baseline disarankan segera (lihat GAP G-011; komit adalah aksi owner/agent fase berikut, Phase 0 tidak mengubah git state secara destruktif).
- `dev.log` & `server.log` di-gitignore — baik (tidak ada log sensitif ter-commit), tetapi juga berarti log produksi belum punya tujuan penyimpanan.
