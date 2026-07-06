import { getCurrentProfile } from "@/lib/auth/session";
import { fetchGoogleSheet } from "@/lib/sheets/fetch";
import { isGoogleSheetsUrl } from "@/lib/sheets/parse-url";
import { getUrlById } from "@/features/urls/get-url-by-id";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ urlId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { urlId } = await context.params;
  const urlRecord = await getUrlById(urlId);
  if (!urlRecord) {
    return NextResponse.json({ error: "URLが見つかりません" }, { status: 404 });
  }

  if (!isGoogleSheetsUrl(urlRecord.url)) {
    return NextResponse.json(
      { error: "GoogleスプレッドシートのURLではありません" },
      { status: 400 },
    );
  }

  try {
    const payload = await fetchGoogleSheet(urlRecord.url);
    return NextResponse.json({
      ...payload,
      title: urlRecord.title,
      urlId: urlRecord.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
