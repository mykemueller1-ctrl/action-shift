/** Toast Sales Summary + Labor Breakdown. Totals only. Never invent food. */

export type CsvTotals = {
  netSales?: number;
  laborDollars?: number;
  source: string[];
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell.trim());
      cell = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else {
      cell += c;
    }
  }
  row.push(cell.trim());
  if (row.some((x) => x !== "")) rows.push(row);
  return rows;
}

function moneyCell(value: string): number | undefined {
  const cleaned = value.replace(/[$,\s]/g, "");
  if (!cleaned || cleaned === "-") return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function norm(header: string): string {
  return header.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function headerIndex(headers: string[], names: string[]): number {
  const normalized = headers.map(norm);
  for (const name of names) {
    const exact = normalized.findIndex((h) => h === name);
    if (exact >= 0) return exact;
    const loose = normalized.findIndex((h) => h.includes(name));
    if (loose >= 0) return loose;
  }
  return -1;
}

function isTotalRow(cells: string[]): boolean {
  const first = norm(cells[0] ?? "");
  return first === "total" || first === "grand total" || first === "totals";
}

const NET_HEADERS = ["net sales", "netsales", "net sales $", "net"];
const LABOR_HEADERS = ["total pay", "total labor", "labor cost", "labor dollars", "labor $", "labor"];

export function parseToastCsv(filename: string, text: string): CsvTotals {
  const source: string[] = [];
  const rows = parseCsv(text);
  if (rows.length < 2) return { source };

  const headers = rows[0];
  const netCol = headerIndex(headers, NET_HEADERS);
  const laborCol = headerIndex(headers, LABOR_HEADERS);
  const nameHint = filename.toLowerCase();

  let netSales: number | undefined;
  let laborDollars: number | undefined;

  const preferSales = /sales|summary/.test(nameHint);
  const preferLabor = /labor|breakdown|payroll/.test(nameHint);

  if (netCol >= 0 && !preferLabor) {
    for (const cells of rows.slice(1)) {
      if (isTotalRow(cells)) continue;
      const value = moneyCell(cells[netCol] ?? "");
      if (value !== undefined && value > 0) {
        netSales = value;
        break;
      }
    }
    if (netSales !== undefined) source.push(`${filename}: net`);
  }

  if (laborCol >= 0 && !preferSales) {
    let sum = 0;
    let saw = false;
    for (const cells of rows.slice(1)) {
      if (isTotalRow(cells)) continue;
      const value = moneyCell(cells[laborCol] ?? "");
      if (value !== undefined) {
        sum += value;
        saw = true;
      }
    }
    if (saw) {
      laborDollars = Number(sum.toFixed(2));
      source.push(`${filename}: labor`);
    }
  }

  return { netSales, laborDollars, source };
}

export function mergeCsvFiles(files: { name: string; text: string }[]): CsvTotals {
  const source: string[] = [];
  let netSales: number | undefined;
  let laborDollars: number | undefined;
  for (const file of files) {
    const parsed = parseToastCsv(file.name, file.text);
    if (parsed.netSales !== undefined) netSales = parsed.netSales;
    if (parsed.laborDollars !== undefined) laborDollars = parsed.laborDollars;
    source.push(...parsed.source);
  }
  return { netSales, laborDollars, source };
}
