import { NextResponse } from "next/server";
import { CloseInput, closeNight } from "@/lib/close";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CloseInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Need net sales and labor dollars for one store, one day.", detail: parsed.error.flatten() },
      { status: 400 },
    );
  }
  return NextResponse.json(closeNight(parsed.data));
}
