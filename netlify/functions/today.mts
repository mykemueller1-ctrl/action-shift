import type { Config, Context } from "@netlify/functions";

const CHICAGO = "America/Chicago";

function afterEightChicago(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: CHICAGO,
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now).find((p) => p.type === "hour")?.value ?? "0",
  );
  return hour >= 8;
}

export default async (_req: Request, _context: Context) => {
  if (!afterEightChicago()) {
    return Response.json({
      ready: false,
      timezone: CHICAGO,
      reason: "EOD lands 6–8 AM. Auto-fill after 8 AM Central.",
    });
  }
  return Response.json({
    ready: true,
    useStatic: true,
    timezone: CHICAGO,
    sourceHint: "House inbox · PDQ Z-report",
  });
};

export const config: Config = {
  path: "/api/today",
};
