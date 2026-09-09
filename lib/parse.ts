/** Pull net + labor from pasted Toast, PDQ Z-out, or notes. */
export function scrapeTotals(text: string): { netSales?: number; laborDollars?: number } {
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
