const SHEETS_HOST = "docs.google.com/spreadsheets/d/";

export function isGoogleSheetsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "docs.google.com" && parsed.pathname.includes(SHEETS_HOST);
  } catch {
    return false;
  }
}

export function parseGoogleSheetsUrl(url: string): { spreadsheetId: string; gid: string } | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return null;

    const gidFromHash = parsed.hash.match(/gid=(\d+)/)?.[1];
    const gidFromQuery = parsed.searchParams.get("gid");
    return {
      spreadsheetId: match[1],
      gid: gidFromHash ?? gidFromQuery ?? "0",
    };
  } catch {
    return null;
  }
}

export function buildGvizUrl(spreadsheetId: string, gid: string): string {
  const params = new URLSearchParams({
    tqx: "out:json",
    gid,
    headers: "1",
  });
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?${params.toString()}`;
}
