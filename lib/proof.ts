/** Night proof. Verbal yes is not done. Do not change close math. */

export const PROOF_KINDS = [
  "deposit record",
  "receipt",
  "time-clock export",
  "ticket detail",
  "exception log",
] as const;

export type ProofKind = (typeof PROOF_KINDS)[number];

export const MOVE_STATES = [
  "open",
  "acknowledged",
  "done-awaiting-proof",
  "verified",
  "not-done",
  "data-missing",
  "fix-failed",
] as const;

export type MoveState = (typeof MOVE_STATES)[number];

export const CLAIM_BOUNDARY =
  "Typed values stay Unverified until reconciled to a source. Variance is review work. Not theft. Not guaranteed savings.";

export type LastMove = {
  house: "Community Tap";
  manager: "Kenzy";
  owner: "Kenzy";
  businessDate?: string;
  verdict?: "MOVE" | "HOLD" | "CLEAN" | "";
  action: string;
  observedDollars?: number;
  claimBoundary: string;
  evidenceStatus: MoveState;
  proofKind: ProofKind | "";
  proofNote: string;
};

export function emptyLastMove(): LastMove {
  return {
    house: "Community Tap",
    manager: "Kenzy",
    owner: "Kenzy",
    action: "",
    verdict: "",
    claimBoundary: CLAIM_BOUNDARY,
    evidenceStatus: "open",
    proofKind: "",
    proofNote: "",
  };
}

export function isAllowedProofKind(kind: string): kind is ProofKind {
  return (PROOF_KINDS as readonly string[]).includes(kind);
}

export function isForbiddenProof(text: string): boolean {
  return /schedule photo|who works|5\s*[-–to]+\s*7|void[_\s-]*promo/i.test(text);
}

/** Filename only. Do not parse payroll or staff names out of a time-clock file. */
export function proofKindFromFilename(name: string): ProofKind | "" {
  if (!name || isForbiddenProof(name) || /void[_\s-]*promo|hourly[_\s-]*sales/i.test(name)) return "";
  if (/time[_\s-]*clock|timecard/i.test(name)) return "time-clock export";
  if (/deposit/i.test(name)) return "deposit record";
  if (/receipt/i.test(name)) return "receipt";
  if (/ticket/i.test(name)) return "ticket detail";
  if (/exception/i.test(name)) return "exception log";
  return "";
}

/** One MOVE at a time. Do not fire a second labor cut until yesterday is verified or not-done. */
export function keepCooldownMove(prior: LastMove | null | undefined, next: LastMove): LastMove {
  if (isUnresolved(prior) && prior?.verdict === "MOVE") return prior;
  return next;
}

export function openMove(input: {
  businessDate?: string;
  verdict: "MOVE" | "HOLD" | "CLEAN";
  action: string;
  observedDollars?: number;
}): LastMove {
  return {
    ...emptyLastMove(),
    businessDate: input.businessDate,
    verdict: input.verdict,
    action: input.action,
    observedDollars: input.observedDollars,
    evidenceStatus: "open",
  };
}

export function replyToMove(move: LastMove, reply: string): LastMove {
  const t = reply.trim();
  if (isForbiddenProof(t)) return { ...move };
  if (/^(yes|done)$/i.test(t) && !move.proofKind) {
    return { ...move, evidenceStatus: "acknowledged" };
  }
  if (/^not[- ]?done$/i.test(t)) return { ...move, evidenceStatus: "not-done" };
  if (/data[ -]?missing/i.test(t)) return { ...move, evidenceStatus: "data-missing" };
  if (/fix[ -]?failed/i.test(t)) return { ...move, evidenceStatus: "fix-failed" };
  return move;
}

export function attachProof(move: LastMove, kind: string, note: string): LastMove {
  if (isForbiddenProof(`${kind} ${note}`)) return { ...move };
  if (!isAllowedProofKind(kind) || !note.trim()) return { ...move };
  return {
    ...move,
    proofKind: kind,
    proofNote: note.trim(),
    evidenceStatus: "done-awaiting-proof",
  };
}

/** Verified only when a proof kind is already attached. Yes/done never verifies. */
export function verifyMove(move: LastMove): LastMove {
  if (!move.proofKind || !isAllowedProofKind(move.proofKind)) {
    if (move.evidenceStatus === "open") return { ...move, evidenceStatus: "acknowledged" };
    return { ...move };
  }
  return { ...move, evidenceStatus: "verified" };
}

export function isUnresolved(move: LastMove | null | undefined): boolean {
  if (!move) return false;
  return move.evidenceStatus !== "verified" && move.evidenceStatus !== "not-done";
}

export function hasOpenMove(move: LastMove | null | undefined): boolean {
  if (!move) return false;
  return Boolean(move.action || move.verdict || move.observedDollars != null || move.businessDate);
}

function chicagoYmd(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const n = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { year: n("year"), month: n("month"), day: n("day") };
}

function parseBusinessDate(value?: string): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const slash = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return { month: Number(slash[1]), day: Number(slash[2]), year: Number(slash[3]) };
  const iso = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) };
  return null;
}

export function shouldCarryForward(move: LastMove | null | undefined, now = new Date()): boolean {
  if (!isUnresolved(move) || !hasOpenMove(move)) return false;
  const parsed = parseBusinessDate(move!.businessDate);
  if (!parsed) return true;
  const today = chicagoYmd(now);
  return !(parsed.year === today.year && parsed.month === today.month && parsed.day === today.day);
}

export function parseLastMove(raw: unknown): LastMove | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const base = emptyLastMove();
  const status = typeof o.evidenceStatus === "string" && (MOVE_STATES as readonly string[]).includes(o.evidenceStatus)
    ? (o.evidenceStatus as MoveState)
    : "open";
  const kind = typeof o.proofKind === "string" && isAllowedProofKind(o.proofKind) ? o.proofKind : "";
  const observed = Number(o.observedDollars);
  return {
    ...base,
    businessDate: typeof o.businessDate === "string" ? o.businessDate : undefined,
    verdict:
      o.verdict === "MOVE" || o.verdict === "HOLD" || o.verdict === "CLEAN" ? o.verdict : "",
    action: typeof o.action === "string" ? o.action : "",
    observedDollars: Number.isFinite(observed) ? observed : undefined,
    evidenceStatus: status,
    proofKind: kind,
    proofNote: typeof o.proofNote === "string" ? o.proofNote : "",
  };
}

export function serializeLastMove(move: LastMove): string {
  return `${JSON.stringify(move, null, 2)}\n`;
}
