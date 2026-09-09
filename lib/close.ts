import { z } from "zod";

export const CloseInput = z.object({
  store: z.string().min(1).max(80).default("This house"),
  businessDate: z.string().min(4).max(32).optional(),
  netSales: z.number().positive(),
  laborDollars: z.number().nonnegative(),
  laborTargetPct: z.number().gt(0).lt(80).default(30),
  managerName: z.string().min(1).max(40).default("the manager"),
  hasFoodEvidence: z.boolean().default(false),
});

export type CloseInput = z.infer<typeof CloseInput>;

export type CloseResult = {
  store: string;
  businessDate: string | null;
  netSales: number;
  laborDollars: number;
  laborPct: number;
  targetPct: number;
  heavyDollars: number;
  heavyLine: string;
  verdict: "MOVE" | "HOLD" | "CLEAN";
  move: string;
  hold: string;
  sendText: string;
  formula: string;
  totalsLabel: "Typed totals";
  foodLabel: "Food is MISSING" | "Food evidence present";
  evidence: "VERIFIED-FROM-TYPED-TOTALS" | "MISSING-FOOD";
};

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function closeNight(raw: CloseInput): CloseResult {
  const laborPct = (raw.laborDollars / raw.netSales) * 100;
  const targetDollars = raw.netSales * (raw.laborTargetPct / 100);
  const heavyDollars = raw.laborDollars - targetDollars;
  const date = raw.businessDate ?? null;

  let verdict: CloseResult["verdict"] = "CLEAN";
  let move =
    "Labor is inside the house target. Keep the same plan tomorrow. Do not invent a cut.";

  if (heavyDollars > 25) {
    verdict = "MOVE";
    move = `Labor is ${money(heavyDollars)} heavy vs a ${raw.laborTargetPct.toFixed(0)}% floor. Cut one mid shift before the rush. Keep the peak window staffed.`;
  }

  const hold = raw.hasFoodEvidence
    ? "Food evidence is flagged present. Still do not blend a different day's mix into tonight's prime cost."
    : "HOLD food cost. No same-scope invoices and count. Invoice day is not daily prime.";

  if (!raw.hasFoodEvidence && verdict === "CLEAN") {
    verdict = "HOLD";
  }

  const sendText = [
    `Labor ${date ?? "last night"}: ${money(raw.laborDollars)} on ${money(raw.netSales)} net = ${laborPct.toFixed(2)}%.`,
    `Target here is ${raw.laborTargetPct.toFixed(0)}%.`,
    `Move: ${move}`,
    hold,
    "Reply with done or the reason it did not happen.",
  ].join("\n");

  return {
    store: raw.store,
    businessDate: date,
    netSales: raw.netSales,
    laborDollars: raw.laborDollars,
    laborPct,
    targetPct: raw.laborTargetPct,
    heavyDollars,
    heavyLine: `${money(heavyDollars)} heavy vs ${raw.laborTargetPct.toFixed(0)}%`,
    verdict,
    move,
    hold,
    sendText,
    formula: `${money(raw.laborDollars)} ÷ ${money(raw.netSales)} = ${laborPct.toFixed(2)}%`,
    totalsLabel: "Typed totals",
    foodLabel: raw.hasFoodEvidence ? "Food evidence present" : "Food is MISSING",
    evidence: raw.hasFoodEvidence ? "VERIFIED-FROM-TYPED-TOTALS" : "MISSING-FOOD",
  };
}
