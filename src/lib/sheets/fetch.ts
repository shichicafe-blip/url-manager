import { analyzeSheet } from "./analyze";
import { parseCsvResponse, parseGvizResponse } from "./parse-gviz";
import {
  buildCsvExportUrl,
  buildGvizUrl,
  buildPubCsvUrl,
  gidsToTry,
  normalizeGoogleSheetsUrl,
  parseGoogleSheetsUrl,
} from "./parse-url";
import type { SheetPayload } from "./types";

const FETCH_TIMEOUT_MS = 20_000;

const GOOGLE_ACCESS_ERRORS = [
  "リクエストされたファイルは存在しません",
  "Requested file was not found",
  "Requested file does not exist",
  "ページが見つかりません",
  "Page not found",
];

type FetchAttempt = {
  label: string;
  run: () => Promise<SheetPayload>;
};

export async function fetchGoogleSheet(sheetUrl: string): Promise<SheetPayload> {
  const parsed = parseGoogleSheetsUrl(sheetUrl);
  if (!parsed) {
    throw new Error("GoogleスプレッドシートのURL形式が正しくありません");
  }

  const errors: string[] = [];
  const attempts = buildAttempts(parsed.spreadsheetId, parsed.gid, parsed.isPublished);

  for (const attempt of attempts) {
    try {
      return await attempt.run();
    } catch (error) {
      errors.push(`${attempt.label}: ${error instanceof Error ? error.message : "失敗"}`);
    }
  }

  const uniqueErrors = [...new Set(errors)];
  throw new Error(
    uniqueErrors[0] ??
      "スプレッドシートを取得できませんでした。「リンクを知っている全員が閲覧可」に設定してください",
  );
}

function buildAttempts(
  spreadsheetId: string,
  preferredGid: string,
  isPublished: boolean,
): FetchAttempt[] {
  const attempts: FetchAttempt[] = [];
  const gids = gidsToTry(preferredGid);

  for (const gid of gids) {
    const gidLabel = gid ?? "default";
    attempts.push({
      label: `JSON(${gidLabel})`,
      run: () => fetchViaGviz(spreadsheetId, gid),
    });
    attempts.push({
      label: `CSV(${gidLabel})`,
      run: () => fetchViaCsv(spreadsheetId, gid),
    });
  }

  if (isPublished || spreadsheetId.startsWith("e/")) {
    for (const gid of gids) {
      const gidLabel = gid ?? "default";
      attempts.push({
        label: `公開CSV(${gidLabel})`,
        run: () => fetchViaPubCsv(spreadsheetId, gid),
      });
    }
  }

  return attempts;
}

async function fetchViaGviz(spreadsheetId: string, gid?: string): Promise<SheetPayload> {
  const raw = await fetchText(buildGvizUrl(spreadsheetId, gid));
  assertReadableGoogleResponse(raw);
  const data = parseGvizResponse(raw);
  return finalizePayload(data, spreadsheetId, gid ?? "0");
}

async function fetchViaCsv(spreadsheetId: string, gid?: string): Promise<SheetPayload> {
  const raw = await fetchText(buildCsvExportUrl(spreadsheetId, gid));
  assertReadableGoogleResponse(raw);
  const data = parseCsvResponse(raw);
  return finalizePayload(data, spreadsheetId, gid ?? "0");
}

async function fetchViaPubCsv(spreadsheetId: string, gid?: string): Promise<SheetPayload> {
  const raw = await fetchText(buildPubCsvUrl(spreadsheetId, gid));
  assertReadableGoogleResponse(raw);
  const data = parseCsvResponse(raw);
  return finalizePayload(data, spreadsheetId, gid ?? "0");
}

function assertReadableGoogleResponse(raw: string): void {
  if (raw.includes("accounts.google.com") || raw.includes("ServiceLogin")) {
    throw new Error("シートが非公開です。「リンクを知っている全員が閲覧可」に設定してください");
  }

  if (GOOGLE_ACCESS_ERRORS.some((message) => raw.includes(message))) {
    throw new Error(
      "スプレッドシートにアクセスできません。URLが正しいか、「リンクを知っている全員が閲覧可」になっているか確認してください",
    );
  }

  if (raw.trim().startsWith("<!DOCTYPE") || raw.trim().startsWith("<html")) {
    throw new Error("GoogleからHTMLが返されました。共有設定またはURLを確認してください");
  }
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

    const raw = await response.text();
    assertReadableGoogleResponse(raw);

    if (!response.ok) {
      throw new Error(`取得に失敗しました (${response.status})`);
    }

    return raw;
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

export { normalizeGoogleSheetsUrl };
