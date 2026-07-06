export type ParsedSheetUrl = {
  spreadsheetId: string;
  gid: string;
  isPublished: boolean;
};

const PUBLISHED_ID_PATTERN = /\/spreadsheets(?:\/u\/\d+)?\/d\/(e\/[A-Za-z0-9_-]+)/;
const STANDARD_ID_PATTERN = /\/spreadsheets(?:\/u\/\d+)?\/d\/([a-zA-Z0-9-_]+)/;

export function isGoogleSheetsUrl(url: string): boolean {
  return parseGoogleSheetsUrl(url) !== null;
}

export function normalizeGoogleSheetsUrl(url: string): string {
  return url.trim();
}

export function parseGoogleSheetsUrl(url: string): ParsedSheetUrl | null {
  try {
    const normalized = normalizeGoogleSheetsUrl(url);
    const parsed = new URL(normalized);

    if (!parsed.hostname.includes("docs.google.com")) return null;
    if (!parsed.pathname.includes("/spreadsheets")) return null;

    const openId = parsed.searchParams.get("id");
    if (parsed.pathname.includes("/spreadsheets/d/open") && openId) {
      return {
        spreadsheetId: openId,
        gid: extractGid(parsed),
        isPublished: false,
      };
    }

    const publishedMatch = parsed.pathname.match(PUBLISHED_ID_PATTERN);
    if (publishedMatch) {
      return {
        spreadsheetId: publishedMatch[1],
        gid: extractGid(parsed),
        isPublished: true,
      };
    }

    const standardMatch = parsed.pathname.match(STANDARD_ID_PATTERN);
    if (!standardMatch || standardMatch[1] === "e") return null;

    return {
      spreadsheetId: standardMatch[1],
      gid: extractGid(parsed),
      isPublished: parsed.pathname.includes("/pub"),
    };
  } catch {
    return null;
  }
}

function extractGid(parsed: URL): string {
  const fromHash = parsed.hash.match(/gid=(\d+)/)?.[1];
  const fromQuery = parsed.searchParams.get("gid");
  return fromHash ?? fromQuery ?? "0";
}

export function buildGvizUrl(spreadsheetId: string, gid?: string): string {
  const params = new URLSearchParams({ tqx: "out:json" });
  if (gid && gid !== "") params.set("gid", gid);
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?${params.toString()}`;
}

export function buildCsvExportUrl(spreadsheetId: string, gid?: string): string {
  const params = new URLSearchParams({ format: "csv" });
  if (gid && gid !== "") params.set("gid", gid);
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?${params.toString()}`;
}

export function buildPubCsvUrl(spreadsheetId: string, gid?: string): string {
  const params = new URLSearchParams({ output: "csv" });
  if (gid && gid !== "") params.set("gid", gid);
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/pub?${params.toString()}`;
}

export function gidsToTry(preferredGid: string): (string | undefined)[] {
  const list: (string | undefined)[] = [preferredGid, "0", undefined];
  const seen = new Set<string>();
  const result: (string | undefined)[] = [];

  for (const gid of list) {
    const key = gid ?? "__default__";
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(gid);
  }

  return result;
}
