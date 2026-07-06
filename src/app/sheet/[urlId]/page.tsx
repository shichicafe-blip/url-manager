import { SheetViewer } from "@/components/sheets/SheetViewer";
import { getUrlById } from "@/features/urls/get-url-by-id";
import { isGoogleSheetsUrl } from "@/lib/sheets/parse-url";
import { redirect } from "next/navigation";

type SheetPageProps = {
  params: Promise<{ urlId: string }>;
};

export default async function SheetPage({ params }: SheetPageProps) {
  const { urlId } = await params;
  const urlRecord = await getUrlById(urlId);

  if (!urlRecord) {
    redirect("/");
  }

  if (!isGoogleSheetsUrl(urlRecord.url)) {
    redirect(urlRecord.url);
  }

  return <SheetViewer urlId={urlId} title={urlRecord.title} />;
}
