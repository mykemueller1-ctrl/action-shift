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
