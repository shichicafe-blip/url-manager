export function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

export function getUrlIconColor(url: string, fallback = "#8E8E93"): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    let hash = 0;
    for (let i = 0; i < hostname.length; i += 1) {
      hash = hostname.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 45% 48%)`;
  } catch {
    return fallback;
  }
}
