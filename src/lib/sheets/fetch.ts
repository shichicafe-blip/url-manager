import { buildGvizUrl, parseGoogleSheetsUrl } from "./parse-url";
import { parseGvizResponse } from "./parse-gviz";
import { analyzeSheet } from "./analyze";
import type { SheetPayload } from "./types";

const FETCH_TIMEOUT_MS = 15_000;

export async function fetchGoogleSheet(sheetUrl: string): Promise<SheetPayload> {
  const parsed = parseGoogleSheetsUrl(sheetUrl);
  if (!parsed) {
    throw new Error("GoogleスプレッドシートのURL形式が正しくありません");
  }

  const gvizUrl = buildGvizUrl(parsed.spreadsheetId, parsed.gid);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(gvizUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "SmartSheetViewer/1.0" },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          "シートが見つかりません。URLを確認するか、「リンクを知っている全員が閲覧可」に設定してください",
        );
      }
      throw new Error(`スプレッドシートの取得に失敗しました (${response.status})`);
    }

    const raw = await response.text();
    const data = parseGvizResponse(raw);

    if (data.rows.length === 0 && data.headers.length === 0) {
      throw new Error("シートにデータがありません");
    }

    const analysis = analyzeSheet(data);

    return {
      data,
      analysis,
      fetchedAt: new Date().toISOString(),
      spreadsheetId: parsed.spreadsheetId,
      gid: parsed.gid,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("スプレッドシートの取得がタイムアウトしました");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
