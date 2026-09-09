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

export type LastClose = {
  house: "Community Tap";
  manager: "Kenzy";
  laborTargetPct: 28;
  businessDate?: string;
  netSales?: number;
  laborDollars?: number;
  food: "HOLD";
  source: "ZReport_Summary" | "";
  ingestedAt?: string;
  gmailQuery: string;
  error?: string;
  sentToManager: false;
};

const PARSE_FAIL =
  "Need Subtotal and Labor Summary Total. Photos do not parse. Type the two numbers.";
const NEED_Z =
  "Need the Z-report Summary PDF (Labor Summary + Subtotal). Hourly and void PDFs do not close the night.";

export function morningGmailQuery(_now = new Date()): string {
  return `from:${CTAP_INGEST.sender} newer_than:1d subject:EOD`;
}

export function isCtapEodSubject(subject: string): boolean {
  return /eod reports generated from community pizza/i.test(subject);
}

export function pickZReportSummary(files: MailFile[]): MailFile | undefined {
  return files.find((f) => /zreport[_\s-]*summary/i.test(f.filename));
}

export function isOwnerSeatForbidden(filename: string): boolean {
  return /void[_\s-]*promo|hourly[_\s-]*sales/i.test(filename);
}

export function chicagoCalendar(now = new Date()): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CTAP_INGEST.timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const n = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return {
    year: n("year"),
    month: n("month"),
    day: n("day"),
    hour: n("hour"),
    minute: n("minute"),
  };
}

export function isAfterRunTime(now = new Date()): boolean {
  const t = chicagoCalendar(now);
  return (
    t.hour > CTAP_INGEST.runAfterHour ||
    (t.hour === CTAP_INGEST.runAfterHour && t.minute >= CTAP_INGEST.runAtMinute)
  );
}

export function lastNightChicago(now = new Date()): { year: number; month: number; day: number } {
  const t = chicagoCalendar(now);
  const prev = new Date(Date.UTC(t.year, t.month - 1, t.day) - 86_400_000);
  return {
    year: prev.getUTCFullYear(),
    month: prev.getUTCMonth() + 1,
    day: prev.getUTCDate(),
  };
}

export function parseBusinessDate(value?: string): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const slash = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return { month: Number(slash[1]), day: Number(slash[2]), year: Number(slash[3]) };
  const iso = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) };
  return null;
}

export function isLastNight(businessDate: string | undefined, now = new Date()): boolean {
  const parsed = parseBusinessDate(businessDate);
  if (!parsed) return false;
  const y = lastNightChicago(now);
  return parsed.year === y.year && parsed.month === y.month && parsed.day === y.day;
}

export function blankLastClose(error?: string): LastClose {
  return {
    house: CTAP_INGEST.house,
    manager: CTAP_INGEST.manager,
    laborTargetPct: CTAP_INGEST.laborTargetPct,
    food: "HOLD",
    source: "",
    gmailQuery: morningGmailQuery(),
    sentToManager: false,
    ...(error ? { error } : {}),
  };
}

export function parseLastClose(raw: unknown): LastClose | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const net = typeof o.netSales === "number" ? o.netSales : Number(o.netSales);
  const labor = typeof o.laborDollars === "number" ? o.laborDollars : Number(o.laborDollars);
  const businessDate = typeof o.businessDate === "string" ? o.businessDate : undefined;
  const error = typeof o.error === "string" ? o.error : undefined;
  const close: LastClose = {
    house: CTAP_INGEST.house,
    manager: CTAP_INGEST.manager,
    laborTargetPct: CTAP_INGEST.laborTargetPct,
    food: "HOLD",
    source: o.source === "ZReport_Summary" ? "ZReport_Summary" : "",
    gmailQuery: typeof o.gmailQuery === "string" ? o.gmailQuery : morningGmailQuery(),
    sentToManager: false,
    ingestedAt: typeof o.ingestedAt === "string" ? o.ingestedAt : undefined,
    businessDate,
  };
  if (Number.isFinite(net) && net > 0) close.netSales = net;
  if (Number.isFinite(labor) && labor >= 0) close.laborDollars = labor;
  if (error) close.error = error;
  return close;
}

export function serializeLastClose(close: LastClose): string {
  return `${JSON.stringify(close, null, 2)}\n`;
}

export function ingestFromZText(text: string): {
  parsed: ReturnType<typeof scrapePdqZReport>;
  close?: CloseResult;
  error?: string;
} {
  const parsed = scrapePdqZReport(text);
  if (!parsed?.netSales || parsed.laborDollars == null) {
    return { parsed, error: PARSE_FAIL };
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

export function runMorningIngest(files: MailFile[], now = new Date()): LastClose {
  const allowed = files.filter((f) => !isOwnerSeatForbidden(f.filename));
  const picked = pickZReportSummary(allowed);
  if (!picked) return blankLastClose(NEED_Z);
  if (!picked.text?.trim()) return blankLastClose(PARSE_FAIL);
  const out = ingestFromZText(picked.text);
  if (out.error || !out.parsed?.netSales || out.parsed.laborDollars == null) {
    return blankLastClose(out.error ?? PARSE_FAIL);
  }
  return {
    house: CTAP_INGEST.house,
    manager: CTAP_INGEST.manager,
    laborTargetPct: CTAP_INGEST.laborTargetPct,
    businessDate: out.parsed.businessDate,
    netSales: out.parsed.netSales,
    laborDollars: out.parsed.laborDollars,
    food: "HOLD",
    source: "ZReport_Summary",
    ingestedAt: now.toISOString(),
    gmailQuery: morningGmailQuery(now),
    sentToManager: false,
  };
}

export function shouldPrefillDesk(
  close: LastClose | null | undefined,
  now = new Date(),
  pulled = false,
): boolean {
  if (!close) return false;
  if (close.error) return false;
  if (!(close.netSales && close.netSales > 0) || close.laborDollars == null) return false;
  if (!isLastNight(close.businessDate, now)) return false;
  return pulled || isAfterRunTime(now);
}

/** Apply last-close to the two CTap fields only. Never food. Never send. */
export function deskPrefillFromLastClose(close: LastClose): {
  netSales?: number;
  laborDollars?: number;
  businessDate?: string;
  foodFilled: false;
  sentToManager: false;
} {
  return {
    netSales: close.netSales,
    laborDollars: close.laborDollars,
    businessDate: close.businessDate,
    foodFilled: false,
    sentToManager: false,
  };
}

export async function fetchMorningClose(opts: {
  files?: MailFile[];
  lastClose?: LastClose | null;
  lastCloseJson?: string;
  now?: Date;
}): Promise<LastClose> {
  const now = opts.now ?? new Date();
  if (opts.files?.length) return runMorningIngest(opts.files, now);
  if (opts.lastClose) return parseLastClose(opts.lastClose) ?? blankLastClose(PARSE_FAIL);
  if (opts.lastCloseJson) {
    try {
      return parseLastClose(JSON.parse(opts.lastCloseJson)) ?? blankLastClose(PARSE_FAIL);
    } catch {
      return blankLastClose(PARSE_FAIL);
    }
  }
  return blankLastClose(PARSE_FAIL);
}
