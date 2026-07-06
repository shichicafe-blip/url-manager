const SPREADSHEET_ID_PATTERN = /\/spreadsheets(?:\/u\/\d+)?\/d\/([a-zA-Z0-9-_]+)/;

export function isGoogleSheetsUrl(url: string): boolean {
  return parseGoogleSheetsUrl(url) !== null;
}

export function parseGoogleSheetsUrl(url: string): { spreadsheetId: string; gid: string } | null {
  try {
    const parsed = new URL(url);

    if (!parsed.hostname.includes("docs.google.com")) return null;
    if (!parsed.pathname.includes("/spreadsheets")) return null;

    const openId = parsed.searchParams.get("id");
    if (parsed.pathname.includes("/spreadsheets/d/open") && openId) {
      return {
        spreadsheetId: openId,
        gid: extractGid(parsed),
      };
    }

    const match = parsed.pathname.match(SPREADSHEET_ID_PATTERN);
    if (!match) return null;

    return {
      spreadsheetId: match[1],
      gid: extractGid(parsed),
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

export function buildGvizUrl(spreadsheetId: string, gid: string): string {
  const params = new URLSearchParams({
    tqx: "out:json",
    gid,
  });
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?${params.toString()}`;
}

export function buildCsvExportUrl(spreadsheetId: string, gid: string): string {
  const params = new URLSearchParams({
    format: "csv",
    gid,
  });
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?${params.toString()}`;
}
