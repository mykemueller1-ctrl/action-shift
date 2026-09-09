const CHICAGO = "America/Chicago";

function chicagoParts(now: Date, hourCycle: "h23" | "h12" = "h23") {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

/** EOD lands 6–8 AM Central. Auto-fill starts at 08:00 America/Chicago. */
export function afterEightChicago(now: Date = new Date()): boolean {
  const { hour } = chicagoParts(now);
  return hour >= 8;
}

export function chicagoDateKey(now: Date = new Date()): string {
  const { year, month, day } = chicagoParts(now);
  return `${year}-${month}-${day}`;
}

export function pulledTodayChicago(pulledAt: string, now: Date = new Date()): boolean {
  const pulled = new Date(pulledAt);
  if (Number.isNaN(pulled.getTime())) return false;
  return chicagoDateKey(pulled) === chicagoDateKey(now);
}
