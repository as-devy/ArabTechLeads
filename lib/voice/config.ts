function cleanEnv(value?: string | null) {
  let next = value?.trim() ?? "";
  if (
    (next.startsWith('"') && next.endsWith('"')) ||
    (next.startsWith("'") && next.endsWith("'"))
  ) {
    next = next.slice(1, -1).trim();
  }
  return next;
}

export function getLiveKitApiKey() {
  return cleanEnv(process.env.LIVEKIT_API_KEY);
}

export function getLiveKitApiSecret() {
  return cleanEnv(process.env.LIVEKIT_API_SECRET);
}

export function normalizeLiveKitWsUrl(raw?: string | null) {
  let url = cleanEnv(raw);
  if (!url) return "";
  url = url.replace(/\/+$/, "");
  url = url.replace(/\/rtc$/i, "");
  if (url.startsWith("https://")) url = `wss://${url.slice("https://".length)}`;
  else if (url.startsWith("http://")) url = `ws://${url.slice("http://".length)}`;
  else if (!/^wss?:\/\//i.test(url)) url = `wss://${url}`;
  return url;
}

export function getLiveKitPublicUrl() {
  return (
    normalizeLiveKitWsUrl(process.env.NEXT_PUBLIC_LIVEKIT_URL) ||
    normalizeLiveKitWsUrl(process.env.LIVEKIT_URL)
  );
}

export function isLiveKitConfigured() {
  const url = getLiveKitPublicUrl();
  return Boolean(url && getLiveKitApiKey() && getLiveKitApiSecret() && /^wss?:\/\//i.test(url));
}

export function livekitHttpUrl() {
  return getLiveKitPublicUrl().replace(/^wss:/i, "https:").replace(/^ws:/i, "http:");
}
