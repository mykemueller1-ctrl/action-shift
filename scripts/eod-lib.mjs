/** House EOD pipe. No tokens in git. Do not parse Void_Promo. Do not mail Kenzy. */

export const HOUSE = {
  house: "Community Tap",
  manager: "Kenzy",
  laborTargetPct: 28,
  houseInbox: "communitypizza2026@gmail.com",
  sender: "pdqreports@pdqpos.com",
  gmailQuery: "from:pdqreports@pdqpos.com newer_than:1d subject:EOD",
};

export function hasHouseGmailEnv(env = process.env) {
  return Boolean(env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN);
}

export function isForbiddenName(filename = "") {
  return /void[_\s-]*promo|hourly[_\s-]*sales/i.test(filename);
}

export function pickZReportSummary(files) {
  const named = files.find((f) => /zreport[_\s-]*summary/i.test(f.filename || ""));
  if (named) return named;
  return files.find((f) => f.text && /labor summary/i.test(f.text) && /subtotal/i.test(f.text) && /z report|end of day/i.test(f.text));
}

export function scrapePdqZReport(text) {
  if (!/z report|end of day/i.test(text) || !/labor summary/i.test(text)) return null;
  const subtotal = text.match(/subtotal:\s*\$?\s*([0-9,]+(?:\.[0-9]{2}))/i);
  const laborSection = (text.split(/labor summary/i)[1] || "").split(/discount summary/i)[0];
  const laborTotal = laborSection.match(/total:\s*[\d,]+\s*\$?\s*([0-9,]+(?:\.[0-9]{2}))/i);
  const date = text.match(/business date:\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i);
  const netSales = subtotal ? Number(subtotal[1].replace(/,/g, "")) : undefined;
  const laborDollars = laborTotal ? Number(laborTotal[1].replace(/,/g, "")) : undefined;
  if (!(netSales && netSales > 0) && !(laborDollars != null && laborDollars >= 0)) return null;
  return {
    netSales: Number.isFinite(netSales) ? netSales : undefined,
    laborDollars: Number.isFinite(laborDollars) ? laborDollars : undefined,
    businessDate: date?.[1],
  };
}

const PARSE_FAIL =
  "Need Subtotal and Labor Summary Total. Photos do not parse. Type the two numbers.";
const NEED_Z =
  "Need the Z-report Summary PDF (Labor Summary + Subtotal). Hourly and void PDFs do not close the night.";
const NO_GMAIL =
  "House Gmail env is not set. Drop the Z-report or run npm run ingest on extracted text. Photos do not parse.";

export function blankClose(error) {
  return {
    house: HOUSE.house,
    manager: HOUSE.manager,
    laborTargetPct: HOUSE.laborTargetPct,
    food: "HOLD",
    source: "",
    gmailQuery: HOUSE.gmailQuery,
    sentToManager: false,
    error,
  };
}

export function runMorningIngest(files, prior = null, now = new Date()) {
  const allowed = (files || []).filter((f) => !isForbiddenName(f.filename));
  const picked = pickZReportSummary(allowed);
  if (!picked) return blankClose(NEED_Z);
  if (!picked.text?.trim()) return blankClose(PARSE_FAIL);
  const parsed = scrapePdqZReport(picked.text);
  if (!parsed?.netSales || parsed.laborDollars == null) return blankClose(PARSE_FAIL);
  const laborPct = (parsed.laborDollars / parsed.netSales) * 100;
  const heavyDollars = parsed.laborDollars - parsed.netSales * (HOUSE.laborTargetPct / 100);
  const sameNight = prior && prior.businessDate === parsed.businessDate;
  return {
    house: HOUSE.house,
    manager: HOUSE.manager,
    laborTargetPct: HOUSE.laborTargetPct,
    businessDate: parsed.businessDate,
    netSales: parsed.netSales,
    laborDollars: parsed.laborDollars,
    laborPct: Number(laborPct.toFixed(2)),
    heavyDollars: Number(heavyDollars.toFixed(2)),
    verdict: heavyDollars > 25 ? "MOVE" : "HOLD",
    food: "HOLD",
    source: "ZReport_Summary",
    ingestedAt: now.toISOString(),
    gmailQuery: HOUSE.gmailQuery,
    sentToManager: Boolean(sameNight && prior.sentToManager),
  };
}

export async function gmailAccessToken(env = process.env) {
  if (!hasHouseGmailEnv(env)) return { error: NO_GMAIL };
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GMAIL_CLIENT_ID,
      client_secret: env.GMAIL_CLIENT_SECRET,
      refresh_token: env.GMAIL_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) return { error: "House Gmail token failed. Type the two numbers. Photos do not parse." };
  return { token: json.access_token };
}

export async function fetchHouseEodFiles(env = process.env) {
  const auth = await gmailAccessToken(env);
  if (auth.error) return { error: auth.error, files: [] };
  const q = encodeURIComponent(HOUSE.gmailQuery);
  const list = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=5`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  const listed = await list.json().catch(() => ({}));
  if (!list.ok || !listed.messages?.length) {
    return { error: PARSE_FAIL, files: [] };
  }
  const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${listed.messages[0].id}?format=full`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  const msg = await msgRes.json().catch(() => ({}));
  const parts = [];
  const walk = (p) => {
    if (!p) return;
    if (p.filename) parts.push(p);
    (p.parts || []).forEach(walk);
  };
  walk(msg.payload);
  const z = parts.find((p) => /zreport[_\s-]*summary/i.test(p.filename || "") && !isForbiddenName(p.filename));
  if (!z?.body?.attachmentId) return { error: NEED_Z, files: [] };
  const attRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${listed.messages[0].id}/attachments/${z.body.attachmentId}`,
    { headers: { Authorization: `Bearer ${auth.token}` } },
  );
  const att = await attRes.json().catch(() => ({}));
  if (!att.data) return { error: PARSE_FAIL, files: [] };
  const buf = Buffer.from(att.data.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const asText = buf.toString("utf8");
  if (/labor summary/i.test(asText) && /subtotal/i.test(asText)) {
    return { files: [{ filename: z.filename, text: asText }] };
  }
  return {
    error: "Need extracted Z-report text. PDF has no text layer here. Type the two numbers. Photos do not parse.",
    files: [{ filename: z.filename, text: "" }],
  };
}
