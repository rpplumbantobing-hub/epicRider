// Utilitas label perangkat dari User-Agent — epicRider Phase 4 (REQ-048).
//
// Heuristik ringan (bukan parser UA penuh — tanpa dependency baru): menghasilkan
// label ramah seperti "Chrome · Android" untuk daftar sesi. Gagal dikenali →
// "Unknown device". Nilai hanya untuk DISPLAY; tidak dipakai keputusan keamanan.

export function describeUserAgent(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  let browser = "Unknown browser";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("opr/") || ua.includes("opera")) browser = "Opera";
  else if (ua.includes("chrome/") && !ua.includes("chromium")) browser = "Chrome";
  else if (ua.includes("chromium")) browser = "Chromium";
  else if (ua.includes("firefox/")) browser = "Firefox";
  else if (ua.includes("safari/") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("postman")) browser = "Postman";
  else if (ua.includes("curl")) browser = "curl";
  else if (ua.includes("bun") || ua.includes("node")) browser = "Runtime";

  let os = "Unknown OS";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
  else if (ua.includes("mac os") || ua.includes("macintosh")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";

  return `${browser} · ${os}`;
}
