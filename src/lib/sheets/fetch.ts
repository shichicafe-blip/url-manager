import { analyzeSheet } from "./analyze";
import { parseCsvResponse, parseGvizResponse } from "./parse-gviz";
import {
  buildCsvExportUrl,
  buildGvizUrl,
  parseGoogleSheetsUrl,
} from "./parse-url";
import type { SheetPayload } from "./types";

const FETCH_TIMEOUT_MS = 20_000;

export async function fetchGoogleSheet(sheetUrl: string): Promise<SheetPayload> {
  const parsed = parseGoogleSheetsUrl(sheetUrl);
  if (!parsed) {
    throw new Error("GoogleスプレッドシートのURL形式が正しくありません");
  }

  const errors: string[] = [];

  try {
    const payload = await fetchViaGviz(parsed.spreadsheetId, parsed.gid);
    return payload;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "gviz取得失敗");
  }

  try {
    const payload = await fetchViaCsv(parsed.spreadsheetId, parsed.gid);
    return payload;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "CSV取得失敗");
  }

  throw new Error(
    errors.join(" / ") ||
      "スプレッドシートを取得できませんでした。「リンクを知っている全員が閲覧可」に設定してください",
  );
}

async function fetchViaGviz(spreadsheetId: string, gid: string): Promise<SheetPayload> {
  const gvizUrl = buildGvizUrl(spreadsheetId, gid);
  const raw = await fetchText(gvizUrl);

  if (raw.includes("accounts.google.com") || raw.includes("ServiceLogin")) {
    throw new Error("シートが非公開です。「リンクを知っている全員が閲覧可」に設定してください");
  }

  const data = parseGvizResponse(raw);
  return finalizePayload(data, spreadsheetId, gid);
}

async function fetchViaCsv(spreadsheetId: string, gid: string): Promise<SheetPayload> {
  const csvUrl = buildCsvExportUrl(spreadsheetId, gid);
  const raw = await fetchText(csvUrl);

  if (raw.includes("accounts.google.com") || raw.includes("ServiceLogin")) {
    throw new Error("シートが非公開です。「リンクを知っている全員が閲覧可」に設定してください");
  }

  if (raw.trim().startsWith("<!DOCTYPE") || raw.trim().startsWith("<html")) {
    throw new Error("CSV形式で取得できませんでした");
  }

  const data = parseCsvResponse(raw);
  return finalizePayload(data, spreadsheetId, gid);
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SmartSheetViewer/1.0; +https://url-manager-three.vercel.app)",
        Accept: "text/plain,text/csv,application/json,*/*",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("シートが見つかりません。URLまたはシートID(gid)を確認してください");
      }
      throw new Error(`取得に失敗しました (${response.status})`);
    }

    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("スプレッドシートの取得がタイムアウトしました");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function finalizePayload(
  data: SheetPayload["data"],
  spreadsheetId: string,
  gid: string,
): SheetPayload {
  if (data.rows.length === 0 && data.headers.length === 0) {
    throw new Error("シートにデータがありません");
  }

  const analysis = analyzeSheet(data);
  return {
    data,
    analysis,
    fetchedAt: new Date().toISOString(),
    spreadsheetId,
    gid,
  };
}
