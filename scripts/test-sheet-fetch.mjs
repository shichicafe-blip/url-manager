import { fetchGoogleSheet } from "../src/lib/sheets/fetch.ts";
import { isGoogleSheetsUrl, parseGoogleSheetsUrl } from "../src/lib/sheets/parse-url.ts";

const sampleUrl =
  "https://docs.google.com/spreadsheets/u/0/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0";

console.log("isGoogleSheetsUrl:", isGoogleSheetsUrl(sampleUrl));
console.log("parse:", parseGoogleSheetsUrl(sampleUrl));

const payload = await fetchGoogleSheet(sampleUrl);
console.log("rows:", payload.data.rows.length);
console.log("headers:", payload.data.headers.slice(0, 6));
console.log("recommendedView:", payload.analysis.recommendedView);
