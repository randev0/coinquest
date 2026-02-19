import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateInsights } from "@/lib/insights-generator";
import { getCurrentMonth } from "@/lib/utils";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || getCurrentMonth();

  if (!month.match(/^\d{4}-\d{2}$/)) {
    return NextResponse.json({ error: "Invalid month format" }, { status: 400 });
  }

  const data = await generateInsights(session.user.id, month);
  return NextResponse.json({ insights: data });
}
