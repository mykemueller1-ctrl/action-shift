import { scrapePdqZReport } from "./parse";
import { closeNight, type CloseInput, type CloseResult } from "./close";

/** Locked CTap morning job. Cursor implements fetch. Do not change the house. */
export const CTAP_INGEST = {
  house: "Community Tap",
  manager: "Kenzy",
  laborTargetPct: 28,
  houseInbox: "communitypizza2026@gmail.com",
  ownerCopyInbox: "mykemueller1@gmail.com",
  sender: "pdqreports@pdqpos.com",
  timezone: "America/Chicago",
  arrivesAfterHour: 6,
  runAfterHour: 8,
  runAtMinute: 5,
  subjectNeedle: "EOD Reports Generated From Community Pizza",
} as const;

export type MailFile = { filename: string; text?: string };

export function pickZReportSummary(files: MailFile[]): MailFile | undefined {
  return files.find((f) => /zreport[_\s-]*summary/i.test(f.filename));
}

export function isOwnerSeatForbidden(filename: string): boolean {
  return /void[_\s-]*promo|hourly[_\s-]*sales/i.test(filename);
}

export function ingestFromZText(text: string): {
  parsed: ReturnType<typeof scrapePdqZReport>;
  close?: CloseResult;
  error?: string;
} {
  const parsed = scrapePdqZReport(text);
  if (!parsed?.netSales || parsed.laborDollars == null) {
    return {
      parsed,
      error: "Need Subtotal and Labor Summary Total. Photos do not parse. Type the two numbers.",
    };
  }
  const input: CloseInput = {
    store: CTAP_INGEST.house,
    managerName: CTAP_INGEST.manager,
    laborTargetPct: CTAP_INGEST.laborTargetPct,
    netSales: parsed.netSales,
    laborDollars: parsed.laborDollars,
    businessDate: parsed.businessDate,
    hasFoodEvidence: false,
  };
  return { parsed, close: closeNight(input) };
}

export function morningGmailQuery(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `from:${CTAP_INGEST.sender} subject:EOD after:${y}/${m}/${d}`;
}
