// Dictionary bahasa Indonesia (default) — epicRider Phase 3.
// Objek ini adalah sumber kebenaran BENTUK (shape) dictionary: `Dictionary` diturunkan dari sini,
// dan dictionary lain wajib memenuhi bentuk yang sama (type-level parity, ADR-020).
// Semua copy bersifat netral: tanpa klaim produk, harga, atau status standar.

export const dictionary = {
  common: {
    appName: "epicRider",
    language: "Bahasa",
    switchLanguage: "Ganti bahasa",
    retry: "Coba lagi",
    close: "Tutup",
    menu: "Menu",
    demo: "Demo",
    demoNote: "Konten demo — bukan data nyata.",
  },
  showcase: {
    title: "Showcase fondasi — design token, i18n, dan komponen status",
    subtitle:
      "Halaman ini memamerkan fondasi Phase 3: token desain, mekanisme i18n, komponen status, dan konvensi kualitas. Semua teks diambil dari dictionary i18n.",
    sectionColors: "Warna semantik",
    sectionTypography: "Tipografi",
    sectionSpacing: "Spasi",
    sectionButtons: "Tombol",
    sectionForms: "Formulir",
    sectionStates: "Status layar",
    sectionBadges: "Lencana & peringatan",
    sectionFormatting: "Format tanggal, angka & mata uang",
    sectionResponsive: "Responsif",
    colorsNote: "Setiap swatch memakai token semantik dari globals.css — bukan warna literal.",
    colorDemoText: "Teks contoh",
    typographyNote: "Skala teks Tailwind (text-xs sampai text-4xl) dengan keluarga font Geist.",
    typographySample: "Kru produksi siap tampil",
    spacingNote:
      "Padding dan gap konsisten: p-4/p-6 untuk isi kartu, gap-4/gap-6 untuk jarak antar kartu.",
    spacingBox4: "Kotak p-4",
    spacingBox6: "Kotak p-6",
    buttonsNote: "Seluruh varian tombol shadcn/ui × ukuran, ditambah status loading dan disabled.",
    formsNote:
      "Kirim formulir kosong untuk melihat pesan validasi inline (aria-invalid + aria-describedby, bukan warna saja).",
    statesNote: "Panel demo status: pilih salah satu status untuk melihat pola UI-nya.",
    stateLoading: "Memuat",
    stateEmpty: "Kosong",
    stateError: "Gagal",
    stateSuccess: "Berhasil",
    statePermission: "Akses ditolak",
    badgesNote:
      "StatusBadge selalu memasangkan ikon dengan teks (tidak mengandalkan warna saja), memakai token status dari globals.css.",
    formatNote:
      "Format memakai Intl per locale. Tanggal memakai konstanta tetap (zona UTC) agar render server dan klien identik.",
    responsiveNote:
      "Grid contoh: 1 kolom (mobile) → 2 kolom (sm ≥640px) → 3 kolom (lg ≥1024px) → 4 kolom (xl ≥1280px).",
    responsiveCell: "Kolom",
  },
  states: {
    loading: "Memuat…",
    emptyTitle: "Belum ada data",
    emptyDesc: "Daftar masih kosong. Item yang dibuat akan tampil di sini.",
    errorTitle: "Terjadi kendala",
    errorDesc: "Data gagal dimuat. Coba lagi beberapa saat.",
    permissionTitle: "Akses ditolak",
    permissionDesc: "Anda tidak punya izin untuk melihat bagian ini.",
    successTitle: "Berhasil",
    successDesc: "Tindakan selesai dilakukan.",
  },
  forms: {
    nameLabel: "Nama",
    emailLabel: "Email",
    roleLabel: "Peran",
    namePlaceholder: "cth. Rani Pratama",
    emailPlaceholder: "nama@contoh.id",
    rolePlaceholder: "Pilih peran",
    roleOption1: "Operator",
    roleOption2: "Koordinator",
    roleOption3: "Teknisi",
    textareaLabel: "Catatan",
    consentLabel: "Formulir demo — tidak ada data yang dikirim ke server",
    helpText: "Semua bidang di bawah ini hanyalah contoh komponen formulir.",
    validationError: "Isi nama dan email sebelum mengirim.",
    submit: "Kirim",
    submitSuccess: "Formulir valid — contoh validasi inline berhasil.",
  },
  buttons: {
    primary: "Utama",
    secondary: "Sekunder",
    outline: "Outline",
    ghost: "Ghost",
    destructive: "Destruktif",
    link: "Tautan",
    disabled: "Nonaktif",
    loading: "Memuat",
  },
  status: {
    draft: "Draf",
    active: "Aktif",
    pending: "Menunggu",
    archived: "Diarsipkan",
    success: "Sukses",
    warning: "Peringatan",
    info: "Info",
    error: "Galat",
  },
  format: {
    dateLabel: "Tanggal (contoh tetap: 28 Okt 2026)",
    numberLabel: "Angka (1234567,89)",
    currencyLabel: "Mata uang (1500000)",
    currencyDemoNote:
      "Mata uang hanya demo format (IDR untuk locale id, USD untuk en) — bukan klaim komersial.",
  },
  footer: {
    foundationShowcase: "Showcase fondasi — Phase 3",
    noRealData: "Konten demo, tanpa data nyata",
    phaseLabel: "Phase 3",
  },
};

export type Dictionary = typeof dictionary;
