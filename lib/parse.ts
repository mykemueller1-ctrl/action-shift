/** Official PDQ Z-report. Net is Subtotal (ex-tax), not Grand Total. Labor is Labor Summary Total. */
export function scrapePdqZReport(text: string): {
  netSales?: number;
  laborDollars?: number;
  businessDate?: string;
} | null {
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

/** Pull net + labor from pasted Toast, PDQ Z-out, or notes. */
export function scrapeTotals(text: string): { netSales?: number; laborDollars?: number } {
  const z = scrapePdqZReport(text);
  if (z?.netSales && z.laborDollars != null) return { netSales: z.netSales, laborDollars: z.laborDollars };
  const labeledNet =
    text.match(/net(?:\s*sales)?[^0-9$]{0,16}\$?([0-9,]+(?:\.[0-9]{1,2})?)/i) ||
    text.match(/total\s*sales[^0-9$]{0,16}\$?([0-9,]+(?:\.[0-9]{1,2})?)/i) ||
    text.match(/sales\s*total[^0-9$]{0,16}\$?([0-9,]+(?:\.[0-9]{1,2})?)/i);
  const labeledLabor =
    text.match(/labor(?:\s*(?:dollars|cost|\$|hours))?[^0-9$]{0,20}\$?([0-9,]+(?:\.[0-9]{1,2})?)/i);
  const money = [...text.matchAll(/\$?([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?|[0-9]+\.[0-9]{2})/g)].map(
    (m) => Number(m[1].replace(/,/g, "")),
  );
  const netSales = labeledNet ? Number(labeledNet[1].replace(/,/g, "")) : money[0];
  const laborDollars = labeledLabor ? Number(labeledLabor[1].replace(/,/g, "")) : money[1];
  return {
    netSales: Number.isFinite(netSales) ? netSales : undefined,
    laborDollars: Number.isFinite(laborDollars) ? laborDollars : undefined,
  };
}

export type SalesMixBucket = "food" | "pop" | "liquor" | "beer";

export type SalesMixLine = {
  name: string;
  qty: number | null;
  amount: number;
};

export type SalesMix = {
  food: number;
  pop: number;
  liquor: number;
  beer: number;
  lines: SalesMixLine[];
  rolledIntoFood: SalesMixLine[];
};

/** Only four buckets. Pop, liquor, beer by name. Everything else — pizza, spec, unknown, negatives — is food until mapped. */
export function classifyMixBucket(name: string): SalesMixBucket {
  const n = name.toLowerCase().trim();
  if (/\bpop\b/.test(n) || /\bsoda\b/.test(n) || n.includes("soft drink") || n.includes("fountain")) return "pop";
  if (n.includes("liquor") || n.includes("spirit") || n.includes("cocktail") || /\bwine\b/.test(n)) return "liquor";
  if (/\bbeer\b/.test(n)) return "beer";
  return "food";
}

function menuCategoryBlock(raw: string): string | null {
  const start = raw.search(/menu\s+category(?!\s+total)/i);
  if (start < 0) return null;
  const rest = raw.slice(start);
  const totalAt = rest.search(/menu\s+category\s+total/i);
  if (totalAt > 0) return rest.slice(0, totalAt);
  const end = rest.search(/\b(labor\s+summary|discount\s+summary|^taxes\b)/im);
  return end > 0 ? rest.slice(0, end) : rest;
}

function parseMixAmount(token: string): number {
  const n = Number(token.replace(/[$,()\s]/g, ""));
  if (!Number.isFinite(n)) return NaN;
  return /^\(/.test(token.trim()) ? -Math.abs(n) : n;
}

const MIX_LINE =
  /([A-Za-z][A-Za-z0-9 &'/.-]*(?:\s+[A-Za-z][A-Za-z0-9 &'/.-]*)*)\s+(\d{1,4})\s+(\(\s*\$?-?[\d,]+\.\d{2}\s*\)|\$?-?[\d,]+\.\d{2})/g;

const SKIP_MIX_NAME = /^(name|qty|amount|total|category(?:\s+name)?)$/i;

function cleanMixName(raw: string): string | null {
  let name = raw.replace(/\s+/g, " ").trim();
  name = name.replace(/^menu category(?:\s+category)?(?:\s+name)?(?:\s+qty)?(?:\s+amount)?(?:\s+total)?\s+/i, "");
  if (!name || SKIP_MIX_NAME.test(name)) return null;
  return name;
}

/** PDQ Menu Category → food / pop / liquor / beer. Sales mix, not food cost. */
export function scrapePdqMenuMix(raw: string): SalesMix | null {
  const block = menuCategoryBlock(raw);
  if (!block) return null;
  const lines: SalesMixLine[] = [];
  for (const match of block.matchAll(MIX_LINE)) {
    const name = cleanMixName(match[1]);
    if (!name) continue;
    const amount = parseMixAmount(match[3]);
    if (!Number.isFinite(amount)) continue;
    const qty = Number(match[2]);
    lines.push({ name, qty: Number.isFinite(qty) ? qty : null, amount });
  }
  if (!lines.length) return null;
  const mix: SalesMix = { food: 0, pop: 0, liquor: 0, beer: 0, lines, rolledIntoFood: [] };
  for (const line of lines) {
    const bucket = classifyMixBucket(line.name);
    mix[bucket] += line.amount;
    if (bucket === "food" && !/^foods?$/i.test(line.name)) mix.rolledIntoFood.push(line);
  }
  for (const key of ["food", "pop", "liquor", "beer"] as const) {
    mix[key] = Math.round(mix[key] * 100) / 100;
  }
  return mix;
}
